/**
 * AppaPost AI Engine - Ollama qwen3-vl:2b Primary Brain
 * 
 * Single source of truth for all social media copy generation.
 * Uses locally running Ollama with vision capabilities.
 */

import { readFile } from "fs/promises"
import { existsSync } from "fs"

// Configuration
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3-vl:2b"
const GROK_API_KEY = process.env.GROK_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// Platform type
export type Platform = "instagram" | "facebook" | "x" | "linkedin" | "tiktok" | "pinterest"

// Platform character limits
const PLATFORM_LIMITS: Record<Platform, number> = {
  instagram: 2200,
  facebook: 63206,
  x: 280,
  linkedin: 3000,
  tiktok: 150,
  pinterest: 500,
}

// Response types
export interface SocialVariant {
  text: string
  format: "text" | "carousel" | "video"
  media_urls: string[]
}

export interface PlatformVariants {
  platform: Platform
  variants: SocialVariant[]
}

export interface GenerateSocialVariantsParams {
  title: string
  excerpt?: string
  image_url?: string // Can be local file path or public URL
  type: "product" | "blog"
  platforms?: Platform[] // Optional, defaults to all
}

// In-memory cache (last 20 prompts/results)
const cache = new Map<string, PlatformVariants[]>()
const CACHE_SIZE = 20

// Hard-coded system prompt for perfection
const SYSTEM_PROMPT = `You are AppaPost — the witty, proudly South African social media manager for Apparely.co.za, a custom printed apparel brand based in Mzansi.

Your tone: fun, bold, cheeky, youthful, proudly local (use occasional SA slang like 'lekker', 'braai', 'eish', 'howzit' when it fits naturally).

Hashtags: always include #ApparelyCustom #PrintedWithPride #MzansiFashion and 2-4 relevant ones.

Call-to-action: always end with a clear CTA (shop link in bio, swipe up, tap to shop, DM us, etc).

Generate 3-5 PERFECT variations for EACH requested platform with these strict limits:
- Instagram: ≤2200 chars, carousel-friendly, line breaks + emojis encouraged
- Facebook: ≤63206 chars, friendly and detailed
- X/Twitter: ≤280 chars exactly (auto-trim if needed), punchy, threads if >280
- LinkedIn: professional but warm, ≤3000 chars, focus on brand story/creativity
- TikTok: ≤150 chars caption + 🔥 hook in first 3 seconds mindset
- Pinterest: ≤500 chars description, keyword-rich for SEO, aesthetic vibe

If an image_url is provided, describe what you "see" in the image first (qwen3-vl vision) and weave that into every caption naturally.

Output ONLY valid JSON matching this TypeScript interface (no extra text, no markdown, no code blocks):
{
  "platform": string,
  "variants": Array<{
    "text": string,
    "format": "text"|"carousel"|"video",
    "media_urls": string[]
  }>
}[]

Example: If image shows a bright yellow T-shirt with "Braai Master" print → every variant must reference the braai vibe, yellow colour, etc.`

/**
 * Call Ollama API with vision support for qwen3-vl:2b
 * 
 * qwen3-vl:2b expects BOTH:
 * 1. content array with text and image_url objects (OpenAI-compatible format)
 * 2. images array with base64/URL strings (Ollama-specific requirement)
 */
async function callOllama(
  prompt: string,
  images: string[] = []
): Promise<string> {
  const url = `${OLLAMA_URL}/api/chat`

  const messages: Array<{
    role: "system" | "user"
    content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }>
    images?: string[]
  }> = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
  ]

  // Build user message with optional images
  if (images.length > 0) {
    // qwen3-vl:2b requires BOTH formats for maximum compatibility
    const contentArray: Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: prompt },
    ]

    // Add each image to content array (OpenAI-compatible format)
    for (const image of images) {
      contentArray.push({
        type: "image_url",
        image_url: { url: image },
      })
    }

    messages.push({
      role: "user",
      content: contentArray, // OpenAI-compatible format
      images: images, // Ollama-specific requirement (qwen3-vl needs both)
    })
  } else {
    messages.push({
      role: "user",
      content: prompt,
    })
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: {
        temperature: 1.3, // High creativity
        top_p: 0.95,
        top_k: 40,
        repeat_penalty: 1.15,
        num_predict: 3000, // Increased for detailed responses
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Ollama API error: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  return data.message?.content || data.response || ""
}

/**
 * Fallback to Grok or OpenAI if Ollama fails
 */
async function fallbackAI(prompt: string): Promise<string> {
  // Try Grok first
  if (GROK_API_KEY) {
    try {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROK_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "grok-beta",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature: 1.3,
          max_tokens: 3000,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return data.choices[0]?.message?.content || ""
      }
    } catch (error) {
      console.warn("Grok fallback failed:", error)
    }
  }

  // Try OpenAI
  if (OPENAI_API_KEY) {
    try {
      const { default: OpenAI } = await import("openai")
      const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 1.3,
        max_tokens: 3000,
      })
      return completion.choices[0]?.message?.content || ""
    } catch (error) {
      console.warn("OpenAI fallback failed:", error)
    }
  }

  throw new Error("All AI services unavailable")
}

/**
 * Parse JSON response from AI (handles markdown code blocks)
 */
function parseAIResponse(response: string): PlatformVariants[] {
  // Try to extract JSON from markdown code blocks if present
  let jsonText = response.trim()

  // Remove markdown code blocks
  const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1].trim()
  }

  // Remove any leading/trailing non-JSON text
  const jsonStart = jsonText.indexOf("[")
  const jsonEnd = jsonText.lastIndexOf("]") + 1
  if (jsonStart >= 0 && jsonEnd > jsonStart) {
    jsonText = jsonText.substring(jsonStart, jsonEnd)
  }

  try {
    const parsed = JSON.parse(jsonText)
    if (!Array.isArray(parsed)) {
      throw new Error("Response is not an array")
    }
    return parsed as PlatformVariants[]
  } catch (error) {
    console.error("Failed to parse AI response:", error)
    console.error("Response was:", response.substring(0, 500))
    throw new Error(`Invalid JSON response from AI: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Enforce platform character limits
 */
function enforceLimits(variants: PlatformVariants[]): PlatformVariants[] {
  return variants.map((platformData) => {
    const limit = PLATFORM_LIMITS[platformData.platform]
    return {
      ...platformData,
      variants: platformData.variants.map((variant) => ({
        ...variant,
        text:
          variant.text.length > limit
            ? variant.text.substring(0, limit - 3) + "…"
            : variant.text,
      })),
    }
  })
}

/**
 * Generate cache key from params
 */
function getCacheKey(params: GenerateSocialVariantsParams): string {
  return JSON.stringify({
    title: params.title,
    excerpt: params.excerpt,
    image_url: params.image_url,
    type: params.type,
    platforms: params.platforms?.sort().join(",") || "all",
  })
}

/**
 * Main function: Generate social media variants using Ollama qwen3-vl:2b
 */
export async function generateSocialVariants(
  params: GenerateSocialVariantsParams
): Promise<PlatformVariants[]> {
  const {
    title,
    excerpt,
    image_url,
    type,
    platforms = ["instagram", "facebook", "x", "linkedin", "tiktok", "pinterest"],
  } = params

  // Check cache first
  const cacheKey = getCacheKey(params)
  if (cache.has(cacheKey)) {
    console.log("[AI] Cache hit for:", title)
    return cache.get(cacheKey)!
  }

  // Prepare images (supports remote URLs and local paths)
  let ollamaImages: string[] = []
  
  if (image_url) {
    try {
      if (image_url.startsWith("http://") || image_url.startsWith("https://")) {
        // Remote URL — qwen3-vl can fetch directly
        ollamaImages = [image_url]
      } else {
        // Local file (upload, public folder, or temp path)
        // Try filesystem first (for absolute paths and file:// URLs)
        let imageData: Buffer | null = null
        let mimeType = "image/jpeg"

        if (image_url.startsWith("file://")) {
          // file:// protocol - read from filesystem
          const filePath = image_url.replace("file://", "")
          if (existsSync(filePath)) {
            imageData = await readFile(filePath)
            mimeType = filePath.endsWith(".png") 
              ? "image/png" 
              : filePath.endsWith(".jpg") || filePath.endsWith(".jpeg") 
              ? "image/jpeg" 
              : filePath.endsWith(".webp")
              ? "image/webp"
              : "image/jpeg"
          }
        } else if (!image_url.startsWith("/") && existsSync(image_url)) {
          // Absolute file path
          imageData = await readFile(image_url)
          mimeType = image_url.endsWith(".png") 
            ? "image/png" 
            : image_url.endsWith(".jpg") || image_url.endsWith(".jpeg") 
            ? "image/jpeg" 
            : image_url.endsWith(".webp")
            ? "image/webp"
            : "image/jpeg"
        }

        if (imageData) {
          // Convert filesystem file to base64
          const base64 = imageData.toString("base64")
          ollamaImages = [`data:${mimeType};base64,${base64}`]
        } else {
          // Try fetching (for Next.js public folder paths like /uploads/tee.jpg)
          // In server context, we need to construct the full URL
          let fetchUrl = image_url
          
          // If it's a relative path starting with /, try to fetch from server
          if (image_url.startsWith("/")) {
            // Construct full URL for Next.js public assets
            const baseUrl = process.env.NEXT_PUBLIC_SITE_URL 
              ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
              : process.env.VERCEL_URL 
              ? `https://${process.env.VERCEL_URL}`
              : "http://localhost:3000"
            fetchUrl = `${baseUrl}${image_url}`
          }

          const response = await fetch(fetchUrl)
          if (!response.ok) throw new Error(`Image not found: ${response.status}`)
          
          const buffer = Buffer.from(await response.arrayBuffer())
          const base64 = buffer.toString("base64")
          mimeType = response.headers.get("content-type") || "image/jpeg"
          ollamaImages = [`data:${mimeType};base64,${base64}`]
        }
      }
    } catch (error) {
      console.warn("[AI] Vision failed (image skipped):", error)
      // Proceed without image — text-only generation still works
    }
  }

  // Build prompt
  const platformsList = platforms.join(", ")
  const prompt = `Generate social media variants for Apparely ${type}:

Title: ${title}
${excerpt ? `Description: ${excerpt}` : ""}
${ollamaImages.length > 0 ? "An image is provided - describe what you see and weave it into every caption." : "No image provided - focus on compelling text-only content."}

Generate variants for these platforms: ${platformsList}

Return JSON array with one object per platform, each containing 3-5 unique variants.`

  try {
    // Try Ollama first (primary)
    console.log(`[AI] Calling Ollama ${OLLAMA_MODEL} at ${OLLAMA_URL}${ollamaImages.length > 0 ? ` with ${ollamaImages.length} image(s)` : ""}`)
    const response = await callOllama(prompt, ollamaImages)
    console.log(`[AI] ✅ Ollama response received (${response.length} chars)`)

    let variants = parseAIResponse(response)
    variants = enforceLimits(variants)

    // Cache result
    if (cache.size >= CACHE_SIZE) {
      // Remove oldest entry (FIFO)
      const firstKey = cache.keys().next().value
      if (firstKey) {
        cache.delete(firstKey)
      }
    }
    cache.set(cacheKey, variants)

    return variants
  } catch (error) {
    console.warn(`[AI] ⚠️ Ollama failed, trying fallback:`, error)

    // Fallback to cloud AI (no image support in fallback)
    try {
      const response = await fallbackAI(prompt)
      let variants = parseAIResponse(response)
      variants = enforceLimits(variants)

      // Cache fallback result too
      if (cache.size >= CACHE_SIZE) {
        const firstKey = cache.keys().next().value
        if (firstKey) {
          cache.delete(firstKey)
        }
      }
      cache.set(cacheKey, variants)

      return variants
    } catch (fallbackError) {
      console.error("[AI] ❌ All AI services failed")
      throw new Error(
        `AI generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }
}

/**
 * Check if Ollama is online
 */
export async function checkOllamaStatus(): Promise<{ online: boolean; model?: string }> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(3000), // 3 second timeout
    })

    if (!response.ok) {
      return { online: false }
    }

    const data = await response.json()
    const models = data.models || []
    const hasModel = models.some((m: any) => m.name?.includes(OLLAMA_MODEL.split(":")[0]))

    return {
      online: true,
      model: hasModel ? OLLAMA_MODEL : undefined,
    }
  } catch (error) {
    return { online: false }
  }
}

/**
 * Legacy compatibility: Convert new format to old format
 * Handles both "twitter" and "x" platform names for backward compatibility
 */
export async function generateVariants(
  post: { title: string; excerpt?: string; image_url?: string; type: "product" | "blog" },
  platforms: Array<"instagram" | "facebook" | "twitter" | "x" | "linkedin" | "tiktok" | "pinterest"> = ["instagram", "facebook", "x", "linkedin", "tiktok", "pinterest"],
  brandSettings?: { brand_voice?: string; default_hashtags?: string[] } | null
): Promise<Record<"instagram" | "facebook" | "twitter" | "x" | "linkedin" | "tiktok" | "pinterest", Array<{ text: string; format: "text" | "carousel" | "video"; media_urls: string[]; char_limit: number; hashtags?: string[] }>>> {
  // Map "twitter" to "x" for new API (qwen3-vl uses "x")
  const mappedPlatforms = platforms.map((p) => (p === "twitter" ? "x" : p)) as Platform[]

  const result = await generateSocialVariants({
    title: post.title,
    excerpt: post.excerpt,
    image_url: post.image_url,
    type: post.type,
    platforms: mappedPlatforms,
  })

  // Convert to legacy format (support both "twitter" and "x" keys)
  const legacyResult: Record<string, Array<{ text: string; format: "text" | "carousel" | "video"; media_urls: string[]; char_limit: number; hashtags?: string[] }>> = {
    instagram: [],
    facebook: [],
    twitter: [], // Keep for backward compatibility
    x: [],
    linkedin: [],
    tiktok: [],
    pinterest: [],
  }

  for (const platformData of result) {
    const platform = platformData.platform
    const variants = platformData.variants.map((variant) => {
      // Extract hashtags from text
      const hashtagRegex = /#[\w]+/g
      const hashtags = variant.text.match(hashtagRegex)?.map((h) => h.substring(1)) || []

      return {
        text: variant.text,
        format: variant.format,
        media_urls: variant.media_urls,
        char_limit: PLATFORM_LIMITS[platform],
        hashtags,
      }
    })

    // Store under both "x" and "twitter" for compatibility
    legacyResult[platform] = variants
    if (platform === "x") {
      legacyResult.twitter = variants // Also store under "twitter" key
    }
  }

  return legacyResult as Record<"instagram" | "facebook" | "twitter" | "x" | "linkedin" | "tiktok" | "pinterest", Array<{ text: string; format: "text" | "carousel" | "video"; media_urls: string[]; char_limit: number; hashtags?: string[] }>>
}

/**
 * AppaPost AI Engine - Ollama qwen3-vl:2b Primary Brain
 * 
 * The ultimate, unbreakable AI engine for AppaPost (2025-2026).
 * Single source of truth for all social media copy generation.
 * Uses locally running Ollama with vision capabilities - faster, smarter, and more reliable than any cloud API.
 * 
 * @example
 * ```ts
 * // Basic usage
 * const variants = await generateSocialVariants({
 *   title: "New T-Shirt Collection",
 *   excerpt: "Check out our latest designs",
 *   image_url: "https://example.com/shirt.jpg",
 *   type: "product",
 *   platforms: ["instagram", "facebook", "x"]
 * })
 * 
 * // With local file
 * const variants = await generateSocialVariants({
 *   title: "Product Launch",
 *   image_url: "/uploads/product.jpg", // Works in dev, Vercel, production
 *   type: "product"
 * })
 * 
 * // React hook usage
 * const { isOnline, generate } = useOllama()
 * if (isOnline) {
 *   const result = await generate({ title: "Post", type: "product" })
 * }
 * ```
 * 
 * @module lib/ai
 * @author AppaPost Team
 * @version 2.0.0
 */

import { createHash } from "crypto"

// Configuration
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3-vl:2b"
const GROK_API_KEY = process.env.GROK_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// Platform type (using const values for better performance)
export const Platform = {
  INSTAGRAM: "instagram",
  FACEBOOK: "facebook",
  X: "x",
  LINKEDIN: "linkedin",
  TIKTOK: "tiktok",
  PINTEREST: "pinterest",
} as const

// Type alias for backward compatibility
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

// Rate limiting: max 5 concurrent Ollama calls
const MAX_CONCURRENT_CALLS = 5
let activeCalls = 0
const callQueue: Array<() => void> = []

/**
 * Queue management for rate limiting
 */
async function withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const execute = async () => {
      activeCalls++
      try {
        const result = await fn()
        resolve(result)
      } catch (error) {
        reject(error)
      } finally {
        activeCalls--
        if (callQueue.length > 0) {
          const next = callQueue.shift()!
          next()
        }
      }
    }

    if (activeCalls < MAX_CONCURRENT_CALLS) {
      execute()
    } else {
      callQueue.push(execute)
    }
  })
}

/**
 * Retry with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Only retry on 500s or timeout errors
      const isRetryable = 
        (error instanceof Error && error.message.includes("500")) ||
        (error instanceof Error && error.message.includes("timeout")) ||
        (error instanceof Error && error.message.includes("ECONNREFUSED"))

      if (!isRetryable || attempt === maxRetries - 1) {
        throw lastError
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))
      console.log(`[AI] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`)
    }
  }

  throw lastError || new Error("Retry failed")
}

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
 * 
 * Works in dev (localhost), Vercel preview, and production.
 * Includes streaming support, retry logic, and rate limiting.
 * 
 * @param prompt - The text prompt for generation
 * @param images - Array of image URLs or base64 data URLs
 * @param streamCallback - Optional callback for streaming chunks (for live UI updates)
 * @returns The complete generated text
 */
async function callOllama(
  prompt: string,
  images: string[] = [],
  streamCallback?: (chunk: string) => void
): Promise<string> {
  return withRateLimit(async () => {
    return withRetry(async () => {
      const url = `${OLLAMA_URL}/api/chat`

      const messages: Array<{
        role: "system" | "user"
        content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: string }>
        images?: string[]
      }> = [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
      ]

      // Build user message - bulletproof format for qwen3-vl:2b
      const fullPrompt = prompt
      const userMessage: {
        role: "user"
        content: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: string }>
        images?: string[]
      } = {
        role: "user",
        content: images.length > 0
          ? [
              { type: "text", text: fullPrompt },
              { type: "image_url", image_url: images[0] },
            ]
          : fullPrompt,
        images: images.length > 0 ? images : undefined,
      }

      messages.push(userMessage)

      const shouldStream = streamCallback !== undefined
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages,
          stream: shouldStream,
          options: {
            temperature: 1.1, // Perfect for brand voice (was 1.3 - too chaotic)
            top_p: 0.95,
            top_k: 40,
            repeat_penalty: 1.15,
            num_predict: 3000,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Ollama API error: ${response.status} ${errorText}`)
      }

      // Handle streaming
      if (shouldStream && streamCallback) {
        let fullText = ""
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error("Stream not available")
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n").filter((line) => line.trim())

          for (const line of lines) {
            try {
              const json = JSON.parse(line)
              const content = json.message?.content || json.response || ""
              if (content) {
                fullText += content
                streamCallback(content)
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }

        return fullText
      }

      // Non-streaming response
      const data = await response.json()
      return data.message?.content || data.response || ""
    })
  })
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
        temperature: 1.1, // Perfect for brand voice
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
 * Only adds "…" if truncation actually happened
 */
function enforceLimits(variants: PlatformVariants[]): PlatformVariants[] {
  return variants.map((platformData) => {
    const limit = PLATFORM_LIMITS[platformData.platform]
    return {
      ...platformData,
      variants: platformData.variants.map((variant) => {
        const wasTruncated = variant.text.length > limit
        return {
          ...variant,
          text: wasTruncated
            ? variant.text.substring(0, limit - 1) + "…"
            : variant.text,
        }
      }),
    }
  })
}

/**
 * Generate cache key from params (includes image hash for cache hits on same image)
 */
function getCacheKey(params: GenerateSocialVariantsParams): string {
  // Create hash of image URL for cache key (so same image + text = cache hit)
  let imageHash = ""
  if (params.image_url) {
    imageHash = createHash("md5").update(params.image_url).digest("hex").substring(0, 8)
  }

  return JSON.stringify({
    title: params.title,
    excerpt: params.excerpt,
    image_hash: imageHash,
    type: params.type,
    platforms: params.platforms?.sort().join(",") || "all",
  })
}

/**
 * Main function: Generate social media variants using Ollama qwen3-vl:2b
 * 
 * Returns variants array. Check for _visionFailed property (non-enumerable) if vision processing failed.
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

  // UNIVERSAL VISION SUPPORT — works 100% in dev + Vercel + file:// + public folder
  let ollamaImages: string[] = []
  let visionFailed = false

  if (image_url) {
    try {
      let imageData: ArrayBuffer
      let mimeType = "image/jpeg"

      if (image_url.startsWith("http://") || image_url.startsWith("https://")) {
        // Remote URL
        const res = await fetch(image_url)
        if (!res.ok) throw new Error("Remote image fetch failed")
        imageData = await res.arrayBuffer()
        mimeType = res.headers.get("content-type")?.split(";")[0] || "image/jpeg"
      } else {
        // Local path — resolve intelligently
        let resolvedPath = image_url

        // file:// protocol
        if (image_url.startsWith("file://")) resolvedPath = image_url.slice(7)
        // Relative path in public folder
        if (image_url.startsWith("/") && !image_url.startsWith("//")) {
          const base = process.env.NEXT_PUBLIC_SITE_URL || 
                       (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
          resolvedPath = `${base}${image_url}`
        }

        const res = await fetch(resolvedPath)
        if (!res.ok) throw new Error(`Local image not found: ${resolvedPath}`)
        imageData = await res.arrayBuffer()
        mimeType = res.headers.get("content-type")?.split(";")[0] || "image/jpeg"
      }

      const base64 = Buffer.from(imageData).toString("base64")
      ollamaImages = [`data:${mimeType};base64,${base64}`]
    } catch (err) {
      console.warn("[AI] Vision failed — continuing text-only:", err)
      visionFailed = true
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

    // Attach metadata for API routes (non-enumerable to avoid breaking existing code)
    if (visionFailed) {
      Object.defineProperty(variants, "_metadata", {
        value: { visionFailed: true },
        enumerable: false,
        writable: false,
      })
    }

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

      // Attach metadata for API routes (includes fallback flag for toast)
      Object.defineProperty(variants, "_metadata", {
        value: { visionFailed, fallbackUsed: true },
        enumerable: false,
        writable: false,
      })

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
 * Legacy compatibility: Convert new format to old format
 * Handles both "twitter" and "x" platform names for backward compatibility
 * 
 * Returns variants object with optional _visionFailed property (non-enumerable) if vision processing failed.
 */
export async function generateVariants(
  post: { title: string; excerpt?: string; image_url?: string; type: "product" | "blog" },
  platforms: Array<"instagram" | "facebook" | "twitter" | "x" | "linkedin" | "tiktok" | "pinterest"> = ["instagram", "facebook", "x", "linkedin", "tiktok", "pinterest"],
  brandSettings?: { brand_voice?: string; default_hashtags?: string[] } | null
): Promise<Record<"instagram" | "facebook" | "twitter" | "x" | "linkedin" | "tiktok" | "pinterest", Array<{ text: string; format: "text" | "carousel" | "video"; media_urls: string[]; char_limit: number; hashtags?: string[] }>> & { _visionFailed?: boolean }> {
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

  const finalResult = legacyResult as Record<"instagram" | "facebook" | "twitter" | "x" | "linkedin" | "tiktok" | "pinterest", Array<{ text: string; format: "text" | "carousel" | "video"; media_urls: string[]; char_limit: number; hashtags?: string[] }>>

  // Pass through vision failure flag from generateSocialVariants (if present)
  const visionFailed = (result as any)._metadata?.visionFailed
  if (visionFailed) {
    Object.defineProperty(finalResult, "_visionFailed", {
      value: true,
      enumerable: false,
      writable: false,
    })
  }

  return finalResult
}

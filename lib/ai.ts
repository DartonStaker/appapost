import OpenAI from "openai"
import axios from "axios"

const GROK_API_KEY = process.env.GROK_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3-vl:2b"

// Lazy initialization of OpenAI client (only when needed and API key is available)
function getOpenAIClient(): OpenAI | null {
  if (!OPENAI_API_KEY) {
    return null
  }
  return new OpenAI({
    apiKey: OPENAI_API_KEY,
  })
}

export type Platform = "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok" | "pinterest"

export interface PostVariant {
  text: string
  format: "text" | "carousel" | "video"
  media_urls: string[]
  char_limit: number
  hashtags?: string[]
}

export interface Post {
  title: string
  excerpt?: string
  image_url?: string
  type: "product" | "blog"
}

/**
 * Platform-specific character limits and formats
 */
const PLATFORM_LIMITS: Record<Platform, { charLimit: number; formats: string[] }> = {
  instagram: { charLimit: 2200, formats: ["text", "carousel", "video"] },
  facebook: { charLimit: 63206, formats: ["text", "carousel", "video"] },
  twitter: { charLimit: 280, formats: ["text"] },
  linkedin: { charLimit: 3000, formats: ["text", "carousel"] },
  tiktok: { charLimit: 150, formats: ["video"] },
  pinterest: { charLimit: 500, formats: ["text", "carousel"] },
}

/**
 * Generate AI content using Ollama (local, free) with fallback to Grok/OpenAI
 */
async function callAI(prompt: string): Promise<string> {
  const systemPrompt =
    "You are a social media content creator for Apparely, a South African fashion brand. Create engaging, fun, and brand-appropriate content with SA flair. Always include relevant hashtags like #ApparelyCustom #MzansiFashion."

  // Try Ollama first (local, free, unlimited)
  try {
    const response = await axios.post(
      `${OLLAMA_URL}/api/chat`,
      {
        model: OLLAMA_MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: false,
        options: {
          temperature: 0.8,
          num_predict: 2000,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout
      }
    )

    const content = response.data?.message?.content || response.data?.response || ""
    if (content) {
      return content
    }
  } catch (error) {
    // Ollama not available or error - fall through to cloud providers
    console.warn("Ollama not available, falling back to cloud AI:", error)
  }

  // Fallback to Grok (xAI)
  if (GROK_API_KEY) {
    try {
      const response = await axios.post(
        "https://api.x.ai/v1/chat/completions",
        {
          model: "grok-beta",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${GROK_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      )

      return response.data.choices[0]?.message?.content || ""
    } catch (error) {
      console.warn("Grok API failed, falling back to OpenAI:", error)
    }
  }

  // Fallback to OpenAI GPT-4o-mini
  const openai = getOpenAIClient()
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      })

      return completion.choices[0]?.message?.content || ""
    } catch (error) {
      console.error("OpenAI API error:", error)
      throw new Error("AI generation failed")
    }
  }

  throw new Error("No AI service available (Ollama, GROK_API_KEY, or OPENAI_API_KEY required)")
}

/**
 * Generate platform-specific variants for a post
 */
export async function generateVariants(
  post: Post,
  platforms: Platform[] = ["instagram", "facebook", "twitter", "linkedin", "tiktok", "pinterest"]
): Promise<Record<Platform, PostVariant[]>> {
  const results: Record<Platform, PostVariant[]> = {
    instagram: [],
    facebook: [],
    twitter: [],
    linkedin: [],
    tiktok: [],
    pinterest: [],
  }

  for (const platform of platforms) {
    const limits = PLATFORM_LIMITS[platform]
    const hasMedia = !!post.image_url

    // Build platform-specific prompt
    const prompt = `Generate 3-5 ${platform} post variations for Apparely ${post.type}:

Title: ${post.title}
${post.excerpt ? `Excerpt: ${post.excerpt}` : ""}
${hasMedia ? "Has image/video available" : "Text-only post"}

Requirements:
- Platform: ${platform}
- Character limit: ${limits.charLimit} characters
- Formats available: ${limits.formats.join(", ")}
- Style: SA flair, fun, engaging, brand-appropriate
- Include hashtags: #ApparelyCustom #MzansiFashion (add 2-3 more relevant ones)
- Include CTA when appropriate
${platform === "instagram" && hasMedia ? "- Use carousel format if multiple images available" : ""}
${platform === "twitter" ? "- Keep it concise, can use thread if needed" : ""}
${platform === "tiktok" ? "- Short, punchy, video-friendly caption" : ""}
${platform === "linkedin" ? "- Professional but approachable tone" : ""}
${platform === "pinterest" ? "- Descriptive, SEO-friendly" : ""}

Return ONLY the post text variations (one per line), no explanations. Each variation should be unique and optimized for ${platform}.`

    try {
      const aiResponse = await callAI(prompt)
      const variations = aiResponse
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .slice(0, 5) // Max 5 variations
        .map((text) => {
          // Extract hashtags
          const hashtagRegex = /#\w+/g
          const hashtags = text.match(hashtagRegex) || []

          // Determine format based on platform and media
          let format: "text" | "carousel" | "video" = "text"
          if (platform === "instagram" && hasMedia) {
            format = "carousel"
          } else if (platform === "tiktok" && hasMedia) {
            format = "video"
          }

          // Truncate to platform limit
          const truncatedText = text.substring(0, limits.charLimit)

          return {
            text: truncatedText,
            format,
            media_urls: hasMedia ? [post.image_url!] : [],
            char_limit: limits.charLimit,
            hashtags: hashtags.map((h) => h.substring(1)), // Remove # symbol
          }
        })

      results[platform] = variations
    } catch (error) {
      console.error(`Failed to generate variants for ${platform}:`, error)
      // Create a fallback variant
      results[platform] = [
        {
          text: `${post.title}${post.excerpt ? ` - ${post.excerpt}` : ""} #ApparelyCustom #MzansiFashion`,
          format: hasMedia && platform === "instagram" ? "carousel" : "text",
          media_urls: hasMedia ? [post.image_url!] : [],
          char_limit: limits.charLimit,
          hashtags: ["ApparelyCustom", "MzansiFashion"],
        },
      ]
    }
  }

  return results
}

/**
 * Truncate text to platform limit
 */
export function truncateForPlatform(text: string, platform: Platform): string {
  const limit = PLATFORM_LIMITS[platform].charLimit
  if (text.length <= limit) return text

  // Try to truncate at a word boundary
  const truncated = text.substring(0, limit - 3)
  const lastSpace = truncated.lastIndexOf(" ")
  if (lastSpace > limit * 0.8) {
    return truncated.substring(0, lastSpace) + "..."
  }

  return truncated + "..."
}


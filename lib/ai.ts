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
async function callAI(prompt: string, temperature: number = 1.2): Promise<string> {
  const systemPrompt = `You are a professional Social Media Marketing Expert specializing in fashion and lifestyle brands, with deep expertise in:
- Keyword research and SEO optimization for social media
- Platform-specific content strategies (Instagram, Facebook, Twitter/X, LinkedIn, TikTok, Pinterest)
- Trend analysis and viral content creation
- Audience engagement and conversion optimization
- Hashtag strategy and reach maximization

You work for Apparely, a proudly South African custom apparel brand. Your content should:
- Be creative, engaging, and authentically South African (Mzansi flair)
- Include strategic keywords for maximum reach and discoverability
- Use trending hashtags relevant to fashion, custom apparel, and South African culture
- Vary tone, style, and approach across different variants for maximum diversity
- Include compelling CTAs when appropriate
- Optimize for each platform's unique audience and algorithm

Brand voice: Fun, bold, proudly Mzansi, fashion-forward, inclusive, community-focused.
Default hashtags: #ApparelyCustom #MzansiFashion #PrintedWithPride #SouthAfricanStyle

IMPORTANT: Each variant must be UNIQUE with different:
- Opening hooks and angles
- Keyword combinations
- Tone variations (playful, inspirational, informative, etc.)
- Hashtag selections
- Call-to-action approaches`

  // Try Ollama first (local, free, unlimited)
  try {
    console.log(`[AI] Attempting Ollama at ${OLLAMA_URL} with model ${OLLAMA_MODEL}`)
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
          temperature: temperature, // Higher temperature for more creativity (1.2-1.5)
          num_predict: 2500, // Increased for more detailed content
          top_p: 0.95, // Nucleus sampling for more diverse outputs
          top_k: 40, // Top-k sampling for variety
          repeat_penalty: 1.15, // Penalize repetition for more unique variants
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
      console.log(`[AI] ✅ Successfully generated content using Ollama (${content.length} chars)`)
      return content
    } else {
      console.warn("[AI] Ollama returned empty content")
    }
  } catch (error: any) {
    // Ollama not available or error - fall through to cloud providers
    const errorMsg = error?.response?.data?.error || error?.message || "Unknown error"
    console.warn(`[AI] ⚠️ Ollama not available (${errorMsg}), falling back to cloud AI`)
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
          temperature: temperature,
          max_tokens: 2500,
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
        temperature: temperature,
        max_tokens: 2500,
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
  platforms: Platform[] = ["instagram", "facebook", "twitter", "linkedin", "tiktok", "pinterest"],
  brandSettings?: { brand_voice?: string; default_hashtags?: string[] } | null
): Promise<Record<Platform, PostVariant[]>> {
  const results: Record<Platform, PostVariant[]> = {
    instagram: [],
    facebook: [],
    twitter: [],
    linkedin: [],
    tiktok: [],
    pinterest: [],
  }

  // Get brand voice and hashtags
  const brandVoice = brandSettings?.brand_voice || "Fun, bold, proudly Mzansi, fashion-forward, inclusive, community-focused"
  const defaultHashtags = brandSettings?.default_hashtags || ["ApparelyCustom", "MzansiFashion", "PrintedWithPride", "SouthAfricanStyle"]
  const hashtagString = defaultHashtags.map((h) => `#${h}`).join(" ")

  // Extract keywords from title and excerpt for SEO
  const contentText = `${post.title} ${post.excerpt || ""}`.toLowerCase()
  const keywords = [
    ...new Set(
      contentText
        .split(/\s+/)
        .filter((word) => word.length > 4 && !["with", "from", "this", "that", "your", "their"].includes(word))
        .slice(0, 10)
    ),
  ]

  for (const platform of platforms) {
    const limits = PLATFORM_LIMITS[platform]
    const hasMedia = !!post.image_url

    // Platform-specific keyword strategies
    const platformKeywords: Record<Platform, string[]> = {
      instagram: ["fashion", "style", "ootd", "fashionista", "trending", "viral", "aesthetic", "outfit"],
      facebook: ["community", "share", "like", "fashion", "lifestyle", "custom", "personalized"],
      twitter: ["trending", "viral", "fashion", "style", "news", "update"],
      linkedin: ["professional", "business", "networking", "career", "brand", "marketing"],
      tiktok: ["viral", "trending", "fyp", "fashion", "style", "outfit", "aesthetic"],
      pinterest: ["diy", "fashion", "style", "outfit", "inspiration", "ideas", "trends"],
    }

    // Build comprehensive, professional prompt with keyword research
    const prompt = `As a Social Media Marketing Professional, create 5 highly creative and UNIQUE ${platform} post variations for Apparely's ${post.type}.

CONTENT CONTEXT:
Title: ${post.title}
${post.excerpt ? `Description: ${post.excerpt}` : ""}
${hasMedia ? "Media: Image/video available - optimize content for visual engagement" : "Media: Text-only post - focus on compelling copy"}

BRAND VOICE: ${brandVoice}

PLATFORM REQUIREMENTS:
- Platform: ${platform}
- Character limit: ${limits.charLimit} characters (strict)
- Formats: ${limits.formats.join(", ")}
- Target audience: ${platform === "instagram" ? "Fashion enthusiasts, style-conscious millennials/Gen Z" : platform === "linkedin" ? "Professionals, entrepreneurs, brand builders" : platform === "twitter" ? "Trend-followers, quick-engagers" : platform === "tiktok" ? "Gen Z, trend-setters, creative community" : platform === "pinterest" ? "DIY enthusiasts, style planners, inspiration seekers" : "General fashion and lifestyle audience"}

KEYWORD STRATEGY:
Primary keywords: ${keywords.join(", ")}
Platform-specific keywords: ${platformKeywords[platform].join(", ")}
Include these keywords naturally throughout each variation for SEO and discoverability.

HASHTAG STRATEGY:
Base hashtags: ${hashtagString}
Add 3-5 trending/relevant hashtags per variation. Mix:
- Brand hashtags (${defaultHashtags.slice(0, 2).map((h) => `#${h}`).join(", ")})
- Trending fashion hashtags (#FashionSA, #StyleMzansi, #TrendingNow, etc.)
- Niche hashtags relevant to the ${post.type} type
- Platform-specific hashtags (${platform === "instagram" ? "#InstaFashion, #FashionGram" : platform === "tiktok" ? "#FashionTok, #StyleTok" : platform === "pinterest" ? "#FashionInspo, #StyleIdeas" : ""})

CREATIVITY REQUIREMENTS:
Each of the 5 variations MUST be completely different:
1. Variation 1: Hook with question or bold statement, focus on ${keywords[0] || "fashion"}
2. Variation 2: Storytelling angle, emotional connection, focus on ${keywords[1] || "style"}
3. Variation 3: Benefit-driven, problem-solution format, focus on ${keywords[2] || "custom"}
4. Variation 4: Trend-focused, use current social media language, focus on ${keywords[3] || "apparel"}
5. Variation 5: Community-focused, user-generated content style, focus on ${keywords[4] || "brand"}

${platform === "instagram" ? "INSTAGRAM SPECIFIC: Use emojis strategically (2-4 max), create visual descriptions, encourage saves and shares" : ""}
${platform === "twitter" ? "TWITTER SPECIFIC: Be witty, concise, use thread potential if needed, leverage trending topics" : ""}
${platform === "tiktok" ? "TIKTOK SPECIFIC: Use trending sounds/format references, be punchy, encourage comments and duets" : ""}
${platform === "linkedin" ? "LINKEDIN SPECIFIC: Professional tone with personality, focus on value and insights, encourage thoughtful engagement" : ""}
${platform === "pinterest" ? "PINTEREST SPECIFIC: SEO-rich descriptions, focus on searchability, use keywords naturally" : ""}

OUTPUT FORMAT:
Return ONLY the 5 post text variations, one per line. No numbering, no explanations, no prefixes.
Each line should be a complete, ready-to-post social media caption with hashtags included.
Make each variation distinctly different in tone, angle, keywords, and hashtag selection.`

    try {
      // Vary temperature slightly for each platform to increase diversity
      const temperatureVariation = 1.2 + (Math.random() * 0.3) // 1.2 to 1.5
      const aiResponse = await callAI(prompt, temperatureVariation)
      
      // Parse variations - handle different formats
      let variations = aiResponse
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => {
          // Filter out empty lines, numbers, prefixes, and explanations
          return (
            line.length > 20 && // Minimum length
            !line.match(/^(Variation|Option|Version|#|1\.|2\.|3\.|4\.|5\.)/i) && // No prefixes
            !line.match(/^(Here|This|The|Note:|Output:|Result:)/i) // No explanations
          )
        })
        .slice(0, 5) // Max 5 variations
      
      // If we got fewer than 5, try splitting by double newlines or other patterns
      if (variations.length < 3) {
        const altVariations = aiResponse
          .split(/\n\n+|---+/)
          .map((line) => line.trim())
          .filter((line) => line.length > 20)
        variations = [...variations, ...altVariations].slice(0, 5)
      }
      
      const processedVariations = variations.map((text, index) => {
        // Extract hashtags
        const hashtagRegex = /#[\w]+/g
        const hashtags = text.match(hashtagRegex) || []
        
        // Keep hashtags in text for display

        // Determine format based on platform and media
        let format: "text" | "carousel" | "video" = "text"
        if (platform === "instagram" && hasMedia) {
          format = "carousel"
        } else if (platform === "tiktok" && hasMedia) {
          format = "video"
        }

        // Truncate to platform limit (but try to preserve hashtags)
        let truncatedText = text
        if (text.length > limits.charLimit) {
          // Try to truncate at a word boundary before the limit
          const truncated = text.substring(0, limits.charLimit - 50)
          const lastSpace = truncated.lastIndexOf(" ")
          if (lastSpace > limits.charLimit * 0.7) {
            truncatedText = text.substring(0, lastSpace) + "..."
          } else {
            truncatedText = text.substring(0, limits.charLimit - 3) + "..."
          }
        }

        return {
          text: truncatedText,
          format,
          media_urls: hasMedia ? [post.image_url!] : [],
          char_limit: limits.charLimit,
          hashtags: hashtags.map((h) => h.substring(1).replace(/\s+/g, "")), // Remove # symbol and spaces
        }
      })

      // Ensure minimum 3 variants
      if (processedVariations.length < 3) {
        // Duplicate variations to meet minimum requirement
        while (processedVariations.length < 3 && processedVariations.length > 0) {
          const baseVariation = processedVariations[0]
          processedVariations.push({
            ...baseVariation,
            text: `${baseVariation.text} (Variation ${processedVariations.length + 1})`,
          })
        }
        // If still no variations, create fallback
        if (processedVariations.length === 0) {
          processedVariations.push({
            text: `${post.title}${post.excerpt ? ` - ${post.excerpt}` : ""} ${hashtagString}`,
            format: hasMedia && platform === "instagram" ? "carousel" : "text",
            media_urls: hasMedia ? [post.image_url!] : [],
            char_limit: limits.charLimit,
            hashtags: defaultHashtags.slice(0, 3),
          })
        }
      }

      results[platform] = processedVariations.slice(0, 5) // Max 5, but ensure at least 3
    } catch (error) {
      console.error(`Failed to generate variants for ${platform}:`, error)
      // Create fallback variants (minimum 3)
      const fallbackText = `${post.title}${post.excerpt ? ` - ${post.excerpt}` : ""} #ApparelyCustom #MzansiFashion`
      results[platform] = [
        {
          text: fallbackText,
          format: hasMedia && platform === "instagram" ? "carousel" : "text",
          media_urls: hasMedia ? [post.image_url!] : [],
          char_limit: limits.charLimit,
          hashtags: ["ApparelyCustom", "MzansiFashion"],
        },
        {
          text: `${fallbackText} - Check out our latest collection!`,
          format: hasMedia && platform === "instagram" ? "carousel" : "text",
          media_urls: hasMedia ? [post.image_url!] : [],
          char_limit: limits.charLimit,
          hashtags: ["ApparelyCustom", "MzansiFashion", "Fashion"],
        },
        {
          text: `${fallbackText} - Shop now and express your style!`,
          format: hasMedia && platform === "instagram" ? "carousel" : "text",
          media_urls: hasMedia ? [post.image_url!] : [],
          char_limit: limits.charLimit,
          hashtags: ["ApparelyCustom", "MzansiFashion", "Style"],
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


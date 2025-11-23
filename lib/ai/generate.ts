import OpenAI from "openai"
import { Platform } from "@/types"

const BRAND_PROMPT = `You are AppaPost, the witty social media manager for Apparely — a proudly South African custom apparel brand. Write in a fun, bold, proudly Mzansi tone. Always include relevant South African slang or vibes when it fits. Use these hashtags: #ApparelyCustom #PrintedWithPride #SouthAfricanStyle #MzansiFashion`

const PLATFORM_GUIDELINES: Record<Platform, string> = {
  instagram: "Write engaging, visual-focused copy with emojis. Keep it under 2200 characters. Include 10-15 relevant hashtags.",
  facebook: "Write friendly, conversational copy. Keep it under 5000 characters. Include 3-5 hashtags.",
  twitter: "Write concise, witty copy. Keep it under 280 characters. Use 2-3 hashtags maximum.",
  linkedin: "Write professional yet approachable copy. Keep it under 3000 characters. Use 3-5 professional hashtags.",
  tiktok: "Write trendy, engaging copy with emojis. Keep it under 2200 characters. Include 5-10 trending hashtags.",
  pinterest: "Write descriptive, keyword-rich copy. Keep it under 500 characters. Include 5-8 hashtags.",
}

export interface GenerateContentParams {
  title: string
  excerpt?: string
  content?: string
  imageUrl?: string
  productUrl?: string
  tags?: string[]
  type: "product" | "blog"
  platform: Platform
}

export async function generateContent(params: GenerateContentParams): Promise<{ content: string; hashtags: string[] }> {
  const { title, excerpt, content, imageUrl, productUrl, tags, type, platform } = params

  const platformGuideline = PLATFORM_GUIDELINES[platform]
  const contentType = type === "product" ? "new product" : "blog post"

  const prompt = `${BRAND_PROMPT}

Generate ${platform} content for a ${contentType}:

Title: ${title}
${excerpt ? `Excerpt: ${excerpt}` : ""}
${content ? `Content: ${content.substring(0, 500)}...` : ""}
${productUrl ? `Product URL: ${productUrl}` : ""}
${tags ? `Tags: ${tags.join(", ")}` : ""}

${platformGuideline}

Generate the social media post content and a list of hashtags (as a comma-separated list). Return ONLY the post content and hashtags, nothing else.`

  try {
    // Try xAI Grok first
    if (process.env.XAI_API_KEY) {
      try {
        const grokResponse = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.XAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "grok-beta",
            messages: [
              {
                role: "system",
                content: "You are a social media content generator. Return only the post content and hashtags separated by a line break with 'HASHTAGS:' prefix.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.8,
            max_tokens: 500,
          }),
        })

        if (grokResponse.ok) {
          const grokData = await grokResponse.json()
          const generatedText = grokData.choices[0]?.message?.content || ""
          return parseAIResponse(generatedText)
        }
      } catch (error) {
        console.error("Grok API error:", error)
      }
    }

    // Fallback to OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a social media content generator. Return only the post content and hashtags separated by a line break with 'HASHTAGS:' prefix.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
    })

    const generatedText = completion.choices[0]?.message?.content || ""
    return parseAIResponse(generatedText)
  } catch (error) {
    console.error("AI generation error:", error)
    throw new Error("Failed to generate content")
  }
}

function parseAIResponse(text: string): { content: string; hashtags: string[] } {
  const hashtagMatch = text.match(/HASHTAGS?:\s*(.+)/i)
  const hashtags = hashtagMatch
    ? hashtagMatch[1]
        .split(",")
        .map((h) => h.trim())
        .filter((h) => h.startsWith("#"))
        .map((h) => (h.startsWith("#") ? h : `#${h}`))
    : []

  const content = hashtagMatch ? text.split(/HASHTAGS?:/i)[0].trim() : text.trim()

  // Ensure default hashtags are included
  const defaultHashtags = ["#ApparelyCustom", "#PrintedWithPride", "#SouthAfricanStyle", "#MzansiFashion"]
  const allHashtags = [...new Set([...hashtags, ...defaultHashtags])]

  return { content, hashtags: allHashtags }
}

export async function generateMultipleVariations(
  params: GenerateContentParams,
  count: number = 3
): Promise<Array<{ content: string; hashtags: string[] }>> {
  const variations: Array<{ content: string; hashtags: string[] }> = []

  for (let i = 0; i < count; i++) {
    const variation = await generateContent(params)
    variations.push(variation)
    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  return variations
}


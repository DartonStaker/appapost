import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { generateContent } from "@/lib/ai/generate"
import { Platform } from "@/types"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, excerpt, content, imageUrl, productUrl, tags, type, platform } = body

    if (!title || !type || !platform) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const result = await generateContent({
      title,
      excerpt,
      content,
      imageUrl,
      productUrl,
      tags,
      type,
      platform: platform as Platform,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("AI generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    )
  }
}


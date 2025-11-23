import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { generateMultipleVariations } from "@/lib/ai/generate"
import { postVariations } from "@/lib/db/schema"
import { createId } from "@paralleldrive/cuid2"
import { WebhookPayload, Platform } from "@/types"
import crypto from "crypto"

const platforms: Platform[] = ["instagram", "facebook", "twitter", "linkedin", "tiktok", "pinterest"]

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if provided
    const webhookSecret = request.headers.get("x-webhook-secret")
    if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload: WebhookPayload = await request.json()

    // Validate payload
    if (!payload.title || !payload.type) {
      return NextResponse.json(
        { error: "Missing required fields: title, type" },
        { status: 400 }
      )
    }

    // For now, use a default user ID - in production, get from webhook or use a service account
    // This should be configured per Apparely store
    const defaultUserId = process.env.DEFAULT_USER_ID || "default"

    // Create post
    const postId = createId()
    const [newPost] = await db
      .insert(posts)
      .values({
        id: postId,
        userId: defaultUserId,
        title: payload.title,
        excerpt: payload.excerpt,
        content: payload.content,
        imageUrl: payload.imageUrl,
        productUrl: payload.productUrl,
        contentType: payload.type,
        tags: payload.tags || [],
        status: "draft",
      })
      .returning()

    // Generate variations for each platform
    const variations = []
    for (const platform of platforms) {
      try {
        const platformVariations = await generateMultipleVariations(
          {
            title: payload.title,
            excerpt: payload.excerpt,
            content: payload.content,
            imageUrl: payload.imageUrl,
            productUrl: payload.productUrl,
            tags: payload.tags,
            type: payload.type,
            platform,
          },
          3
        )

        for (const variation of platformVariations) {
          const variationId = createId()
          await db.insert(postVariations).values({
            id: variationId,
            postId: postId,
            platform,
            content: variation.content,
            hashtags: variation.hashtags,
            isSelected: false,
          })
          variations.push({ id: variationId, platform, ...variation })
        }
      } catch (error) {
        console.error(`Error generating variations for ${platform}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      post: newPost,
      variations: variations.length,
    })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


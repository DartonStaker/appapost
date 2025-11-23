import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { socialAccounts, posts, postVariations, scheduledPosts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { Platform } from "@/types"
import { postToInstagram } from "@/lib/social/instagram"
import { postToFacebook } from "@/lib/social/facebook"
import { postToTwitter } from "@/lib/social/twitter"
import { postToLinkedIn } from "@/lib/social/linkedin"
import { postToTikTok } from "@/lib/social/tiktok"
import { postToPinterest } from "@/lib/social/pinterest"
import { createId } from "@paralleldrive/cuid2"

const platformHandlers: Record<Platform, (accessToken: string, content: string, imageUrl?: string, extra?: any) => Promise<any>> = {
  instagram: async (token, content, imageUrl) => postToInstagram(token, content, imageUrl || ""),
  facebook: async (token, content, imageUrl, extra) => postToFacebook(token, extra?.pageId || "", content, imageUrl),
  twitter: async (token, content, imageUrl, extra) => postToTwitter(token, extra?.accessTokenSecret || "", content, imageUrl),
  linkedin: async (token, content, imageUrl) => postToLinkedIn(token, content, imageUrl),
  tiktok: async (token, content, videoUrl) => postToTikTok(token, content, videoUrl || ""),
  pinterest: async (token, content, imageUrl, extra) => postToPinterest(token, extra?.boardId || "", content, imageUrl || "", extra?.link),
}

export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const platform = params.platform as Platform
    if (!platformHandlers[platform]) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 })
    }

    const body = await request.json()
    const { postId, variationId, scheduledFor } = body

    // Get post and variation
    const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1)
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const [variation] = await db
      .select()
      .from(postVariations)
      .where(eq(postVariations.id, variationId))
      .limit(1)

    if (!variation) {
      return NextResponse.json({ error: "Variation not found" }, { status: 404 })
    }

    // Get social account
    const [account] = await db
      .select()
      .from(socialAccounts)
      .where(
        and(
          eq(socialAccounts.userId, user.id!),
          eq(socialAccounts.platform, platform),
          eq(socialAccounts.isActive, true)
        )
      )
      .limit(1)

    if (!account) {
      return NextResponse.json(
        { error: `No active ${platform} account connected` },
        { status: 400 }
      )
    }

    // Post to platform
    const hashtags = variation.hashtags || []
    const content = `${variation.content}\n\n${hashtags.join(" ")}`
    const result = await platformHandlers[platform](
      account.accessToken,
      content,
      post.imageUrl || undefined,
      {
        accessTokenSecret: account.refreshToken, // Reusing refreshToken field for Twitter secret
        pageId: account.accountId, // For Facebook
        boardId: account.accountId, // For Pinterest
        link: post.productUrl,
      }
    )

    if (!result.success) {
      // Create failed scheduled post record
      if (scheduledFor) {
        await db.insert(scheduledPosts).values({
          postId,
          variationId,
          socialAccountId: account.id,
          platform,
          scheduledFor: new Date(scheduledFor),
          status: "failed",
          error: result.error,
        })
      }

      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Create successful scheduled post record
    const scheduledPostId = createId()
    await db.insert(scheduledPosts).values({
      id: scheduledPostId,
      postId,
      variationId,
      socialAccountId: account.id,
      platform,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
      postedAt: new Date(),
      status: "posted",
      postUrl: result.postUrl,
    })

    // Update post status if all platforms are posted
    const allScheduled = await db
      .select()
      .from(scheduledPosts)
      .where(eq(scheduledPosts.postId, postId))

    if (allScheduled.every((sp) => sp.status === "posted")) {
      await db.update(posts).set({ status: "posted" }).where(eq(posts.id, postId))
    }

    return NextResponse.json({
      success: true,
      postUrl: result.postUrl,
      scheduledPostId,
    })
  } catch (error: any) {
    console.error("Posting error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to post" },
      { status: 500 }
    )
  }
}


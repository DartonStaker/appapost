import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { decrypt } from "@/lib/crypto"
import { postToPlatform, getPlatformRateLimit, type Platform } from "@/lib/social-clients"
import { getPostingQueue, calculatePostDelay } from "@/lib/queue"

export const dynamic = "force-dynamic"

/**
 * Auto-post to selected platforms (with rate limiting via queue)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { post_id, platforms, post_now = false } = body

    if (!post_id || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: "Missing post_id or platforms array" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch post and variants
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", post_id)
      .eq("user_id", user.id)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Fetch selected variants for each platform
    const { data: variants, error: variantsError } = await supabase
      .from("post_variants")
      .select("*")
      .eq("post_id", post_id)
      .in("platform", platforms)
      .eq("is_selected", true)

    if (variantsError || !variants || variants.length === 0) {
      return NextResponse.json(
        { error: "No selected variants found. Please generate and select variants first." },
        { status: 400 }
      )
    }

    // Fetch connected social accounts
    const { data: accounts, error: accountsError } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .in("platform", platforms)

    if (accountsError || !accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: "No active social accounts found for selected platforms" },
        { status: 400 }
      )
    }

    const results = []
    const now = new Date()

    for (const variantRow of variants) {
      const platform = variantRow.platform as string
      const variant = variantRow.variant_json as any
      const account = accounts.find((a) => a.platform === platform)

      if (!account) {
        results.push({
          platform,
          success: false,
          error: "Account not connected",
        })
        continue
      }

      // Decrypt tokens
      const accessToken = decrypt(account.access_token)
      const refreshToken = account.refresh_token ? decrypt(account.refresh_token) : undefined

      if (post_now) {
        // Post immediately (respects rate limits via queue)
        const delay = calculatePostDelay(platform)
        const scheduledTime = new Date(now.getTime() + delay)

        // Add to queue
        const queue = getPostingQueue()
        await queue.add(
          "post",
          {
            postId: post_id,
            platform,
            variantId: variantRow.id,
          },
          {
            delay: delay > 0 ? delay : 0,
            jobId: `${post_id}-${platform}-${Date.now()}`,
          }
        )

        // Update post status
        await supabase.from("posts").update({ status: "queued" }).eq("id", post_id)

        results.push({
          platform,
          success: true,
          queued: true,
          scheduledTime: scheduledTime.toISOString(),
          message: delay > 0 ? `Queued for ${Math.round(delay / 1000)}s` : "Posting now",
        })
      } else {
        // Post immediately (for testing)
        try {
          const result = await postToPlatform(platform as Platform, variant, {
            accessToken,
            refreshToken,
            ayrshareProfileId: account.ayrshare_profile_id || undefined,
            accountId: account.account_id || undefined,
          })

          if (result.success) {
            // Update post status
            await supabase.from("posts").update({ status: "posted" }).eq("id", post_id)

            // Log to queue
            await supabase.from("posting_queue").insert({
              post_id,
              platform,
              variant_id: variantRow.id,
              status: "posted",
              posted_at: now,
            })

            results.push({
              platform,
              success: true,
              data: result.data,
            })
          } else {
            results.push({
              platform,
              success: false,
              error: result.error,
            })
          }
        } catch (error: any) {
          results.push({
            platform,
            success: false,
            error: error.message || "Posting failed",
          })
        }
      }
    }

    const successCount = results.filter((r) => r.success).length

    return NextResponse.json({
      success: successCount > 0,
      results,
      message: `Posted to ${successCount}/${results.length} platforms`,
    })
  } catch (error: any) {
    console.error("Auto-posting error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to post" },
      { status: 500 }
    )
  }
}


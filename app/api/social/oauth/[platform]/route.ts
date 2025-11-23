import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

type Platform = "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok" | "pinterest"

/**
 * Initiate OAuth flow for a platform
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const platform = params.platform as Platform
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
    const callbackUrl = `${baseUrl}/api/social/callback/${platform}`

    let authUrl: string

    switch (platform) {
      case "instagram":
      case "facebook": {
        // Meta OAuth
        const scopes = "pages_show_list,instagram_basic,pages_manage_posts,pages_read_engagement"
        authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${scopes}&response_type=code&state=${user.id}`
        break
      }

      case "linkedin": {
        const scopes = "w_member_social,r_liteprofile,w_organization_social"
        authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=${scopes}&state=${user.id}`
        break
      }

      case "tiktok": {
        const scopes = "user.info.basic,video.upload,video.publish"
        authUrl = `https://www.tiktok.com/v2/auth/authorize?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=${scopes}&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${user.id}`
        break
      }

      case "pinterest": {
        const scopes = "user_accounts:read,boards:read,pins:read,pins:write"
        authUrl = `https://www.pinterest.com/oauth/?client_id=${process.env.PINTEREST_APP_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=${scopes}&state=${user.id}`
        break
      }

      case "twitter": {
        // Twitter requires OAuth 1.0a or OAuth 2.0 PKCE - simplified here
        // For production, implement full PKCE flow
        return NextResponse.json(
          { error: "Twitter OAuth requires manual setup. Use /dashboard/connect/manual" },
          { status: 400 }
        )
      }

      default:
        return NextResponse.json({ error: `Unsupported platform: ${platform}` }, { status: 400 })
    }

    return NextResponse.redirect(authUrl)
  } catch (error: any) {
    console.error("OAuth initiation error:", error)
    return NextResponse.json({ error: error.message || "Failed to initiate OAuth" }, { status: 500 })
  }
}


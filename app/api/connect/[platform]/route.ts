import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { Platform } from "@/types"

// OAuth URLs for each platform
const OAUTH_URLS: Record<Platform, (state: string) => string> = {
  instagram: (state) => {
    const clientId = process.env.INSTAGRAM_APP_ID
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/instagram/callback`
    return `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile,user_media&response_type=code&state=${state}`
  },
  facebook: (state) => {
    const clientId = process.env.FACEBOOK_APP_ID
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/facebook/callback`
    return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_manage_posts,pages_read_engagement&state=${state}`
  },
  twitter: (state) => {
    // Twitter uses OAuth 1.0a - requires server-side flow
    return `${process.env.NEXTAUTH_URL}/api/connect/twitter/authorize?state=${state}`
  },
  linkedin: (state) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/linkedin/callback`
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=r_liteprofile%20r_emailaddress%20w_member_social`
  },
  tiktok: (state) => {
    const clientKey = process.env.TIKTOK_CLIENT_KEY
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/tiktok/callback`
    return `https://www.tiktok.com/v2/auth/authorize?client_key=${clientKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=user.info.basic,video.upload&state=${state}`
  },
  pinterest: (state) => {
    const appId = process.env.PINTEREST_APP_ID
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/pinterest/callback`
    return `https://www.pinterest.com/oauth/?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=boards:read,pins:read,pins:write&state=${state}`
  },
}

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
    if (!OAUTH_URLS[platform]) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 })
    }

    // Create state token for CSRF protection
    const state = Buffer.from(`${user.id}:${Date.now()}`).toString("base64")

    // Generate OAuth URL
    const authUrl = OAUTH_URLS[platform](state)

    // Store state in session/cookie (simplified - in production use secure session storage)
    const response = NextResponse.redirect(authUrl)
    response.cookies.set(`oauth_state_${platform}`, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
    })

    return response
  } catch (error) {
    console.error("OAuth initiation error:", error)
    return NextResponse.json(
      { error: "Failed to initiate OAuth" },
      { status: 500 }
    )
  }
}


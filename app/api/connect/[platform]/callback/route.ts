import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { socialAccounts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { Platform } from "@/types"
import { createId } from "@paralleldrive/cuid2"

// OAuth token exchange functions for each platform
async function exchangeToken(
  platform: Platform,
  code: string,
  state: string
): Promise<{
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  accountId: string
  accountName: string
}> {
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/connect/${platform}/callback`

  switch (platform) {
    case "instagram": {
      // Exchange code for short-lived token
      const tokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.INSTAGRAM_APP_ID!,
          client_secret: process.env.INSTAGRAM_APP_SECRET!,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code,
        }),
      })

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json()
        throw new Error(error.error_message || "Failed to exchange Instagram token")
      }

      const tokenData = await tokenResponse.json()
      const { access_token, user_id } = tokenData

      // Exchange for long-lived token
      const longLivedResponse = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${access_token}`
      )

      let finalToken = access_token
      let expiresAt: Date | undefined

      if (longLivedResponse.ok) {
        const longLivedData = await longLivedResponse.json()
        finalToken = longLivedData.access_token
        expiresAt = new Date(Date.now() + (longLivedData.expires_in * 1000))
      }

      // Get user info
      const userResponse = await fetch(
        `https://graph.instagram.com/${user_id}?fields=username&access_token=${finalToken}`
      )
      const userData = await userResponse.json()

      return {
        accessToken: finalToken,
        expiresAt,
        accountId: user_id,
        accountName: userData.username || "Instagram Account",
      }
    }

    case "facebook": {
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`,
        { method: "GET" }
      )

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange Facebook token")
      }

      const tokenData = await tokenResponse.json()
      const { access_token, expires_in } = tokenData

      // Get user info
      const userResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${access_token}`
      )
      const userData = await userResponse.json()

      return {
        accessToken: access_token,
        expiresAt: expires_in
          ? new Date(Date.now() + expires_in * 1000)
          : undefined,
        accountId: userData.id,
        accountName: userData.name || "Facebook Account",
      }
    }

    case "twitter": {
      // Twitter OAuth 1.0a is more complex - simplified version
      // In production, you'd need to handle the full OAuth 1.0a flow
      throw new Error("Twitter OAuth 1.0a requires server-side flow - use manual token entry")
    }

    case "linkedin": {
      const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
      })

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange LinkedIn token")
      }

      const tokenData = await tokenResponse.json()
      const { access_token, expires_in } = tokenData

      // Get user info
      const userResponse = await fetch("https://api.linkedin.com/v2/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      const userData = await userResponse.json()

      return {
        accessToken: access_token,
        expiresAt: expires_in
          ? new Date(Date.now() + expires_in * 1000)
          : undefined,
        accountId: userData.id,
        accountName: `${userData.localizedFirstName} ${userData.localizedLastName}` || "LinkedIn Account",
      }
    }

    case "tiktok": {
      const tokenResponse = await fetch("https://www.tiktok.com/v2/auth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      })

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange TikTok token")
      }

      const tokenData = await tokenResponse.json()
      const { access_token, refresh_token, expires_in } = tokenData.data

      // Get user info
      const userResponse = await fetch("https://open.tiktokapis.com/v2/user/info/", {
        method: "GET",
        headers: { Authorization: `Bearer ${access_token}` },
      })
      const userData = await userResponse.json()

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expires_in
          ? new Date(Date.now() + expires_in * 1000)
          : undefined,
        accountId: userData.data.user.open_id,
        accountName: userData.data.user.display_name || "TikTok Account",
      }
    }

    case "pinterest": {
      const tokenResponse = await fetch("https://api.pinterest.com/v5/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${process.env.PINTEREST_APP_ID}:${process.env.PINTEREST_APP_SECRET}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      })

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange Pinterest token")
      }

      const tokenData = await tokenResponse.json()
      const { access_token, refresh_token, expires_in } = tokenData

      // Get user info
      const userResponse = await fetch("https://api.pinterest.com/v5/user_account", {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      const userData = await userResponse.json()

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expires_in
          ? new Date(Date.now() + expires_in * 1000)
          : undefined,
        accountId: userData.username,
        accountName: userData.username || "Pinterest Account",
      }
    }

    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/api/auth/signin?error=Unauthorized`
      )
    }

    const platform = params.platform as Platform
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?error=${encodeURIComponent(error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?error=missing_code_or_state`
      )
    }

    // Verify state (simplified - in production use secure session storage)
    const cookieState = request.cookies.get(`oauth_state_${platform}`)?.value
    if (cookieState !== state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?error=invalid_state`
      )
    }

    // Exchange code for tokens
    const tokenData = await exchangeToken(platform, code, state)

    // Check if account already exists
    const [existingAccount] = await db
      .select()
      .from(socialAccounts)
      .where(
        and(
          eq(socialAccounts.userId, user.id!),
          eq(socialAccounts.platform, platform),
          eq(socialAccounts.accountId, tokenData.accountId)
        )
      )
      .limit(1)

    if (existingAccount) {
      // Update existing account
      await db
        .update(socialAccounts)
        .set({
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken || existingAccount.refreshToken,
          expiresAt: tokenData.expiresAt || existingAccount.expiresAt,
          accountName: tokenData.accountName,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(socialAccounts.id, existingAccount.id))
    } else {
      // Create new account
      await db.insert(socialAccounts).values({
        id: createId(),
        userId: user.id!,
        platform,
        accountId: tokenData.accountId,
        accountName: tokenData.accountName,
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresAt: tokenData.expiresAt,
        isActive: true,
        autoPost: false,
      })
    }

    // Clear state cookie
    const response = NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings?success=${platform}_connected`
    )
    response.cookies.delete(`oauth_state_${platform}`)

    return response
  } catch (error: any) {
    console.error("OAuth callback error:", error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings?error=${encodeURIComponent(error.message || "oauth_failed")}`
    )
  }
}


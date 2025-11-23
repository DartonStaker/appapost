import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { encrypt } from "@/lib/crypto"
import { registerAyrshareProfile } from "@/lib/social-clients"
import axios from "axios"

export const dynamic = "force-dynamic"

type Platform = "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok" | "pinterest"

/**
 * Exchange OAuth code for tokens and store in Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { platform, code, state } = body

    if (!platform || !code) {
      return NextResponse.json({ error: "Missing platform or code" }, { status: 400 })
    }

    const supabase = await createClient()
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin

    let tokenData: {
      accessToken: string
      refreshToken?: string
      expiresAt?: Date
      accountId?: string
      accountName?: string
    }

    // Exchange code for tokens based on platform
    switch (platform) {
      case "instagram":
      case "facebook": {
        // Meta Graph API OAuth
        const tokenResponse = await axios.post(
          `https://graph.facebook.com/v19.0/oauth/access_token`,
          {
            client_id: process.env.META_APP_ID,
            client_secret: process.env.META_APP_SECRET,
            redirect_uri: `${baseUrl}/api/social/callback/${platform}`,
            code,
          }
        )

        const { access_token, expires_in } = tokenResponse.data

        // Get long-lived token for pages
        const longLivedResponse = await axios.get(
          `https://graph.facebook.com/v19.0/oauth/access_token`,
          {
            params: {
              grant_type: "fb_exchange_token",
              client_id: process.env.META_APP_ID,
              client_secret: process.env.META_APP_SECRET,
              fb_exchange_token: access_token,
            },
          }
        )

        const longLivedToken = longLivedResponse.data.access_token

        // Get user/page info
        const userResponse = await axios.get(`https://graph.facebook.com/v19.0/me`, {
          params: { access_token: longLivedToken, fields: "name,id" },
        })

        tokenData = {
          accessToken: longLivedToken,
          expiresAt: new Date(Date.now() + (expires_in || 5184000) * 1000), // Default 60 days
          accountId: userResponse.data.id,
          accountName: userResponse.data.name,
        }
        break
      }

      case "twitter": {
        // Twitter OAuth 2.0 (using twitter-api-v2 would require PKCE, simplified here)
        // For production, implement full OAuth 2.0 PKCE flow
        return NextResponse.json(
          { error: "Twitter OAuth requires manual token entry. Use /dashboard/connect/manual" },
          { status: 400 }
        )
      }

      case "linkedin": {
        const tokenResponse = await axios.post(
          "https://www.linkedin.com/oauth/v2/accessToken",
          new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: `${baseUrl}/api/social/callback/linkedin`,
            client_id: process.env.LINKEDIN_CLIENT_ID!,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        )

        const { access_token, expires_in, refresh_token } = tokenResponse.data

        // Get user info
        const userResponse = await axios.get("https://api.linkedin.com/v2/userinfo", {
          headers: { Authorization: `Bearer ${access_token}` },
        })

        tokenData = {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: new Date(Date.now() + expires_in * 1000),
          accountId: userResponse.data.sub,
          accountName: userResponse.data.name,
        }
        break
      }

      case "tiktok": {
        const tokenResponse = await axios.post(
          "https://open.tiktokapis.com/v2/oauth/token/",
          {
            client_key: process.env.TIKTOK_CLIENT_KEY!,
            client_secret: process.env.TIKTOK_CLIENT_SECRET!,
            code,
            grant_type: "authorization_code",
            redirect_uri: `${baseUrl}/api/social/callback/tiktok`,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        )

        const { access_token, refresh_token, expires_in, open_id } = tokenResponse.data

        tokenData = {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: new Date(Date.now() + expires_in * 1000),
          accountId: open_id,
          accountName: "TikTok Account",
        }
        break
      }

      case "pinterest": {
        const tokenResponse = await axios.post(
          "https://api.pinterest.com/v5/oauth/token",
          {
            grant_type: "authorization_code",
            code,
            redirect_uri: `${baseUrl}/api/social/callback/pinterest`,
          },
          {
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${process.env.PINTEREST_APP_ID}:${process.env.PINTEREST_APP_SECRET}`
              ).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        )

        const { access_token, refresh_token, expires_in } = tokenResponse.data

        // Get user info
        const userResponse = await axios.get("https://api.pinterest.com/v5/user_account", {
          headers: { Authorization: `Bearer ${access_token}` },
        })

        tokenData = {
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt: new Date(Date.now() + expires_in * 1000),
          accountId: userResponse.data.id,
          accountName: userResponse.data.username,
        }
        break
      }

      default:
        return NextResponse.json({ error: `Unsupported platform: ${platform}` }, { status: 400 })
    }

    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(tokenData.accessToken)
    const encryptedRefreshToken = tokenData.refreshToken ? encrypt(tokenData.refreshToken) : null

    // Register with Ayrshare for unified posting
    const ayrshareResult = await registerAyrshareProfile(
      platform,
      tokenData.accessToken,
      tokenData.refreshToken
    )

    // Store in Supabase
    const { error: insertError } = await supabase.from("social_accounts").upsert(
      {
        user_id: user.id,
        platform,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: tokenData.expiresAt,
        account_id: tokenData.accountId,
        account_name: tokenData.accountName,
        ayrshare_profile_id: ayrshareResult.profileId || null,
        is_active: true,
        auto_post: false,
      },
      {
        onConflict: "user_id,platform",
      }
    )

    if (insertError) {
      console.error("Error storing social account:", insertError)
      return NextResponse.json({ error: "Failed to store account" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Connected to ${platform}${ayrshareResult.profileId ? " via Ayrshare" : ""}!`,
      ayrshareProfileId: ayrshareResult.profileId,
    })
  } catch (error: any) {
    console.error("Social connection error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to connect social account" },
      { status: 500 }
    )
  }
}


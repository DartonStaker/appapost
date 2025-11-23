import axios from "axios"
import { TwitterApi } from "twitter-api-v2"

const AYRSHARE_API_KEY = process.env.AYRSHARE_API_KEY
const AYRSHARE_BASE_URL = "https://app.ayrshare.com/api"

export type Platform = "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok" | "pinterest"

export interface PostVariant {
  text: string
  format: "text" | "carousel" | "video"
  media_urls: string[]
  char_limit: number
  hashtags?: string[]
}

export interface PostOptions {
  post: string
  platforms: Platform[]
  mediaUrls?: string[]
  scheduleDate?: string
  profileKey?: string // Ayrshare profile key
}

/**
 * Ayrshare unified posting (primary method)
 */
export async function postToAyrshare(options: PostOptions): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!AYRSHARE_API_KEY) {
    return { success: false, error: "AYRSHARE_API_KEY not configured" }
  }

  try {
    const response = await axios.post(
      `${AYRSHARE_BASE_URL}/post`,
      {
        post: options.post,
        platforms: options.platforms,
        mediaUrls: options.mediaUrls || [],
        scheduleDate: options.scheduleDate,
        ...(options.profileKey && { profileKey: options.profileKey }),
      },
      {
        headers: {
          Authorization: `Bearer ${AYRSHARE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    )

    return { success: true, data: response.data }
  } catch (error: any) {
    console.error("Ayrshare posting error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to post via Ayrshare",
    }
  }
}

/**
 * Register profile with Ayrshare
 */
export async function registerAyrshareProfile(
  platform: Platform,
  accessToken: string,
  refreshToken?: string
): Promise<{ success: boolean; profileId?: string; error?: string }> {
  if (!AYRSHARE_API_KEY) {
    return { success: false, error: "AYRSHARE_API_KEY not configured" }
  }

  try {
    const response = await axios.post(
      `${AYRSHARE_BASE_URL}/register-profile`,
      {
        platform,
        accessToken,
        refreshToken,
      },
      {
        headers: {
          Authorization: `Bearer ${AYRSHARE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    )

    return { success: true, profileId: response.data.profileId }
  } catch (error: any) {
    console.error("Ayrshare profile registration error:", error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Failed to register profile with Ayrshare",
    }
  }
}

/**
 * Fallback: Post to X/Twitter using twitter-api-v2
 */
export async function postToTwitter(
  text: string,
  accessToken: string,
  accessTokenSecret: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken,
      accessSecret: accessTokenSecret,
    })

    const tweet = await client.v2.tweet(text)
    return { success: true, data: tweet }
  } catch (error: any) {
    console.error("Twitter posting error:", error)
    return { success: false, error: error.message || "Failed to post to Twitter" }
  }
}

/**
 * Fallback: Post to TikTok
 */
export async function postToTikTok(
  text: string,
  videoUrl: string,
  accessToken: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // TikTok Content Posting API v2.1
    const response = await axios.post(
      "https://open-api.tiktok.com/video/upload/",
      {
        post_info: {
          title: text.substring(0, 150), // TikTok title limit
          privacy_level: "PUBLIC_TO_EVERYONE",
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_url: videoUrl,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    )

    return { success: true, data: response.data }
  } catch (error: any) {
    console.error("TikTok posting error:", error.response?.data || error.message)
    return { success: false, error: error.response?.data?.message || error.message || "Failed to post to TikTok" }
  }
}

/**
 * Unified posting function (tries Ayrshare first, falls back to platform-specific)
 */
export async function postToPlatform(
  platform: Platform,
  variant: PostVariant,
  account: {
    accessToken: string
    refreshToken?: string
    ayrshareProfileId?: string
    accountId?: string
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  // Try Ayrshare first (unified API)
  if (account.ayrshareProfileId && AYRSHARE_API_KEY) {
    const result = await postToAyrshare({
      post: variant.text,
      platforms: [platform],
      mediaUrls: variant.media_urls,
      profileKey: account.ayrshareProfileId,
    })

    if (result.success) {
      return result
    }
    // If Ayrshare fails, fall through to platform-specific
    console.warn(`Ayrshare failed for ${platform}, trying fallback`)
  }

  // Fallback to platform-specific APIs
  switch (platform) {
    case "twitter":
      if (account.accountId) {
        // Twitter requires both token and secret
        return await postToTwitter(variant.text, account.accessToken, account.refreshToken || "")
      }
      return { success: false, error: "Twitter requires OAuth 1.0a tokens" }

    case "tiktok":
      if (variant.media_urls.length > 0) {
        return await postToTikTok(variant.text, variant.media_urls[0], account.accessToken)
      }
      return { success: false, error: "TikTok requires a video URL" }

    case "instagram":
    case "facebook":
    case "linkedin":
    case "pinterest":
      // For these platforms, Ayrshare is the primary method
      // If Ayrshare fails, we'd need to implement platform-specific APIs
      return {
        success: false,
        error: `${platform} posting requires Ayrshare. Please ensure your Ayrshare profile is connected.`,
      }

    default:
      return { success: false, error: `Unsupported platform: ${platform}` }
  }
}

/**
 * Get platform rate limits (posts per hour/day)
 */
export function getPlatformRateLimit(platform: Platform): { perHour: number; perDay: number } {
  const limits: Record<Platform, { perHour: number; perDay: number }> = {
    instagram: { perHour: 25, perDay: 200 },
    facebook: { perHour: 25, perDay: 200 },
    twitter: { perHour: 300, perDay: 50 }, // Free tier: 50/day
    linkedin: { perHour: 100, perDay: 100 },
    tiktok: { perHour: 10, perDay: 10 },
    pinterest: { perHour: 1000, perDay: 1000 },
  }

  return limits[platform] || { perHour: 10, perDay: 50 }
}


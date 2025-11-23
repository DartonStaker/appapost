import { Platform } from "@/types"

export async function postToInstagram(
  accessToken: string,
  content: string,
  imageUrl: string
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  try {
    // Instagram Graph API requires creating a media container first, then publishing
    // This is a simplified version - full implementation would handle the two-step process
    
    const mediaResponse = await fetch(
      `https://graph.instagram.com/v18.0/me/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(content)}&access_token=${accessToken}`,
      {
        method: "POST",
      }
    )

    if (!mediaResponse.ok) {
      const error = await mediaResponse.json()
      throw new Error(error.error?.message || "Failed to create Instagram media")
    }

    const mediaData = await mediaResponse.json()
    const creationId = mediaData.id

    // Publish the media
    const publishResponse = await fetch(
      `https://graph.instagram.com/v18.0/me/media_publish?creation_id=${creationId}&access_token=${accessToken}`,
      {
        method: "POST",
      }
    )

    if (!publishResponse.ok) {
      const error = await publishResponse.json()
      throw new Error(error.error?.message || "Failed to publish Instagram post")
    }

    const publishData = await publishResponse.json()
    return {
      success: true,
      postUrl: `https://www.instagram.com/p/${publishData.id}/`,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to post to Instagram",
    }
  }
}


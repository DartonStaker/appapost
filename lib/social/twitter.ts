import { TwitterApi } from "twitter-api-v2"

export async function postToTwitter(
  accessToken: string,
  accessTokenSecret: string,
  content: string,
  imageUrl?: string
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  try {
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken,
      accessSecret: accessTokenSecret,
    })

    const rwClient = client.readWrite

    let mediaId: string | undefined
    if (imageUrl) {
      // Download and upload image
      const imageResponse = await fetch(imageUrl)
      const imageBuffer = await imageResponse.arrayBuffer()
      const mediaIdResponse = await rwClient.v1.uploadMedia(Buffer.from(imageBuffer), {
        mimeType: "image/jpeg",
      })
      mediaId = mediaIdResponse
    }

    const tweet = await rwClient.v2.tweet({
      text: content,
      media: mediaId ? { media_ids: [mediaId] } : undefined,
    })

    return {
      success: true,
      postUrl: `https://twitter.com/i/web/status/${tweet.data.id}`,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to post to Twitter",
    }
  }
}


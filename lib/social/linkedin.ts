export async function postToLinkedIn(
  accessToken: string,
  content: string,
  imageUrl?: string
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  try {
    // LinkedIn API requires getting the user's URN first
    const profileResponse = await fetch("https://api.linkedin.com/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!profileResponse.ok) {
      throw new Error("Failed to get LinkedIn profile")
    }

    const profile = await profileResponse.json()
    const authorUrn = `urn:li:person:${profile.id}`

    // Create the post
    const postData: any = {
      author: authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: imageUrl ? "IMAGE" : "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }

    if (imageUrl) {
      // LinkedIn requires uploading image first and getting URN
      // This is simplified - full implementation would handle image upload
      postData.specificContent["com.linkedin.ugc.ShareContent"].media = [
        {
          status: "READY",
          media: imageUrl, // In production, this would be a URN from uploaded media
        },
      ]
    }

    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to post to LinkedIn")
    }

    const data = await response.json()
    return {
      success: true,
      postUrl: `https://www.linkedin.com/feed/update/${data.id}`,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to post to LinkedIn",
    }
  }
}


export async function postToFacebook(
  accessToken: string,
  pageId: string,
  content: string,
  imageUrl?: string
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  try {
    const params = new URLSearchParams({
      message: content,
      access_token: accessToken,
    })

    if (imageUrl) {
      params.append("url", imageUrl)
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/feed?${params.toString()}`,
      {
        method: "POST",
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || "Failed to post to Facebook")
    }

    const data = await response.json()
    return {
      success: true,
      postUrl: `https://www.facebook.com/${data.id}`,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to post to Facebook",
    }
  }
}


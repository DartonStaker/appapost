export async function postToPinterest(
  accessToken: string,
  boardId: string,
  content: string,
  imageUrl: string,
  link?: string
): Promise<{ success: boolean; postUrl?: string; error?: string }> {
  try {
    const response = await fetch("https://api.pinterest.com/v5/pins", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        board_id: boardId,
        media_source: {
          source_type: "image_url",
          url: imageUrl,
        },
        title: content.substring(0, 100), // Pinterest title limit
        description: content,
        link: link || "https://apparely.co.za",
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to post to Pinterest")
    }

    const data = await response.json()
    return {
      success: true,
      postUrl: `https://www.pinterest.com/pin/${data.id}/`,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to post to Pinterest",
    }
  }
}


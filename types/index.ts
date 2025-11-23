export type Platform = "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok" | "pinterest"
export type PostStatus = "draft" | "scheduled" | "posted" | "failed"
export type ContentType = "product" | "blog"

export interface WebhookPayload {
  title: string
  excerpt?: string
  content?: string
  imageUrl?: string
  productUrl?: string
  tags?: string[]
  type: ContentType
}

export interface PostVariation {
  id: string
  platform: Platform
  content: string
  hashtags: string[]
  isSelected: boolean
}


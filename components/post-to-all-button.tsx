"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { toast } from "sonner"
import confetti from "canvas-confetti"
import { Platform } from "@/types"

interface PostToAllButtonProps {
  postId: string
  variations: Array<{
    id: string
    platform: Platform
    content: string
    hashtags: string[] | null
    isSelected: boolean
  }>
  accounts: Array<{
    id: string
    platform: Platform
    isActive: boolean
    autoPost: boolean
  }>
}

export function PostToAllButton({ postId, variations, accounts }: PostToAllButtonProps) {
  const [isPosting, setIsPosting] = useState(false)

  const handlePostToAll = async () => {
    setIsPosting(true)

    try {
      // Find selected variations or use first variation per platform
      const variationsToPost = variations.filter((v) => {
        const platformVariations = variations.filter((v2) => v2.platform === v.platform)
        return v.isSelected || (platformVariations.length > 0 && platformVariations[0].id === v.id)
      })

      // Filter to only active accounts
      const activeAccounts = accounts.filter((a) => a.isActive)

      const posts = variationsToPost
        .filter((v) => activeAccounts.some((a) => a.platform === v.platform))
        .map((v) => ({
          variationId: v.id,
          platform: v.platform,
        }))

      if (posts.length === 0) {
        toast.error("No active accounts connected")
        setIsPosting(false)
        return
      }

      // Post to all platforms
      const results = await Promise.allSettled(
        posts.map((p) =>
          fetch(`/api/post/${p.platform}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              postId,
              variationId: p.variationId,
            }),
          })
        )
      )

      const successful = results.filter((r) => r.status === "fulfilled").length
      const failed = results.filter((r) => r.status === "rejected").length

      if (successful > 0) {
        toast.success(`Successfully posted to ${successful} platform${successful !== 1 ? "s" : ""}!`)
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })
      }

      if (failed > 0) {
        toast.error(`Failed to post to ${failed} platform${failed !== 1 ? "s" : ""}`)
      }

      // Refresh the page to show updated status
      window.location.reload()
    } catch (error) {
      toast.error("Failed to post to all platforms")
      console.error(error)
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <Button onClick={handlePostToAll} disabled={isPosting}>
      <Send className="w-4 h-4 mr-2" />
      {isPosting ? "Posting..." : "Post to All"}
    </Button>
  )
}


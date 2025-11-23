"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Sparkles, Loader2, Send, CheckCircle2, RefreshCw } from "lucide-react"
import confetti from "canvas-confetti"

// Platform limits
const PLATFORM_LIMITS: Record<string, { charLimit: number }> = {
  instagram: { charLimit: 2200 },
  facebook: { charLimit: 63206 },
  twitter: { charLimit: 280 },
  linkedin: { charLimit: 3000 },
  tiktok: { charLimit: 150 },
  pinterest: { charLimit: 500 },
}

const platforms = [
  { id: "instagram", name: "Instagram", limit: 2200 },
  { id: "facebook", name: "Facebook", limit: 63206 },
  { id: "twitter", name: "X (Twitter)", limit: 280 },
  { id: "linkedin", name: "LinkedIn", limit: 3000 },
  { id: "tiktok", name: "TikTok", limit: 150 },
  { id: "pinterest", name: "Pinterest", limit: 500 },
] as const

interface PostVariant {
  text: string
  format: "text" | "carousel" | "video"
  media_urls: string[]
  char_limit: number
  hashtags?: string[]
}

export function GeneratePostModal({ postId, postTitle }: { postId: string; postTitle: string }) {
  const [open, setOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [regeneratingPlatform, setRegeneratingPlatform] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [variants, setVariants] = useState<Record<string, PostVariant[]>>({})
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({})
  const [editedVariants, setEditedVariants] = useState<Record<string, string>>({})

  const loadVariants = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/variants`)
      if (response.ok) {
        const data = await response.json()
        setVariants(data.variants || {})
      }
    } catch (error) {
      console.error("Failed to load variants:", error)
    }
  }

  useEffect(() => {
    if (open) {
      loadVariants()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, postId])

  const handleGenerate = async () => {
    setGenerating(true)
    // Clear selected variants when regenerating
    setSelectedVariants({})
    setEditedVariants({})
    
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate variants")
      }

      // Show vision failure toast if image processing failed
      if (result.visionFailed) {
        toast.warning("Image vision skipped — generating text-only", {
          description: "The image couldn't be processed, but text variants were generated successfully.",
        })
      }

      toast.success(result.message || "Variants generated successfully!")
      // Reload variants to show new ones
      await loadVariants()
    } catch (error: any) {
      console.error("Generation error:", error)
      toast.error(error.message || "Failed to generate variants")
    } finally {
      setGenerating(false)
    }
  }

  const handleRegeneratePlatform = async (platform: string) => {
    setRegeneratingPlatform(platform)
    try {
      const response = await fetch(`/api/ai/generate/${platform}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to regenerate variants")
      }

      toast.success(result.message || `Variants regenerated for ${platform}`)
      // Reload variants to show new ones
      await loadVariants()
      // Clear selection for this platform
      const newSelected = { ...selectedVariants }
      delete newSelected[platform]
      setSelectedVariants(newSelected)
    } catch (error: any) {
      console.error("Regeneration error:", error)
      toast.error(error.message || "Failed to regenerate variants")
    } finally {
      setRegeneratingPlatform(null)
    }
  }

  const handlePost = async () => {
    const platformsToPost = Object.keys(selectedVariants).filter(
      (p) => selectedVariants[p] !== undefined
    )

    if (platformsToPost.length === 0) {
      toast.error("Please select at least one variant to post")
      return
    }

    setPosting(true)
    try {
      // First, update selected variants in database
      for (const platform of platformsToPost) {
        const variantIndex = selectedVariants[platform]
        const variant = variants[platform]?.[variantIndex]
        if (variant) {
          // Update variant with edited text if any
          const finalText = editedVariants[platform] || variant.text

          await fetch(`/api/posts/${postId}/variants`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              platform,
              variant_json: { ...variant, text: finalText },
              is_selected: true,
            }),
          })
        }
      }

      // Then post
      const response = await fetch("/api/post/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          platforms: platformsToPost,
          post_now: true,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to post")
      }

      toast.success(result.message || "Posts queued successfully!")
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
      setOpen(false)
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || "Failed to post")
    } finally {
      setPosting(false)
    }
  }

  const hasVariants = Object.keys(variants).length > 0
  const hasSelected = Object.keys(selectedVariants).length > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="w-4 h-4 mr-2" />
          Generate & Post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{postTitle}</DialogTitle>
          <DialogDescription>
            Generate AI-powered content variants and post to your connected social accounts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!hasVariants ? (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                No variants generated yet. Click below to generate AI-powered content.
              </p>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Variants
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Select and edit variants, then post to your connected accounts
                </p>
                <Button onClick={handleGenerate} variant="outline" size="sm" disabled={generating || regeneratingPlatform !== null}>
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Regenerating All...
                    </>
                  ) : (
                    "Regenerate All"
                  )}
                </Button>
              </div>

              <Tabs defaultValue={platforms[0].id} className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                  {platforms.map((platform) => {
                    const platformVariants = variants[platform.id] || []
                    const hasVariantsForPlatform = platformVariants.length > 0
                    return (
                      <TabsTrigger key={platform.id} value={platform.id} className="relative">
                        {platform.name}
                        {hasVariantsForPlatform && (
                          <span className="ml-1 text-xs">({platformVariants.length})</span>
                        )}
                        {selectedVariants[platform.id] !== undefined && (
                          <CheckCircle2 className="w-3 h-3 ml-1 text-green-500" />
                        )}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                {platforms.map((platform) => {
                  const platformVariants = variants[platform.id] || []
                  const selectedIndex = selectedVariants[platform.id]
                  const editedText = editedVariants[platform.id]

                  return (
                    <TabsContent key={platform.id} value={platform.id} className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">
                          {platformVariants.length > 0 
                            ? `${platformVariants.length} variant${platformVariants.length > 1 ? 's' : ''} available`
                            : "No variants generated yet"}
                        </p>
                        <Button
                          onClick={() => handleRegeneratePlatform(platform.id)}
                          variant="outline"
                          size="sm"
                          disabled={regeneratingPlatform === platform.id || generating}
                        >
                          {regeneratingPlatform === platform.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Regenerate
                            </>
                          )}
                        </Button>
                      </div>
                      {regeneratingPlatform === platform.id && (
                        <div className="w-full bg-muted rounded-full h-2 mb-4">
                          <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
                        </div>
                      )}
                      {platformVariants.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No variants for {platform.name}. Click &quot;Regenerate&quot; to create them.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {platformVariants.map((variant, index) => {
                            const isSelected = selectedIndex === index
                            const displayText = editedText && isSelected ? editedText : variant.text
                            const charCount = displayText.length
                            const isOverLimit = charCount > platform.limit

                            return (
                              <div
                                key={index}
                                className={`p-4 border rounded-lg ${
                                  isSelected ? "border-primary bg-primary/5" : "border-border"
                                }`}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`variant-${platform.id}`}
                                      checked={isSelected}
                                      onChange={() => {
                                        setSelectedVariants({ ...selectedVariants, [platform.id]: index })
                                        setEditedVariants({ ...editedVariants, [platform.id]: variant.text })
                                      }}
                                      className="mt-1"
                                    />
                                    <span className="text-sm font-medium">Variant {index + 1}</span>
                                    {variant.format !== "text" && (
                                      <Badge variant="outline" className="text-xs">
                                        {variant.format}
                                      </Badge>
                                    )}
                                  </div>
                                  <span
                                    className={`text-xs ${
                                      isOverLimit ? "text-destructive" : "text-muted-foreground"
                                    }`}
                                  >
                                    {charCount}/{platform.limit}
                                  </span>
                                </div>
                                {isSelected ? (
                                  <Textarea
                                    value={editedText || variant.text}
                                    onChange={(e) =>
                                      setEditedVariants({ ...editedVariants, [platform.id]: e.target.value })
                                    }
                                    className={`min-h-[100px] ${isOverLimit ? "border-destructive" : ""}`}
                                    placeholder="Edit variant text..."
                                  />
                                ) : (
                                  <p className="text-sm whitespace-pre-wrap">{variant.text}</p>
                                )}
                                {variant.hashtags && variant.hashtags.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {variant.hashtags.map((tag, i) => (
                                      <span key={i} className="text-xs text-muted-foreground">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </TabsContent>
                  )
                })}
              </Tabs>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePost} disabled={!hasSelected || posting}>
                  {posting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Post Selected ({Object.keys(selectedVariants).length})
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


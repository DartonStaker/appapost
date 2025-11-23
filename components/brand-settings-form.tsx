"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

interface BrandSettingsFormProps {
  initialSettings?: {
    id?: string
    brand_voice?: string
    default_hashtags?: string[]
    webhook_url?: string
  } | null
}

export function BrandSettingsForm({ initialSettings }: BrandSettingsFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    brand_voice: initialSettings?.brand_voice || "",
    default_hashtags: initialSettings?.default_hashtags?.join(" ") || "#ApparelyCustom #MzansiFashion",
    webhook_url: initialSettings?.webhook_url || `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/api/webhook/apparely`,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/settings/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_voice: formData.brand_voice,
          default_hashtags: formData.default_hashtags.split(" ").filter((tag) => tag.trim().length > 0),
          webhook_url: formData.webhook_url,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save settings")
      }

      toast.success("Brand settings saved successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Settings</CardTitle>
        <CardDescription>
          Configure your brand voice and defaults for AI content generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand_voice">Brand Voice</Label>
            <Textarea
              id="brand_voice"
              value={formData.brand_voice}
              onChange={(e) => setFormData({ ...formData, brand_voice: e.target.value })}
              placeholder="Describe your brand voice... (e.g., Fun, vibrant, SA-flair, engaging, fashion-forward)"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              This helps AI generate content that matches your brand personality
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="default_hashtags">Default Hashtags</Label>
            <Input
              id="default_hashtags"
              value={formData.default_hashtags}
              onChange={(e) => setFormData({ ...formData, default_hashtags: e.target.value })}
              placeholder="#ApparelyCustom #MzansiFashion #FashionSA"
            />
            <p className="text-xs text-muted-foreground">
              Space-separated hashtags to include in all generated posts
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhook_url">Webhook URL</Label>
            <Input
              id="webhook_url"
              type="url"
              value={formData.webhook_url}
              onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
              readOnly
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Use this URL in your Apparely store webhook settings to auto-post new products
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}


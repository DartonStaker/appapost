import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Sparkles, Instagram, Facebook, Twitter, Linkedin, Music2, Image as ImageIcon } from "lucide-react"
import { CreateTemplateDialog } from "@/components/create-template-dialog"

export const dynamic = "force-dynamic"

const platforms = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "from-purple-500 to-pink-500" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "bg-blue-600" },
  { id: "twitter", name: "X (Twitter)", icon: Twitter, color: "bg-black" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "bg-blue-700" },
  { id: "tiktok", name: "TikTok", icon: Music2, color: "bg-black" },
  { id: "pinterest", name: "Pinterest", icon: ImageIcon, color: "bg-red-600" },
] as const

const defaultTemplates: Record<string, string> = {
  instagram: `Generate 3-5 Instagram post variations for Apparely {type}:

Title: {title}
Excerpt: {excerpt}

Requirements:
- Character limit: 2200 characters
- Style: SA flair, fun, engaging, brand-appropriate
- Include hashtags: #ApparelyCustom #MzansiFashion (add 2-3 more relevant ones)
- Use carousel format if multiple images available
- Include CTA when appropriate

Return ONLY the post text variations (one per line), no explanations.`,

  facebook: `Generate 3-5 Facebook post variations for Apparely {type}:

Title: {title}
Excerpt: {excerpt}

Requirements:
- Character limit: 63206 characters
- Style: SA flair, fun, engaging, brand-appropriate
- Include hashtags: #ApparelyCustom #MzansiFashion
- Include CTA when appropriate

Return ONLY the post text variations (one per line), no explanations.`,

  twitter: `Generate 3-5 X (Twitter) post variations for Apparely {type}:

Title: {title}
Excerpt: {excerpt}

Requirements:
- Character limit: 280 characters
- Style: SA flair, fun, engaging, brand-appropriate
- Keep it concise, can use thread if needed
- Include hashtags: #ApparelyCustom #MzansiFashion

Return ONLY the post text variations (one per line), no explanations.`,

  linkedin: `Generate 3-5 LinkedIn post variations for Apparely {type}:

Title: {title}
Excerpt: {excerpt}

Requirements:
- Character limit: 3000 characters
- Style: Professional but approachable tone, SA flair
- Include hashtags: #ApparelyCustom #MzansiFashion
- Include CTA when appropriate

Return ONLY the post text variations (one per line), no explanations.`,

  tiktok: `Generate 3-5 TikTok post variations for Apparely {type}:

Title: {title}
Excerpt: {excerpt}

Requirements:
- Character limit: 150 characters
- Style: Short, punchy, video-friendly caption, SA flair
- Include hashtags: #ApparelyCustom #MzansiFashion

Return ONLY the post text variations (one per line), no explanations.`,

  pinterest: `Generate 3-5 Pinterest post variations for Apparely {type}:

Title: {title}
Excerpt: {excerpt}

Requirements:
- Character limit: 500 characters
- Style: Descriptive, SEO-friendly, SA flair
- Include hashtags: #ApparelyCustom #MzansiFashion

Return ONLY the post text variations (one per line), no explanations.`,
}

export default async function TemplatesPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()

  // Check if templates table exists, if not, we'll use default templates
  const { data: templates, error } = await supabase
    .from("templates")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  // If table doesn't exist, templates will be null/error - use defaults
  const userTemplates = templates || []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground mt-2">
            Manage AI prompt templates for each platform to customize content generation
          </p>
        </div>
        <CreateTemplateDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => {
          const platformTemplates = userTemplates.filter((t: any) => t.platform === platform.id)
          const defaultTemplate = platformTemplates.find((t: any) => t.is_default)
          const templateText = defaultTemplate?.prompt || defaultTemplates[platform.id] || "No template set"

          return (
            <Card key={platform.id} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${platform.color}`} />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <platform.icon className="w-5 h-5" />
                    <CardTitle className="capitalize">{platform.name}</CardTitle>
                  </div>
                  <Badge variant={defaultTemplate ? "default" : "secondary"}>
                    {platformTemplates.length > 0 ? `${platformTemplates.length} custom` : "Default"}
                  </Badge>
                </div>
                <CardDescription>
                  {defaultTemplate
                    ? `Using: ${defaultTemplate.name || "Custom template"}`
                    : "Using default template"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Template Preview:</p>
                    <p className="text-sm line-clamp-4 font-mono">
                      {templateText.substring(0, 200)}
                      {templateText.length > 200 ? "..." : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <CreateTemplateDialog platform={platform.id} existingTemplate={defaultTemplate} />
                    {defaultTemplate && (
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            About Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Templates customize how AI generates content for each platform. Use placeholders like <code className="bg-muted px-1 rounded">{"{title}"}</code>, <code className="bg-muted px-1 rounded">{"{excerpt}"}</code>, and <code className="bg-muted px-1 rounded">{"{type}"}</code> to inject post data.
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium mb-1">Available Placeholders:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li><code>{"{title}"}</code> - Post title</li>
                <li><code>{"{excerpt}"}</code> - Post excerpt</li>
                <li><code>{"{type}"}</code> - Post type (product/blog)</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Tips:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Keep templates concise and focused</li>
                <li>Specify character limits for each platform</li>
                <li>Include brand voice and hashtag requirements</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { templates } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import Link from "next/link"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export default async function TemplatesPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const userTemplates = await db
    .select()
    .from(templates)
    .where(eq(templates.userId, user.id!))

  const platforms: Array<"instagram" | "facebook" | "twitter" | "linkedin" | "tiktok" | "pinterest"> = [
    "instagram",
    "facebook",
    "twitter",
    "linkedin",
    "tiktok",
    "pinterest",
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates</h1>
          <p className="text-muted-foreground mt-2">
            Manage AI prompt templates for each platform
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => {
          const platformTemplates = userTemplates.filter((t) => t.platform === platform)
          const defaultTemplate = platformTemplates.find((t) => t.isDefault)

          return (
            <Card key={platform}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize">{platform}</CardTitle>
                  <Badge variant={defaultTemplate ? "default" : "secondary"}>
                    {platformTemplates.length} template{platformTemplates.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <CardDescription>
                  {defaultTemplate
                    ? `Default: ${defaultTemplate.name}`
                    : "No default template set"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {defaultTemplate ? (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {defaultTemplate.prompt.substring(0, 150)}...
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No templates for this platform yet.
                  </p>
                )}
                <Button variant="outline" size="sm" className="mt-4 w-full">
                  Manage Templates
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}


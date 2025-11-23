import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { socialAccounts, brandSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Instagram, Facebook, Twitter, Linkedin, Music2, Image as ImageIcon } from "lucide-react"

const platformIcons = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  tiktok: Music2,
  pinterest: ImageIcon,
}

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const [accounts, settings] = await Promise.all([
    db.select().from(socialAccounts).where(eq(socialAccounts.userId, user.id!)),
    db.select().from(brandSettings).where(eq(brandSettings.userId, user.id!)).limit(1),
  ])

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
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your social accounts and brand settings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Social Accounts</CardTitle>
            <CardDescription>
              Connect your social media accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {platforms.map((platform) => {
              const account = accounts.find((a) => a.platform === platform)
              const Icon = platformIcons[platform]

              return (
                <div
                  key={platform}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <div>
                      <p className="font-medium capitalize">{platform}</p>
                      {account ? (
                        <p className="text-sm text-muted-foreground">{account.accountName}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not connected</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {account && (
                      <>
                        <Badge variant={account.isActive ? "default" : "secondary"}>
                          {account.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Switch checked={account.autoPost} disabled />
                      </>
                    )}
                    <Button variant={account ? "outline" : "default"} size="sm">
                      {account ? "Reconnect" : "Connect"}
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brand Settings</CardTitle>
            <CardDescription>
              Configure your brand voice and defaults
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Brand Voice</label>
              <textarea
                className="w-full mt-2 p-3 border border-border rounded-md bg-background"
                rows={4}
                placeholder="Describe your brand voice..."
                defaultValue={settings[0]?.brandVoice || ""}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Default Hashtags</label>
              <input
                type="text"
                className="w-full mt-2 p-3 border border-border rounded-md bg-background"
                placeholder="#ApparelyCustom #PrintedWithPride..."
                defaultValue={settings[0]?.defaultHashtags?.join(" ") || ""}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Webhook URL</label>
              <input
                type="text"
                className="w-full mt-2 p-3 border border-border rounded-md bg-background"
                placeholder="https://appapost.vercel.app/api/webhook/apparely"
                defaultValue={settings[0]?.webhookUrl || ""}
                readOnly
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use this URL in your Apparely store webhook settings
              </p>
            </div>
            <Button className="w-full">Save Settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


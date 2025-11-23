import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Instagram, Facebook, Twitter, Linkedin, Music2, Image as ImageIcon, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { SettingsMessages } from "@/components/settings-messages"

export const dynamic = "force-dynamic"

const platforms = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "bg-gradient-to-br from-purple-500 to-pink-500" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "bg-blue-600" },
  { id: "twitter", name: "X (Twitter)", icon: Twitter, color: "bg-black" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "bg-blue-700" },
  { id: "tiktok", name: "TikTok", icon: Music2, color: "bg-black" },
  { id: "pinterest", name: "Pinterest", icon: ImageIcon, color: "bg-red-600" },
] as const

type PlatformId = typeof platforms[number]["id"]

async function ConnectButton({ platform, isConnected }: { platform: typeof platforms[number]; isConnected: boolean }) {
  if (isConnected) {
    return (
      <Button variant="outline" disabled className="w-full">
        <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
        Connected
      </Button>
    )
  }

  return (
    <form action={`/api/social/oauth/${platform.id}`} method="get">
      <Button type="submit" variant="outline" className="w-full">
        <platform.icon className="w-4 h-4 mr-2" />
        Connect {platform.name}
      </Button>
    </form>
  )
}

export default async function ConnectionsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: accounts } = await supabase
    .from("social_accounts")
    .select("platform, account_name, is_active, ayrshare_profile_id")
    .eq("user_id", user.id)
    .eq("is_active", true)

  const connectedPlatforms = new Set(accounts?.map((a) => a.platform) || [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Social Connections</h1>
        <p className="text-muted-foreground mt-2">
          Connect your social media accounts via Ayrshare for unified posting
        </p>
      </div>

      <SettingsMessages />

      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Connect your accounts to enable auto-posting. All connections use Ayrshare for unified management.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {platforms.map((platform) => {
              const isConnected = connectedPlatforms.has(platform.id)
              const account = accounts?.find((a) => a.platform === platform.id)

              return (
                <Card key={platform.id} className="relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-1 ${platform.color}`} />
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${platform.color} text-white`}>
                        <platform.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{platform.name}</h3>
                        {account && (
                          <p className="text-sm text-muted-foreground">{account.account_name}</p>
                        )}
                      </div>
                    </div>
                    <ConnectButton platform={platform} isConnected={isConnected} />
                    {account?.ayrshare_profile_id && (
                      <p className="text-xs text-muted-foreground mt-2">
                        ✓ Ayrshare connected
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">About Ayrshare</h4>
            <p className="text-sm text-muted-foreground">
              Ayrshare provides unified posting across all platforms. Once connected, you can post to multiple
              platforms simultaneously. Free tier includes limited posts. Upgrade to Pro ($29/mo) for unlimited posting.
            </p>
            <a
              href="https://www.ayrshare.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline mt-2 inline-block"
            >
              Learn more about Ayrshare →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


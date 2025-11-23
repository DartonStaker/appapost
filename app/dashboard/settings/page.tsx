import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SettingsMessages } from "@/components/settings-messages"
import { Instagram, Facebook, Twitter, Linkedin, Music2, Image as ImageIcon, ExternalLink } from "lucide-react"
import Link from "next/link"
import { AccountList } from "@/components/account-list"
import { BrandSettingsForm } from "@/components/brand-settings-form"

export const dynamic = "force-dynamic"

const platforms = [
  { id: "instagram", name: "Instagram", icon: Instagram },
  { id: "facebook", name: "Facebook", icon: Facebook },
  { id: "twitter", name: "X (Twitter)", icon: Twitter },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin },
  { id: "tiktok", name: "TikTok", icon: Music2 },
  { id: "pinterest", name: "Pinterest", icon: ImageIcon },
]

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()

  // Fetch accounts and brand settings
  const [accountsResult, settingsResult] = await Promise.all([
    supabase
      .from("social_accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("brand_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ])

  const accounts = accountsResult.data || []
  const brandSettings = settingsResult.data || null

  const connectedCount = accounts.filter((a) => a.is_active).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your social accounts and brand settings
        </p>
      </div>

      <SettingsMessages />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Social Accounts</CardTitle>
                <CardDescription>
                  {connectedCount} of {platforms.length} platforms connected
                </CardDescription>
              </div>
              <Link href="/dashboard/settings/connections">
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <AccountList accounts={accounts} platforms={platforms} />
            <div className="pt-4 border-t border-border mt-4">
              <Link href="/dashboard/settings/connections">
                <Button variant="outline" className="w-full">
                  Connect More Accounts
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <BrandSettingsForm initialSettings={brandSettings} />
      </div>
    </div>
  )
}

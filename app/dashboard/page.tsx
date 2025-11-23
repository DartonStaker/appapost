import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Calendar, CheckCircle, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()

  try {
    // Fetch all stats in parallel
    const [
      { count: totalPosts },
      { count: scheduledCount },
      { count: postedCount },
      { count: connectedCount },
      { data: recentPosts },
    ] = await Promise.all([
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("schedules").select("*", { count: "exact", head: true }),
      supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "posted"),
      supabase.from("social_accounts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here&apos;s what&apos;s happening with your social media automation.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledCount || 0}</div>
            <p className="text-xs text-muted-foreground">Upcoming posts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{postedCount || 0}</div>
            <p className="text-xs text-muted-foreground">Successfully posted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedCount || 0}</div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>Your latest content</CardDescription>
          </CardHeader>
          <CardContent>
            {!recentPosts || recentPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No posts yet. Create your first post!</p>
            ) : (
              <div className="space-y-4">
                {recentPosts.map((post: any) => (
                  <div key={post.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {post.type} • {post.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Link href={`/dashboard/posts/${post.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started quickly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/settings">
              <Button variant="outline" className="w-full justify-start">
                Connect Social Accounts
              </Button>
            </Link>
            <Link href="/dashboard/templates">
              <Button variant="outline" className="w-full justify-start">
                Manage Templates
              </Button>
            </Link>
            <Link href="/dashboard/schedule">
              <Button variant="outline" className="w-full justify-start">
                View Schedule
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
  } catch (error) {
    console.error("Error loading dashboard:", error)
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here&apos;s what&apos;s happening with your social media automation.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Unable to load dashboard data. Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
}


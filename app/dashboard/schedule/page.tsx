import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, X, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SchedulePage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()

  // Fetch queued posts from posting_queue table
  const { data: queuedPosts, error } = await supabase
    .from("posting_queue")
    .select(`
      *,
      posts (
        id,
        title,
        excerpt,
        image_url,
        type,
        status
      ),
      post_variants (
        id,
        platform,
        variant_json
      )
    `)
    .eq("posts.user_id", user.id)
    .in("status", ["queued", "processing"])
    .order("scheduled_time", { ascending: true })

  // Fetch recently posted items
  const { data: recentPosts } = await supabase
    .from("posting_queue")
    .select(`
      *,
      posts (
        id,
        title,
        excerpt,
        image_url,
        type
      )
    `)
    .eq("posts.user_id", user.id)
    .eq("status", "posted")
    .order("posted_at", { ascending: false })
    .limit(10)

  const platformColors: Record<string, string> = {
    instagram: "bg-gradient-to-br from-purple-500 to-pink-500",
    facebook: "bg-blue-600",
    twitter: "bg-black",
    linkedin: "bg-blue-700",
    tiktok: "bg-black",
    pinterest: "bg-red-600",
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Schedule</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your scheduled social media posts
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Upcoming Posts
            </CardTitle>
            <CardDescription>
              Posts queued for automatic posting
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!queuedPosts || queuedPosts.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">No scheduled posts</p>
                <p className="text-xs text-muted-foreground">
                  Create a post and queue it for posting to see it here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {queuedPosts.map((item: any) => {
                  const post = item.posts
                  const variant = item.post_variants
                  const scheduledTime = item.scheduled_time
                    ? new Date(item.scheduled_time)
                    : null
                  const isPast = scheduledTime && scheduledTime < new Date()

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 ${platformColors[item.platform] || "bg-gray-500"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <p className="font-medium truncate">{post?.title || "Untitled Post"}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs capitalize">
                                {item.platform}
                              </Badge>
                              <Badge
                                variant={item.status === "processing" ? "default" : "secondary"}
                                className="text-xs capitalize"
                              >
                                {item.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {scheduledTime && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>
                              {isPast
                                ? `Was scheduled for ${scheduledTime.toLocaleString()}`
                                : `Scheduled for ${scheduledTime.toLocaleString()}`}
                            </span>
                          </div>
                        )}
                        {variant?.variant_json?.text && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {variant.variant_json.text.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                      {post && (
                        <Link href={`/dashboard/posts/${post.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Recently Posted
            </CardTitle>
            <CardDescription>
              Your latest published posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!recentPosts || recentPosts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No recent posts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPosts.map((item: any) => {
                  const post = item.posts
                  const postedAt = item.posted_at ? new Date(item.posted_at) : null

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-4 border border-border rounded-lg"
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 ${platformColors[item.platform] || "bg-gray-500"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{post?.title || "Untitled Post"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {item.platform}
                          </Badge>
                          {postedAt && (
                            <span className="text-xs text-muted-foreground">
                              {postedAt.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {post && (
                        <Link href={`/dashboard/posts/${post.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

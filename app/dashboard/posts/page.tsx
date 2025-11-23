import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreatePostForm } from "@/components/create-post-form"
import { PostsTable } from "@/components/posts-table"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PostsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const postsByStatus = {
    draft: posts?.filter((p) => p.status === "draft") || [],
    queued: posts?.filter((p) => p.status === "queued") || [],
    posted: posts?.filter((p) => p.status === "posted") || [],
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Posts</h1>
          <p className="text-muted-foreground mt-2">
            Create, generate, and manage your social media posts
          </p>
        </div>
        <CreatePostForm />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Draft Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{postsByStatus.draft.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to generate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Queued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{postsByStatus.queued.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled for posting</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Posted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{postsByStatus.posted.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully published</p>
          </CardContent>
        </Card>
      </div>

      <PostsTable posts={posts || []} />
    </div>
  )
}

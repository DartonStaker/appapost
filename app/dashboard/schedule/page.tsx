import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { scheduledPosts, posts } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export default async function SchedulePage() {
  const user = await getCurrentUser()
  if (!user) return null

  const scheduled = await db
    .select({
      scheduledPost: scheduledPosts,
      post: posts,
    })
    .from(scheduledPosts)
    .leftJoin(posts, eq(scheduledPosts.postId, posts.id))
    .where(eq(scheduledPosts.status, "scheduled"))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Schedule</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your scheduled posts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Posts</CardTitle>
          <CardDescription>
            Your scheduled social media posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scheduled.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scheduled posts</p>
          ) : (
            <div className="space-y-4">
              {scheduled.map((item) => (
                <div
                  key={item.scheduledPost.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item.post?.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.scheduledPost.scheduledFor).toLocaleString()} • {item.scheduledPost.platform}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm capitalize">{item.scheduledPost.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


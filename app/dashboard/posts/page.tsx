import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { posts } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

export default async function PostsPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const allPosts = await db
    .select()
    .from(posts)
    .where(eq(posts.userId, user.id!))
    .orderBy(desc(posts.createdAt))

  const postsByStatus = {
    draft: allPosts.filter((p) => p.status === "draft"),
    scheduled: allPosts.filter((p) => p.status === "scheduled"),
    posted: allPosts.filter((p) => p.status === "posted"),
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Posts</h1>
          <p className="text-muted-foreground mt-2">
            Manage all your social media posts
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(postsByStatus).map(([status, statusPosts]) => (
          <div key={status}>
            <h2 className="text-xl font-semibold mb-4 capitalize">{status} ({statusPosts.length})</h2>
            {statusPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No {status} posts</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {statusPosts.map((post) => (
                  <Card key={post.id} className="overflow-hidden">
                    {post.imageUrl && (
                      <div className="relative w-full h-48">
                        <Image
                          src={post.imageUrl}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        <Badge variant={post.status === "posted" ? "default" : "secondary"}>
                          {post.status}
                        </Badge>
                      </div>
                      <CardDescription>{post.excerpt || post.content?.substring(0, 100)}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground capitalize">
                          {post.contentType}
                        </span>
                        <Link href={`/dashboard/posts/${post.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


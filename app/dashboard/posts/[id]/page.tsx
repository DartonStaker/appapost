import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { posts, postVariations, scheduledPosts, socialAccounts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { PostToAllButton } from "@/components/post-to-all-button"
import { Platform } from "@/types"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export default async function PostDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()
  if (!user) return null

  const [post] = await db.select().from(posts).where(eq(posts.id, params.id)).limit(1)

  if (!post || post.userId !== user.id!) {
    return <div>Post not found</div>
  }

  const variations = await db
    .select()
    .from(postVariations)
    .where(eq(postVariations.postId, params.id))

  const scheduled = await db
    .select({
      scheduledPost: scheduledPosts,
      account: socialAccounts,
    })
    .from(scheduledPosts)
    .leftJoin(socialAccounts, eq(scheduledPosts.socialAccountId, socialAccounts.id))
    .where(eq(scheduledPosts.postId, params.id))

  const accounts = await db
    .select()
    .from(socialAccounts)
    .where(and(eq(socialAccounts.userId, user.id!), eq(socialAccounts.isActive, true)))

  const variationsByPlatform = variations.reduce((acc, v) => {
    if (!acc[v.platform]) acc[v.platform] = []
    acc[v.platform].push(v)
    return acc
  }, {} as Record<Platform, typeof variations>)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{post.title}</h1>
          <p className="text-muted-foreground mt-2">
            {post.contentType} • {post.status}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={post.status === "posted" ? "default" : "secondary"}>
            {post.status}
          </Badge>
          <PostToAllButton 
            postId={post.id} 
            variations={variations.map(v => ({ ...v, hashtags: v.hashtags || [] }))} 
            accounts={accounts} 
          />
        </div>
      </div>

      {post.imageUrl && (
        <div className="relative w-full h-96 rounded-lg overflow-hidden border border-border">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <p className="text-sm text-muted-foreground">{post.title}</p>
            </div>
            {post.excerpt && (
              <div>
                <label className="text-sm font-medium">Excerpt</label>
                <p className="text-sm text-muted-foreground">{post.excerpt}</p>
              </div>
            )}
            {post.productUrl && (
              <div>
                <label className="text-sm font-medium">Product URL</label>
                <a
                  href={post.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {post.productUrl}
                </a>
              </div>
            )}
            {post.tags && post.tags.length > 0 && (
              <div>
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {post.tags.map((tag, i) => (
                    <Badge key={i} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Variations</CardTitle>
            <CardDescription>
              AI-generated content for each platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(variationsByPlatform).map(([platform, platformVariations]) => (
              <div key={platform} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{platform}</span>
                  <Badge variant="secondary">{platformVariations.length} variations</Badge>
                </div>
                <div className="space-y-2">
                  {platformVariations.map((variation) => (
                    <div
                      key={variation.id}
                      className={`p-3 rounded border ${
                        variation.isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <p className="text-sm">{variation.content}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {variation.hashtags?.slice(0, 5).map((tag, i) => (
                          <span key={i} className="text-xs text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {scheduled.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scheduled.map((item) => (
                <div
                  key={item.scheduledPost.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium capitalize">{item.scheduledPost.platform}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.scheduledPost.postedAt
                        ? `Posted: ${new Date(item.scheduledPost.postedAt).toLocaleString()}`
                        : `Scheduled: ${new Date(item.scheduledPost.scheduledFor).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        item.scheduledPost.status === "posted"
                          ? "default"
                          : item.scheduledPost.status === "failed"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {item.scheduledPost.status}
                    </Badge>
                    {item.scheduledPost.postUrl && (
                      <a
                        href={item.scheduledPost.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


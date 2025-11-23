"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GeneratePostModal } from "@/components/generate-post-modal"
import { Sparkles, ExternalLink } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Post {
  id: string
  title: string
  excerpt?: string
  image_url?: string
  type: string
  status: string
  created_at: string
}

export function PostsTable({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Create your first post to start generating social media content
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Posts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              {post.image_url && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={post.image_url}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold truncate">{post.title}</h3>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                  <Badge variant={post.status === "posted" ? "default" : "secondary"}>
                    {post.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline" className="text-xs">
                    {post.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <GeneratePostModal postId={post.id} postTitle={post.title} />
                <Link href={`/dashboard/posts/${post.id}`}>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


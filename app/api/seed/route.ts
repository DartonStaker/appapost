import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { seedSamplePosts } from "@/lib/seed"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user already has posts
    const { count } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (count && count > 0) {
      return NextResponse.json({
        message: "Posts already exist. Skipping seed.",
        count,
      })
    }

    // Seed sample posts
    const posts = await seedSamplePosts(user.id)

    return NextResponse.json({
      message: "Sample posts created successfully",
      posts,
    })
  } catch (error: any) {
    console.error("Seed API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateVariants } from "@/lib/ai"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user's posts
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching posts:", error)
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
    }

    return NextResponse.json({ posts: posts || [] })
  } catch (error: any) {
    console.error("Posts API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, excerpt, image_url, type } = body

    if (!title || !type) {
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 }
      )
    }

    // Create draft post
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        title,
        excerpt: excerpt || null,
        image_url: image_url || null,
        type: type as "product" | "blog",
        status: "draft",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating post:", error)
      return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
    }

    // Automatically generate variants for all platforms (minimum 3 per platform)
    try {
      // Fetch brand settings for better content generation
      const { data: brandSettings } = await supabase
        .from("brand_settings")
        .select("brand_voice, default_hashtags")
        .eq("user_id", user.id)
        .maybeSingle()

      const variants = await generateVariants(
        {
          title: post.title,
          excerpt: post.excerpt || undefined,
          image_url: post.image_url || undefined,
          type: post.type as "product" | "blog",
        },
        ["instagram", "facebook", "x", "linkedin", "tiktok", "pinterest"], // Use "x" instead of "twitter"
        brandSettings
      )

      // Store variants in database
      // generateVariants already ensures minimum 3 variants per platform
      const variantInserts = []
      for (const [platform, platformVariants] of Object.entries(variants)) {
        if (platformVariants.length > 0) {
          variantInserts.push({
            post_id: post.id,
            platform,
            variant_json: platformVariants.slice(0, 5), // Store up to 5 variants
            is_selected: false,
          })
        }
      }

      if (variantInserts.length > 0) {
        const { error: variantError } = await supabase
          .from("post_variants")
          .insert(variantInserts)

        if (variantError) {
          console.error("Error storing auto-generated variants:", variantError)
          // Don't fail the post creation if variant generation fails
        }
      }
    } catch (variantGenError) {
      console.error("Error auto-generating variants:", variantGenError)
      // Don't fail the post creation if variant generation fails
    }

    return NextResponse.json({ 
      post,
      variants_auto_generated: true 
    }, { status: 201 })
  } catch (error: any) {
    console.error("Create post API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}


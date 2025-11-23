import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { generateVariants } from "@/lib/ai"

export const dynamic = "force-dynamic"

/**
 * Generate AI variants for a post
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { post_id, platforms } = body

    if (!post_id) {
      return NextResponse.json({ error: "Missing post_id" }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch the post
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", post_id)
      .eq("user_id", user.id)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Generate variants for all platforms or specified ones
    const targetPlatforms = platforms || [
      "instagram",
      "facebook",
      "twitter",
      "linkedin",
      "tiktok",
      "pinterest",
    ]

    const variants = await generateVariants(
      {
        title: post.title,
        excerpt: post.excerpt || undefined,
        image_url: post.image_url || undefined,
        type: post.type as "product" | "blog",
      },
      targetPlatforms
    )

    // Store variants in database
    const variantInserts = []
    for (const [platform, platformVariants] of Object.entries(variants)) {
      for (const variant of platformVariants) {
        variantInserts.push({
          post_id: post_id,
          platform,
          variant_json: variant,
          is_selected: false,
        })
      }
    }

    if (variantInserts.length > 0) {
      const { error: insertError } = await supabase
        .from("post_variants")
        .upsert(variantInserts, {
          onConflict: "post_id,platform",
        })

      if (insertError) {
        console.error("Error storing variants:", insertError)
        return NextResponse.json({ error: "Failed to store variants" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      variants,
      message: `Generated ${variantInserts.length} variants across ${targetPlatforms.length} platforms`,
    })
  } catch (error: any) {
    console.error("AI generation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate variants" },
      { status: 500 }
    )
  }
}

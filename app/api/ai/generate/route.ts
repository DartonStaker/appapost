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

    // Fetch the post and brand settings
    const [postResult, brandSettingsResult] = await Promise.all([
      supabase
        .from("posts")
        .select("*")
        .eq("id", post_id)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("brand_settings")
        .select("brand_voice, default_hashtags")
        .eq("user_id", user.id)
        .maybeSingle(),
    ])

    const { data: post, error: postError } = postResult
    const { data: brandSettings } = brandSettingsResult

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Generate variants for all platforms or specified ones
    // Map "twitter" to "x" for new API, but keep legacy support
    const targetPlatforms = (platforms || [
      "instagram",
      "facebook",
      "twitter",
      "linkedin",
      "tiktok",
      "pinterest",
    ]).map((p) => (p === "twitter" ? "x" : p)) as Array<"instagram" | "facebook" | "x" | "linkedin" | "tiktok" | "pinterest">

    // Delete existing variants for this post (to allow regeneration)
    const { error: deleteError } = await supabase
      .from("post_variants")
      .delete()
      .eq("post_id", post_id)

    if (deleteError) {
      console.error("Error deleting old variants:", deleteError)
      // Continue anyway - might be first generation
    }

    const variants = await generateVariants(
      {
        title: post.title,
        excerpt: post.excerpt || undefined,
        image_url: post.image_url || undefined,
        type: post.type as "product" | "blog",
      },
      targetPlatforms,
      brandSettings
    )

    // Store variants in database
    // Note: Since schema has UNIQUE(post_id, platform), we store all variants for a platform as a JSON array
    const variantInserts = []
    for (const [platform, platformVariants] of Object.entries(variants)) {
      if (platformVariants.length > 0) {
        // Store all variants for this platform as an array in variant_json
        variantInserts.push({
          post_id: post_id,
          platform,
          variant_json: platformVariants, // Store array of variants
          is_selected: false,
        })
      }
    }

    if (variantInserts.length > 0) {
      const { error: insertError } = await supabase
        .from("post_variants")
        .insert(variantInserts)

      if (insertError) {
        console.error("Error storing variants:", insertError)
        return NextResponse.json({ error: "Failed to store variants" }, { status: 500 })
      }
    }

    // Count total variants generated
    const totalVariants = Object.values(variants).reduce((sum, platformVariants) => sum + platformVariants.length, 0)
    
    // Determine which AI service was used (check logs or default to first available)
    const aiService = process.env.OLLAMA_URL ? "Ollama (local)" : process.env.GROK_API_KEY ? "Grok (xAI)" : process.env.OPENAI_API_KEY ? "OpenAI" : "Unknown"

    // Check if vision failed (non-enumerable property)
    const visionFailed = (variants as any)._visionFailed === true

    return NextResponse.json({
      success: true,
      variants,
      visionFailed, // Include flag for client toast
      message: `Generated ${totalVariants} variants across ${targetPlatforms.length} platforms using ${aiService}`,
    })
  } catch (error: any) {
    console.error("AI generation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate variants" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { generateVariants, Platform } from "@/lib/ai"

export const dynamic = "force-dynamic"

/**
 * Regenerate variants for a single platform
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { platform } = await params
    const body = await request.json()
    const { post_id } = body

    if (!post_id) {
      return NextResponse.json({ error: "Missing post_id" }, { status: 400 })
    }

    // Validate platform and map "twitter" to "x"
    const validPlatforms = ["instagram", "facebook", "twitter", "x", "linkedin", "tiktok", "pinterest"]
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 })
    }
    
    // Map "twitter" to "x" for new API
    const mappedPlatform = (platform === "twitter" ? "x" : platform) as Platform

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

    // Generate variants for this platform only
    const variants = await generateVariants(
      {
        title: post.title,
        excerpt: post.excerpt || undefined,
        image_url: post.image_url || undefined,
        type: post.type as "product" | "blog",
      },
      [mappedPlatform],
      brandSettings
    )

    const platformVariants = variants[mappedPlatform] || []
    
    // Ensure minimum 3 variants
    const minVariants = platformVariants.length >= 3 
      ? platformVariants 
      : [...platformVariants, ...platformVariants.slice(0, Math.max(0, 3 - platformVariants.length))]

    // Delete existing variants for this platform
    await supabase
      .from("post_variants")
      .delete()
      .eq("post_id", post_id)
      .eq("platform", platform) // Keep original platform name in DB for compatibility

    // Store new variants
    if (minVariants.length > 0) {
      const { error: insertError } = await supabase
        .from("post_variants")
        .insert({
          post_id: post_id,
          platform,
          variant_json: minVariants.slice(0, 5), // Store up to 5 variants
          is_selected: false,
        })

      if (insertError) {
        console.error("Error storing variants:", insertError)
        return NextResponse.json({ error: "Failed to store variants" }, { status: 500 })
      }
    }

    // Determine which AI service was used
    const aiService = process.env.OLLAMA_URL ? "Ollama (local)" : process.env.GROK_API_KEY ? "Grok (xAI)" : process.env.OPENAI_API_KEY ? "OpenAI" : "Unknown"

      return NextResponse.json({
      success: true,
      variants: { [platform]: minVariants }, // Return with original platform name
      message: `Generated ${minVariants.length} variants for ${platform} using ${aiService}`,
    })
  } catch (error: any) {
    console.error("AI generation error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate variants" },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * Get variants for a post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Verify post ownership
    const { data: post } = await supabase
      .from("posts")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Get variants
    const { data: variants, error } = await supabase
      .from("post_variants")
      .select("*")
      .eq("post_id", id)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch variants" }, { status: 500 })
    }

    // Group by platform
    // variant_json can be either an array (new format) or a single object (old format)
    const grouped: Record<string, any[]> = {}
    variants?.forEach((v) => {
      if (!grouped[v.platform]) {
        grouped[v.platform] = []
      }
      // Handle both array (new format) and single object (old format)
      if (Array.isArray(v.variant_json)) {
        grouped[v.platform].push(...v.variant_json)
      } else {
        grouped[v.platform].push(v.variant_json)
      }
    })

    return NextResponse.json({ variants: grouped })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch variants" }, { status: 500 })
  }
}

/**
 * Update a variant (mark as selected, update text)
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { post_id, platform, variant_json, is_selected } = body

    if (!post_id || !platform || !variant_json) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify post ownership
    const { data: post } = await supabase
      .from("posts")
      .select("id")
      .eq("id", post_id)
      .eq("user_id", user.id)
      .single()

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Upsert variant
    const { error } = await supabase
      .from("post_variants")
      .upsert(
        {
          post_id,
          platform,
          variant_json,
          is_selected: is_selected !== undefined ? is_selected : false,
        },
        {
          onConflict: "post_id,platform",
        }
      )

    if (error) {
      return NextResponse.json({ error: "Failed to update variant" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update variant" }, { status: 500 })
  }
}


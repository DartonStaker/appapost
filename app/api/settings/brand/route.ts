import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * Save or update brand settings
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { brand_voice, default_hashtags, webhook_url } = body

    const supabase = await createClient()

    // Check if settings exist
    const { data: existing } = await supabase
      .from("brand_settings")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    const settingsData = {
      user_id: user.id,
      brand_voice: brand_voice || null,
      default_hashtags: default_hashtags || [],
      webhook_url: webhook_url || `${process.env.NEXT_PUBLIC_SITE_URL || "https://appapost.vercel.app"}/api/webhook/apparely`,
    }

    let result
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from("brand_settings")
        .update(settingsData)
        .eq("id", existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new
      const { data, error } = await supabase
        .from("brand_settings")
        .insert(settingsData)
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({ settings: result })
  } catch (error: any) {
    console.error("Error saving brand settings:", error)
    return NextResponse.json(
      { error: error.message || "Failed to save brand settings" },
      { status: 500 }
    )
  }
}


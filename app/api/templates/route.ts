import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * Get all templates for the user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: templates, error } = await supabase
      .from("templates")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch templates" }, { status: 500 })
  }
}

/**
 * Create a new template
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, platform, prompt, is_default } = body

    if (!name || !platform || !prompt) {
      return NextResponse.json(
        { error: "Name, platform, and prompt are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // If this is set as default, unset other defaults for this platform
    if (is_default) {
      await supabase
        .from("templates")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .eq("platform", platform)
    }

    // Create the template
    const { data: template, error } = await supabase
      .from("templates")
      .insert({
        user_id: user.id,
        name,
        platform,
        prompt,
        is_default: is_default ?? false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating template:", error)
      return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create template" }, { status: 500 })
  }
}


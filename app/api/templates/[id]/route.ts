import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * Update a template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, prompt, is_default } = body

    const supabase = await createClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from("templates")
      .select("platform")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // If setting as default, unset other defaults for this platform
    if (is_default) {
      await supabase
        .from("templates")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .eq("platform", existing.platform)
        .neq("id", id)
    }

    // Update the template
    const { data: template, error } = await supabase
      .from("templates")
      .update({
        ...(name && { name }),
        ...(prompt && { prompt }),
        ...(is_default !== undefined && { is_default }),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to update template" }, { status: 500 })
    }

    return NextResponse.json({ template })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update template" }, { status: 500 })
  }
}

/**
 * Delete a template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: "Failed to delete template" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete template" }, { status: 500 })
  }
}


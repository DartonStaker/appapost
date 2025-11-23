import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

/**
 * Update account settings (is_active, auto_post)
 */
export async function PATCH(
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
    const { is_active, auto_post } = body

    const supabase = await createClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from("social_accounts")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Update account
    const updates: any = {}
    if (is_active !== undefined) updates.is_active = is_active
    if (auto_post !== undefined) updates.auto_post = auto_post

    const { data: account, error } = await supabase
      .from("social_accounts")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
    }

    return NextResponse.json({ account })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update account" }, { status: 500 })
  }
}

/**
 * Delete (disconnect) an account
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

    // Verify ownership and delete
    const { error } = await supabase
      .from("social_accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete account" }, { status: 500 })
  }
}

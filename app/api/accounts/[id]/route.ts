import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { socialAccounts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

// Update account settings (toggle active, autopost, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { isActive, autoPost } = body

    // Verify account belongs to user
    const [account] = await db
      .select()
      .from(socialAccounts)
      .where(
        and(eq(socialAccounts.id, params.id), eq(socialAccounts.userId, user.id!))
      )
      .limit(1)

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Update account
    await db
      .update(socialAccounts)
      .set({
        isActive: isActive !== undefined ? isActive : account.isActive,
        autoPost: autoPost !== undefined ? autoPost : account.autoPost,
        updatedAt: new Date(),
      })
      .where(eq(socialAccounts.id, params.id))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Account update error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update account" },
      { status: 500 }
    )
  }
}

// Delete/disconnect account
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify account belongs to user
    const [account] = await db
      .select()
      .from(socialAccounts)
      .where(
        and(eq(socialAccounts.id, params.id), eq(socialAccounts.userId, user.id!))
      )
      .limit(1)

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Delete account
    await db.delete(socialAccounts).where(eq(socialAccounts.id, params.id))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Account deletion error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete account" },
      { status: 500 }
    )
  }
}


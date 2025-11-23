import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { socialAccounts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { Platform } from "@/types"
import { createId } from "@paralleldrive/cuid2"

// Manual token entry for platforms that don't support OAuth easily (like Twitter)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { platform, accessToken, refreshToken, accountId, accountName } = body

    if (!platform || !accessToken || !accountId || !accountName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if account already exists
    const [existingAccount] = await db
      .select()
      .from(socialAccounts)
      .where(
        and(
          eq(socialAccounts.userId, user.id!),
          eq(socialAccounts.platform, platform as Platform),
          eq(socialAccounts.accountId, accountId)
        )
      )
      .limit(1)

    if (existingAccount) {
      // Update existing account
      await db
        .update(socialAccounts)
        .set({
          accessToken,
          refreshToken: refreshToken || existingAccount.refreshToken,
          accountName,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(socialAccounts.id, existingAccount.id))
    } else {
      // Create new account
      await db.insert(socialAccounts).values({
        id: createId(),
        userId: user.id!,
        platform: platform as Platform,
        accountId,
        accountName,
        accessToken,
        refreshToken,
        isActive: true,
        autoPost: false,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Manual connection error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to connect account" },
      { status: 500 }
    )
  }
}


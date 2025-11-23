import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

type Platform = "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok" | "pinterest"

/**
 * OAuth callback handler - redirects to frontend with code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const platform = params.platform as Platform
  const code = request.nextUrl.searchParams.get("code")
  const error = request.nextUrl.searchParams.get("error")
  const state = request.nextUrl.searchParams.get("state")

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings/connections?error=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings/connections?error=no_code`
    )
  }

  // Exchange code for tokens server-side
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.redirect(`${baseUrl}/login?error=unauthorized`)
    }

    // Call the connect API to exchange and store
    const response = await fetch(`${baseUrl}/api/social/connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") || "",
      },
      body: JSON.stringify({ platform, code, state }),
    })

    const result = await response.json()

    if (result.success) {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/settings/connections?success=${encodeURIComponent(result.message)}`
      )
    } else {
      return NextResponse.redirect(
        `${baseUrl}/dashboard/settings/connections?error=${encodeURIComponent(result.error || "Connection failed")}`
      )
    }
  } catch (error: any) {
    console.error("Callback error:", error)
    return NextResponse.redirect(
      `${baseUrl}/dashboard/settings/connections?error=${encodeURIComponent(error.message || "Connection failed")}`
    )
  }
}


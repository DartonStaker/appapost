import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  const errorDescription = requestUrl.searchParams.get("error_description")
  const next = requestUrl.searchParams.get("next") || "/dashboard"

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin

  // Handle OAuth errors from provider
  if (error) {
    console.error("OAuth error from provider:", error, errorDescription)
    const errorMsg = errorDescription || error
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(errorMsg)}`)
  }

  // Handle missing code
  if (!code) {
    console.warn("No code parameter in callback URL")
    return NextResponse.redirect(`${baseUrl}/login?error=no_code`)
  }

  try {
    const supabase = await createClient()

    // Exchange code for session (server-side handles PKCE automatically)
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("Error exchanging code:", exchangeError)
      console.error("Error details:", {
        message: exchangeError.message,
        status: exchangeError.status,
        name: exchangeError.name,
      })
      const errorMsg = exchangeError.message || "auth_failed"
      return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(errorMsg)}`)
    }

    if (!data.session) {
      console.error("No session returned after code exchange")
      return NextResponse.redirect(`${baseUrl}/login?error=no_session`)
    }

    console.log("Session created successfully, redirecting to:", next)
    // Successfully authenticated, redirect to dashboard
    return NextResponse.redirect(`${baseUrl}${next}`)
  } catch (error: any) {
    console.error("Callback error:", error)
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
    })
    const errorMsg = error?.message || "auth_failed"
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(errorMsg)}`)
  }
}


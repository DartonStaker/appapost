"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code")
      const errorParam = searchParams.get("error")
      const errorDescription = searchParams.get("error_description")
      const next = searchParams.get("next") || "/dashboard"

      // Check for OAuth errors from Supabase/Google
      if (errorParam) {
        console.error("OAuth error from provider:", errorParam, errorDescription)
        const errorMsg = errorDescription || errorParam
        const loginUrl = process.env.NEXT_PUBLIC_SITE_URL 
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=${encodeURIComponent(errorMsg)}`
          : `/login?error=${encodeURIComponent(errorMsg)}`
        window.location.href = loginUrl
        return
      }

      if (code) {
        try {
          console.log("Exchanging code for session...", { codeLength: code.length })
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error("Error exchanging code:", error)
            console.error("Error details:", {
              message: error.message,
              status: error.status,
              name: error.name,
            })
            const errorMsg = error.message || "auth_failed"
            const loginUrl = process.env.NEXT_PUBLIC_SITE_URL 
              ? `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=${encodeURIComponent(errorMsg)}`
              : `/login?error=${encodeURIComponent(errorMsg)}`
            window.location.href = loginUrl
            return
          }

          if (!data.session) {
            console.error("No session returned after code exchange")
            const loginUrl = process.env.NEXT_PUBLIC_SITE_URL 
              ? `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=no_session`
              : `/login?error=no_session`
            window.location.href = loginUrl
            return
          }

          console.log("Session created successfully, redirecting to:", next)
          // Successfully authenticated, redirect to dashboard
          // Use window.location for full page reload to ensure session is set
          const dashboardUrl = process.env.NEXT_PUBLIC_SITE_URL 
            ? `${process.env.NEXT_PUBLIC_SITE_URL}${next}`
            : next
          window.location.href = dashboardUrl
        } catch (error: any) {
          console.error("Callback error:", error)
          console.error("Error details:", {
            message: error?.message,
            stack: error?.stack,
          })
          const errorMsg = error?.message || "auth_failed"
          const loginUrl = process.env.NEXT_PUBLIC_SITE_URL 
            ? `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=${encodeURIComponent(errorMsg)}`
            : `/login?error=${encodeURIComponent(errorMsg)}`
          window.location.href = loginUrl
        }
      } else {
        // No code, redirect to login
        console.warn("No code parameter in callback URL")
        const loginUrl = process.env.NEXT_PUBLIC_SITE_URL 
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=no_code`
          : `/login?error=no_code`
        window.location.href = loginUrl
      }
    }

    handleCallback()
  }, [searchParams, router, supabase.auth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}


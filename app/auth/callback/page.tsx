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
      const next = searchParams.get("next") || "/dashboard"

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error("Error exchanging code:", error)
            // Redirect to login with error, using full URL if needed
            const loginUrl = process.env.NEXT_PUBLIC_SITE_URL 
              ? `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=auth_failed`
              : `/login?error=auth_failed`
            window.location.href = loginUrl
            return
          }

          // Successfully authenticated, redirect to dashboard
          // Use window.location for full page reload to ensure session is set
          const dashboardUrl = process.env.NEXT_PUBLIC_SITE_URL 
            ? `${process.env.NEXT_PUBLIC_SITE_URL}${next}`
            : next
          window.location.href = dashboardUrl
        } catch (error) {
          console.error("Callback error:", error)
          const loginUrl = process.env.NEXT_PUBLIC_SITE_URL 
            ? `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=auth_failed`
            : `/login?error=auth_failed`
          window.location.href = loginUrl
        }
      } else {
        // No code, redirect to login
        const loginUrl = process.env.NEXT_PUBLIC_SITE_URL 
          ? `${process.env.NEXT_PUBLIC_SITE_URL}/login`
          : `/login`
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


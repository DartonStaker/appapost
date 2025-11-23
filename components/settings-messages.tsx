"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2, XCircle } from "lucide-react"

export function SettingsMessages() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (success) {
      toast.success(success, {
        icon: <CheckCircle2 className="w-4 h-4" />,
      })
      // Clear URL params
      window.history.replaceState({}, "", window.location.pathname)
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        missing_code_or_state: "OAuth flow incomplete. Please try connecting again.",
        invalid_state: "Security check failed. Please try connecting again.",
        oauth_failed: "OAuth authentication failed. Please check your platform settings.",
        no_code: "No authorization code received. Please try again.",
        unauthorized: "You must be logged in to connect accounts.",
      }

      toast.error(errorMessages[error] || error, {
        icon: <XCircle className="w-4 h-4" />,
      })
      // Clear URL params
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [searchParams])

  return null
}

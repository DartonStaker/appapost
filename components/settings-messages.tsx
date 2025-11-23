"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Suspense } from "react"

function SettingsMessagesContent() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (success) {
      const platform = success.replace("_connected", "")
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} account connected successfully!`)
      // Clean URL
      window.history.replaceState({}, "", "/dashboard/settings")
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        oauth_failed: "Failed to connect account. Please try again.",
        missing_code_or_state: "OAuth callback missing required parameters.",
        invalid_state: "Invalid OAuth state. Please try again.",
      }
      toast.error(errorMessages[error] || "An error occurred")
      // Clean URL
      window.history.replaceState({}, "", "/dashboard/settings")
    }
  }, [searchParams])

  return null
}

export function SettingsMessages() {
  return (
    <Suspense fallback={null}>
      <SettingsMessagesContent />
    </Suspense>
  )
}


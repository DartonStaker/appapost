"use client"

import { useEffect, useState } from "react"

/**
 * Simple React hook to check Ollama status live
 * Works on both localhost and remote (Vercel) by trying direct check first
 * 
 * @example
 * ```tsx
 * const { isOnline } = useOllama()
 * 
 * <span className={isOnline ? "text-green-400" : "text-red-400"}>
 *   {isOnline ? "Local AI Active" : "AI Offline"}
 * </span>
 * ```
 */
export function useOllama() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkStatus() {
      // Always try direct check first (works on localhost, may work on remote if CORS allows)
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout

        const response = await fetch("http://localhost:11434/api/tags", {
          method: "GET",
          signal: controller.signal,
          // Don't set mode: "cors" - let browser handle it
          // If CORS blocks it, we'll catch the error and fall back
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          const models = data.models || []
          setIsOnline(models.length > 0)
          return // Success, exit early
        }
      } catch (error: any) {
        // CORS error or connection refused - try API route fallback
        // Don't log CORS errors as they're expected when Ollama doesn't have CORS enabled
        if (!error.message?.includes("Failed to fetch") && !error.message?.includes("CORS")) {
          console.debug("[useOllama] Direct check failed:", error.message)
        }
      }

      // Fallback: use API route (works in local dev, but won't work on Vercel for localhost)
      try {
        const response = await fetch("/api/ollama/status", {
          cache: "no-store",
        })
        const data = await response.json()
        // Only set online if API route explicitly says online (not just "clientCheck: true")
        if (data.online === true) {
          setIsOnline(true)
        } else {
          setIsOnline(false)
        }
      } catch (error) {
        setIsOnline(false)
      }
    }

    // Check immediately
    checkStatus()
    // Then check every 10 seconds
    const interval = setInterval(checkStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  return { isOnline }
}


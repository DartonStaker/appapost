"use client"

import { useEffect, useState } from "react"

/**
 * Simple React hook to check Ollama status live
 * Uses hybrid approach: tries client-side direct check first, falls back to API route
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
      // Try direct client-side check first (works when browser can reach localhost)
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 2000) // 2 second timeout

        const response = await fetch("http://localhost:11434/api/tags", {
          method: "GET",
          signal: controller.signal,
          mode: "cors", // Explicitly request CORS
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          const models = data.models || []
          setIsOnline(models.length > 0)
          return // Success, exit early
        }
      } catch (error: any) {
        // CORS or connection error - try API route as fallback
        // (This handles cases where CORS blocks direct access)
      }

      // Fallback: use API route (works in dev, but won't work on Vercel for localhost)
      try {
        const response = await fetch("/api/ollama/status", {
          cache: "no-store",
        })
        const data = await response.json()
        setIsOnline(data.online === true)
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


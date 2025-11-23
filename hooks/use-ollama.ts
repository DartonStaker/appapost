"use client"

import { useEffect, useState } from "react"

/**
 * Simple React hook to check Ollama status live
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
      try {
        const response = await fetch("/api/ollama/status")
        if (response.ok) {
          const data = await response.json()
          setIsOnline(data.online || false)
        } else {
          setIsOnline(false)
        }
      } catch {
        setIsOnline(false)
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  return { isOnline }
}


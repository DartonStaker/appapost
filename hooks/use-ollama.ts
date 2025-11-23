"use client"

import { useState, useEffect, useCallback } from "react"
import { checkOllamaStatus, generateSocialVariants, type GenerateSocialVariantsParams, type PlatformVariants } from "@/lib/ai"

export interface UseOllamaReturn {
  isOnline: boolean
  isLoading: boolean
  lastError: Error | null
  generate: (params: GenerateSocialVariantsParams) => Promise<PlatformVariants[]>
}

/**
 * React hook for Ollama AI integration
 * 
 * @example
 * ```tsx
 * const { isOnline, generate, isLoading } = useOllama()
 * 
 * const handleGenerate = async () => {
 *   if (isOnline) {
 *     const variants = await generate({
 *       title: "New Product",
 *       type: "product",
 *       platforms: ["instagram", "facebook"]
 *     })
 *   }
 * }
 * ```
 */
export function useOllama(): UseOllamaReturn {
  const [isOnline, setIsOnline] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [lastError, setLastError] = useState<Error | null>(null)

  // Check Ollama status on mount and periodically
  useEffect(() => {
    let mounted = true

    async function checkStatus() {
      try {
        const response = await fetch("/api/ollama/status")
        if (!mounted) return

        if (response.ok) {
          const data = await response.json()
          setIsOnline(data.online || false)
          setLastError(null)
        } else {
          setIsOnline(false)
        }
      } catch (error) {
        if (mounted) {
          setIsOnline(false)
          setLastError(error instanceof Error ? error : new Error(String(error)))
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    // Check immediately
    checkStatus()

    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  // Generate function that wraps the server-side function
  const generate = useCallback(async (params: GenerateSocialVariantsParams): Promise<PlatformVariants[]> => {
    setLastError(null)
    try {
      // Call the API route which uses the server-side function
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: params.title, // Temporary - API expects post_id, but we can adapt
          platforms: params.platforms,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Generation failed")
      }

      const result = await response.json()
      return result.variants || []
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setLastError(err)
      throw err
    }
  }, [])

  return {
    isOnline,
    isLoading,
    lastError,
    generate,
  }
}


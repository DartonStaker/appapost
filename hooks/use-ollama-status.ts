"use client"

import { useState, useEffect } from "react"

export interface OllamaStatus {
  online: boolean
  model?: string
  loading: boolean
}

/**
 * React hook to check Ollama connection status
 */
export function useOllamaStatus(): OllamaStatus {
  const [status, setStatus] = useState<OllamaStatus>({
    online: false,
    loading: true,
  })

  useEffect(() => {
    let mounted = true

    async function checkStatus() {
      try {
        const response = await fetch("/api/ollama/status")
        if (!mounted) return

        if (response.ok) {
          const data = await response.json()
          setStatus({
            online: data.online || false,
            model: data.model,
            loading: false,
          })
        } else {
          setStatus({ online: false, loading: false })
        }
      } catch (error) {
        if (mounted) {
          setStatus({ online: false, loading: false })
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

  return status
}


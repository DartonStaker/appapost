"use client"

import { useOllama } from "@/hooks/use-ollama"

/**
 * Live Ollama status indicator component
 * Shows green dot + "Local AI Active" when online, red dot + "AI Offline" when offline
 */
export function OllamaStatusIndicator() {
  const { isOnline } = useOllama()

  if (isOnline === null) {
    // Still loading
    return null
  }

  return (
    <span className={`ml-2 text-xs ${isOnline ? "text-green-400" : "text-red-400"}`}>
      ● {isOnline ? "Local AI Active" : "AI Offline"}
    </span>
  )
}


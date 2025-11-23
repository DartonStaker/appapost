"use client"

import { useOllamaStatus } from "@/hooks/use-ollama-status"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"

export function OllamaStatus() {
  const { online, model, loading } = useOllamaStatus()

  if (loading) {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        Checking Ollama...
      </Badge>
    )
  }

  if (online) {
    return (
      <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
        <CheckCircle2 className="w-3 h-3" />
        Ollama Online {model && `(${model})`}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1 text-orange-600 border-orange-600">
      <XCircle className="w-3 h-3" />
      Ollama Offline
    </Badge>
  )
}


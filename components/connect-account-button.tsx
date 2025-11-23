"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Platform } from "@/types"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface ConnectAccountButtonProps {
  platform: Platform
  isConnected: boolean
  accountName?: string
}

export function ConnectAccountButton({
  platform,
  isConnected,
  accountName,
}: ConnectAccountButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)

    try {
      // Redirect to OAuth flow
      window.location.href = `/api/connect/${platform}`
    } catch (error) {
      toast.error(`Failed to connect ${platform}`)
      setIsConnecting(false)
    }
  }

  return (
    <Button
      variant={isConnected ? "outline" : "default"}
      size="sm"
      onClick={handleConnect}
      disabled={isConnecting}
    >
      {isConnecting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Connecting...
        </>
      ) : isConnected ? (
        "Reconnect"
      ) : (
        "Connect"
      )}
    </Button>
  )
}


import { NextRequest, NextResponse } from "next/server"
import { checkOllamaStatus } from "@/lib/ai"

export const dynamic = "force-dynamic"

/**
 * Check Ollama connection status
 */
export async function GET(request: NextRequest) {
  try {
    const status = await checkOllamaStatus()
    // Always return 200 OK, even if offline - the status object indicates the state
    return NextResponse.json(status, { status: 200 })
  } catch (error) {
    console.error("[Ollama Status API] Error:", error)
    return NextResponse.json(
      { online: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 200 } // Return 200 so client can handle gracefully
    )
  }
}


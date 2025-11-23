import { NextRequest, NextResponse } from "next/server"
import { checkOllamaStatus } from "@/lib/ai"

export const dynamic = "force-dynamic"

/**
 * Check Ollama connection status
 * Note: On Vercel, this cannot reach localhost:11434 on the user's machine.
 * The client-side hook will handle direct checks in the browser.
 */
export async function GET(request: NextRequest) {
  // On Vercel, localhost checks won't work from server-side
  // Return a hint that client should check directly
  if (process.env.VERCEL) {
    return NextResponse.json(
      { 
        online: false, 
        error: "Server-side check unavailable on Vercel. Client will check directly.",
        clientCheck: true 
      },
      { status: 200 }
    )
  }

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


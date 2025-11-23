import { NextRequest, NextResponse } from "next/server"
import { checkOllamaStatus } from "@/lib/ai"

export const dynamic = "force-dynamic"

/**
 * Check Ollama connection status
 */
export async function GET(request: NextRequest) {
  try {
    const status = await checkOllamaStatus()
    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json(
      { online: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}


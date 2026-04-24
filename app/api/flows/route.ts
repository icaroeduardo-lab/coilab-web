import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"

export async function GET() {
  try {
    const result = await apiClient.get<{ data: unknown[] }>("/flows?limit=200")
    return NextResponse.json(result.data ?? [])
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

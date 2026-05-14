import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"

type BackendUser = { id: string; name: string; email: string; imageUrl?: string }

export async function GET() {
  try {
    const users = await apiClient.get<BackendUser[]>("/users")
    return NextResponse.json(users ?? [])
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

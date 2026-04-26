import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await apiClient.get<{ id: string; name: string; imageUrl?: string | null }>(`/users/${id}`)
    return NextResponse.json(user)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    const status = message.includes("404") ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

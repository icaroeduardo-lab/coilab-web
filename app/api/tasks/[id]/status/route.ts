import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"
import { normalizeTask } from "@/lib/task-normalizer"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { status } = await request.json()
    if (!status) return NextResponse.json({ error: "status required" }, { status: 400 })
    await apiClient.patch(`/tasks/${id}/status`, { status })
    const updated = await apiClient.get<unknown>(`/tasks/${id}`)
    return NextResponse.json(normalizeTask(updated))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

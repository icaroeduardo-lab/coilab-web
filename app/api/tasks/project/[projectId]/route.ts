import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"
import { normalizeTask } from "@/lib/task-normalizer"

export async function GET(_: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params
    const res = await apiClient.get<unknown>(`/tasks/project/${projectId}`)
    const list = Array.isArray(res) ? res : ((res as any).data ?? [])
    return NextResponse.json(list.map(normalizeTask))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

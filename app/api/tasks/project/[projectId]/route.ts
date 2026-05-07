import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"
import { normalizeTask } from "@/lib/task-normalizer"

export async function GET(_: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params
    const res = await apiClient.get<unknown[] | { data: unknown[] }>(`/tasks/project/${projectId}?limit=200`)
    const tasks = Array.isArray(res) ? res : ((res as { data: unknown[] }).data ?? [])
    return NextResponse.json(tasks.map(normalizeTask))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

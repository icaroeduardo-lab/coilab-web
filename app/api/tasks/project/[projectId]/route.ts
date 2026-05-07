import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"
import { normalizeTask } from "@/lib/task-normalizer"

export async function GET(_: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params
    const res = await apiClient.get<{ data: unknown[] }>(`/tasks/project/${projectId}?limit=200`)
    return NextResponse.json((res.data ?? []).map(normalizeTask))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"
import { normalizeSubTask } from "@/lib/task-normalizer"

const ACTION_MAP: Record<string, string> = {
  start: "start",
  complete: "complete",
  reopen: "cancel",  // no reopen in backend — cancel current round
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; phaseId: string }> },
) {
  try {
    const { id: taskId, phaseId } = await params
    const { action, notes, checklist } = await request.json()

    const backendAction = ACTION_MAP[action] ?? action

    const result = await apiClient.patch<{
      subTask: unknown
      task: { status: string }
    }>(`/tasks/${taskId}/subtasks/${phaseId}/status`, {
      action: backendAction,
      ...(notes !== undefined && { reason: notes }),
    })

    const phase = normalizeSubTask(result.subTask ?? { id: phaseId, type: "unknown", status: "Não iniciado" })

    // Preserve checklist from request since backend doesn't store it
    if (checklist !== undefined) {
      phase.checklist = checklist
    }

    return NextResponse.json({
      phase,
      taskStatus: result.task?.status,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

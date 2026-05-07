import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"
import { normalizeSubTask } from "@/lib/task-normalizer"

const ACTION_MAP: Record<string, string> = {
  start: "start",
  complete: "complete",
  reopen: "cancel",
  approve: "approve",
  reject: "reject",
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; phaseId: string }> },
) {
  try {
    const { id: taskId, phaseId } = await params
    const { action, notes, checklist } = await request.json()

    const backendAction = ACTION_MAP[action] ?? action

    await apiClient.patch(`/tasks/${taskId}/subtasks/${phaseId}/status`, {
      action: backendAction,
      ...(notes !== undefined && { reason: notes }),
    })

    const task = await apiClient.get<{ subTasks: unknown[]; status: string }>(`/tasks/${taskId}`)
    const subTaskData = (task.subTasks ?? []).find((s: any) => s.id === phaseId)
    const phase = normalizeSubTask(
      subTaskData ?? { id: phaseId, type: "unknown", status: "Não iniciado" },
    )

    if (checklist !== undefined) {
      phase.checklist = checklist
    }

    return NextResponse.json({
      phase,
      taskStatus: task.status,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"

type Approval = {
  id: string
  taskId: string
  phaseId: string
  status: "approved" | "rejected"
  comment: string
  approvedBy: string
  approvedByImage?: string | null
  createdAt: string
}

function synthesize(taskId: string, subtask: any): Approval | null {
  if (subtask.status === "Aprovado") {
    return {
      id: subtask.id,
      taskId,
      phaseId: subtask.id,
      status: "approved",
      comment: "",
      approvedBy: "—",
      createdAt: subtask.completionDate ?? new Date().toISOString(),
    }
  }
  if (subtask.status === "Reprovado") {
    return {
      id: subtask.id,
      taskId,
      phaseId: subtask.id,
      status: "rejected",
      comment: subtask.reason ?? "",
      approvedBy: "—",
      createdAt: subtask.completionDate ?? new Date().toISOString(),
    }
  }
  return null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")
    const phaseId = searchParams.get("phaseId")

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 })
    }

    const task = await apiClient.get<{ subTasks: any[] }>(`/tasks/${taskId}`)
    const subTasks: any[] = task.subTasks ?? []

    if (phaseId) {
      const st = subTasks.find((s) => s.id === phaseId)
      if (!st) return NextResponse.json([])
      const record = synthesize(taskId, st)
      return NextResponse.json(record ? [record] : [])
    }

    const records = subTasks.flatMap((st) => {
      const r = synthesize(taskId, st)
      return r ? [r] : []
    })
    return NextResponse.json(records)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { taskId, phaseId, status, comment, approvedBy, approvedByImage } = await request.json()

    if (!taskId || !phaseId || !status) {
      return NextResponse.json(
        { error: "taskId, phaseId and status are required" },
        { status: 400 },
      )
    }

    if (status === "rejected" && !comment?.trim()) {
      return NextResponse.json(
        { error: "Justificativa é obrigatória ao reprovar" },
        { status: 400 },
      )
    }

    const action = status === "approved" ? "approve" : "reject"

    await apiClient.patch(`/tasks/${taskId}/subtasks/${phaseId}/status`, {
      action,
      ...(comment?.trim() && { reason: comment.trim() }),
    })

    const approval: Approval = {
      id: phaseId,
      taskId,
      phaseId,
      status,
      comment: comment?.trim() ?? "",
      approvedBy: approvedBy ?? "—",
      approvedByImage: approvedByImage ?? null,
      createdAt: new Date().toISOString(),
    }
    return NextResponse.json(approval)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    const status = message.includes("422") || message.includes("precisa estar") ? 422 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

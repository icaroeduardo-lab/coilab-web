import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 })
    }

    const task = await apiClient.get<{ subTasks: any[] }>(`/tasks/${taskId}`)
    const designSubTask = (task.subTasks ?? []).find((s: any) => s.type === "Design")
    const designs = (designSubTask?.designs ?? []).map((d: any) => ({
      id: d.id,
      url: d.urlImage,
      title: d.title,
      description: d.description,
    }))

    return NextResponse.json(designs)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Upload already registers design with backend — this endpoint is kept for compatibility
export async function POST(request: Request) {
  try {
    const { taskId, phaseId, designId } = await request.json()

    if (designId && taskId && phaseId) {
      await apiClient.delete(`/tasks/${taskId}/subtasks/${phaseId}/designs/${designId}`)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

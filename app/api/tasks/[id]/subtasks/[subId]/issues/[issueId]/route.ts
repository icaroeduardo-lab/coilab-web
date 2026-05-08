import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"

type Params = { params: Promise<{ id: string; subId: string; issueId: string }> }

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id, subId, issueId } = await params
    const body = await request.json()
    await apiClient.patch(`/tasks/${id}/subtasks/${subId}/issues/${issueId}`, body)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"

type Params = { params: Promise<{ id: string; subId: string }> }

export async function GET(_: Request, { params }: Params) {
  try {
    const { id, subId } = await params
    const data = await apiClient.get<unknown>(`/tasks/${id}/subtasks/${subId}/issues`)
    return NextResponse.json(Array.isArray(data) ? data : [])
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id, subId } = await params
    const body = await request.json()
    const data = await apiClient.post(`/tasks/${id}/subtasks/${subId}/issues`, body)
    return NextResponse.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

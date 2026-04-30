import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const taskId = formData.get("taskId") as string
    const subTaskId = formData.get("subTaskId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!taskId || !subTaskId) {
      return NextResponse.json({ error: "taskId and subTaskId are required" }, { status: 400 })
    }

    const { uploadUrl, fileUrl } = await apiClient.get<{ uploadUrl: string; fileUrl: string; key: string }>(
      `/tasks/${taskId}/subtasks/${subTaskId}/designs/upload-url?filename=${encodeURIComponent(file.name)}`,
    )

    const bytes = await file.arrayBuffer()
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: bytes,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    })

    if (!uploadRes.ok) {
      throw new Error(`S3 upload failed: ${uploadRes.status}`)
    }

    const { id } = await apiClient.post<{ id: string }>(
      `/tasks/${taskId}/subtasks/${subTaskId}/designs`,
      { title, description, urlImage: fileUrl },
    )

    return NextResponse.json(
      { success: true, id, url: fileUrl, title, description },
      { status: 201 },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

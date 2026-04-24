import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get("filename") ?? "document.md"
    const result = await apiClient.get<{ uploadUrl: string; fileUrl: string }>(
      `/projects/${id}/documents/upload-url?filename=${encodeURIComponent(filename)}`,
    )
    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

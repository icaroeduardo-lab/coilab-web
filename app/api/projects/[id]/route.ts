import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"

type BackendProject = Record<string, unknown> & { urlDocument?: string }

function normalize(p: BackendProject) {
  const { urlDocument, ...rest } = p
  return { ...rest, documentPath: urlDocument }
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const project = await apiClient.get<BackendProject>(`/projects/${id}`)
    return NextResponse.json(normalize(project))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    const status = message.includes("404") ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { documentPath, ...rest } = body
    const payload = {
      ...rest,
      ...(documentPath !== undefined && { urlDocument: documentPath }),
    }
    const project = await apiClient.patch<BackendProject>(`/projects/${id}`, payload)
    return NextResponse.json(normalize(project ?? {}))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

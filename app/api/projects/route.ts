import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"

type BackendProject = Record<string, unknown> & { urlDocument?: string }

function normalize(p: BackendProject) {
  const { urlDocument, ...rest } = p
  return { ...rest, documentPath: urlDocument }
}

export async function GET() {
  try {
    const result = await apiClient.get<{ data: BackendProject[] }>("/projects?limit=200")
    return NextResponse.json((result.data ?? []).map(normalize))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, documentPath } = await request.json()
    const project = await apiClient.post<BackendProject>("/projects", {
      name,
      description,
      ...(documentPath && { urlDocument: documentPath }),
    })
    return NextResponse.json(normalize(project), { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

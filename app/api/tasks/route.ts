import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"
import { normalizeTask, phaseIdToSubTaskType, denormalizePriority } from "@/lib/task-normalizer"

async function resolveProjectId(name: string): Promise<string | null> {
  const res = await apiClient.get<{ data: { id: string; name: string }[] }>("/projects?limit=200")
  const match = (res.data ?? []).find(
    (p) => p.name.toLowerCase() === name.toLowerCase(),
  )
  return match?.id ?? null
}

async function resolveApplicantId(name: string): Promise<string | null> {
  const res = await apiClient.get<{ data: { id: string; name: string }[] }>("/applicants?limit=200")
  const match = (res.data ?? []).find(
    (a) => a.name.toLowerCase() === name.toLowerCase(),
  )
  return match?.id ?? null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectName = searchParams.get("project")

    if (projectName) {
      const projectId = await resolveProjectId(projectName)
      if (!projectId) return NextResponse.json([])
      const res = await apiClient.get<{ data: unknown[] }>(`/tasks/project/${projectId}?limit=200`)
      return NextResponse.json((res.data ?? []).map(normalizeTask))
    }

    const res = await apiClient.get<{ data: unknown[] }>("/tasks?limit=200")
    return NextResponse.json((res.data ?? []).map(normalizeTask))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, project, applicant, priority, description, phases = [], flows = [], phaseDueDates = {} } = body

    const [projectId, applicantId] = await Promise.all([
      resolveProjectId(project),
      resolveApplicantId(applicant),
    ])

    if (!projectId) return NextResponse.json({ error: `Projeto "${project}" não encontrado` }, { status: 422 })
    if (!applicantId) return NextResponse.json({ error: `Solicitante "${applicant}" não encontrado` }, { status: 422 })

    const subTasks = (phases as string[])
      .map((phaseId) => {
        const type = phaseIdToSubTaskType(phaseId)
        if (!type) return null
        return { type, expectedDelivery: phaseDueDates[phaseId] ?? new Date().toISOString() }
      })
      .filter(Boolean)

    const task = await apiClient.post<unknown>("/tasks", {
      name,
      description,
      projectId,
      applicantId,
      priority: denormalizePriority(priority),
      flowIds: flows,
      subTasks,
    })

    return NextResponse.json(normalizeTask(task), { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

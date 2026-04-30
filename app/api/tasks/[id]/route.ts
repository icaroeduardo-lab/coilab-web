import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"
import { normalizeTask, denormalizePriority, phaseIdToSubTaskType } from "@/lib/task-normalizer"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDiscoveryToBackend(d: any): Record<string, string | undefined> {
  return {
    projectName: d.projectName || undefined,
    complexity: d.complexity || undefined,
    summary: d.summary || undefined,
    painPoints: d.painPoints || undefined,
    frequency: d.frequency || undefined,
    currentProcess: d.currentProcess || undefined,
    inactionCost: d.inactionCost || undefined,
    volume: d.volume || undefined,
    avgTime: d.avgTime || undefined,
    humanDependency: d.humanDependency || undefined,
    rework: d.rework || undefined,
    previousAttempts: d.previousAttempts || undefined,
    benchmark: d.benchmark || undefined,
    institutionalPriority: d.institutionalPriority || undefined,
    technicalOpinion: d.technicalOpinion || undefined,
  }
}

async function resolveProjectId(name: string): Promise<string | null> {
  const res = await apiClient.get<{ data: { id: string; name: string }[] }>("/projects?limit=200")
  return (res.data ?? []).find((p) => p.name.toLowerCase() === name.toLowerCase())?.id ?? null
}

async function resolveApplicantId(name: string): Promise<string | null> {
  const res = await apiClient.get<{ data: { id: string; name: string }[] }>("/applicants?limit=200")
  return (res.data ?? []).find((a) => a.name.toLowerCase() === name.toLowerCase())?.id ?? null
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const task = await apiClient.get<unknown>(`/tasks/${id}`)
    return NextResponse.json(normalizeTask(task))
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
    const { phases, partialPhaseUpdate, status, name, description, project, applicant, priority } = body

    // discovery form save
    if (partialPhaseUpdate && Array.isArray(phases) && phases.length > 0) {
      const phase = phases[0]
      if (phase?.discoveryData && phase.id) {
        const dto = mapDiscoveryToBackend(phase.discoveryData)
        await apiClient.patch(`/tasks/${id}/subtasks/${phase.id}/discovery`, dto)
      }
      return NextResponse.json({ success: true })
    }

    // phases array → add new subtasks / remove disabled ones
    if (phases && !name && !description && !project && !applicant && !priority && !status) {
      const current = await apiClient.get<{ subTasks: { id: string; type: string; status: string }[] }>(`/tasks/${id}`)
      const currentTypes = new Set(
        (current.subTasks ?? [])
          .filter((s) => s.status !== "Reprovado" && s.status !== "Cancelado")
          .map((s) => s.type.toLowerCase())
      )

      const removedPhases = (phases as { id: string; enabled: boolean }[]).filter((p) => !p.enabled)
      if (removedPhases.length > 0) {
        await apiClient.patch(`/tasks/${id}`, { subTaskIdsToRemove: removedPhases.map((p) => p.id) })
      }

      const newPhases = (phases as { id: string; type?: string; name?: string; enabled: boolean; dueDate?: string }[])
        .filter((p) => p.enabled)
        .filter((p) => !currentTypes.has((phaseIdToSubTaskType(p.type ?? p.id ?? "") ?? "").toLowerCase()))

      for (const phase of newPhases) {
        const type = phaseIdToSubTaskType(phase.type ?? phase.id ?? "")
        if (!type) continue
        await apiClient.post(`/tasks/${id}/subtasks`, {
          type,
          expectedDelivery: phase.dueDate ?? new Date().toISOString(),
        })
      }

      const updated = await apiClient.get<unknown>(`/tasks/${id}`)
      return NextResponse.json(normalizeTask(updated))
    }

    // status-only update
    if (status && !name && !description && !project && !applicant && !priority) {
      await apiClient.patch(`/tasks/${id}/status`, { status })
      const updated = await apiClient.get<unknown>(`/tasks/${id}`)
      return NextResponse.json(normalizeTask(updated))
    }

    // basic field update
    const payload: Record<string, unknown> = {}
    if (name !== undefined) payload.name = name
    if (description !== undefined) payload.description = description
    if (priority !== undefined) payload.priority = denormalizePriority(priority)
    if (project !== undefined) {
      const pid = await resolveProjectId(project)
      if (pid) payload.projectId = pid
    }
    if (applicant !== undefined) {
      const aid = await resolveApplicantId(applicant)
      if (aid) payload.applicantId = aid
    }

    if (Object.keys(payload).length > 0) {
      await apiClient.patch(`/tasks/${id}`, payload)
    }

    const updated = await apiClient.get<unknown>(`/tasks/${id}`)
    return NextResponse.json(normalizeTask(updated))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await apiClient.delete(`/tasks/${id}`)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

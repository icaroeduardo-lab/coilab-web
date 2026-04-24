export type PhaseStatus = "not_started" | "in_progress" | "completed" | "approved" | "rejected"

const SUBTASK_STATUS_MAP: Record<string, PhaseStatus> = {
  "Não iniciado": "not_started",
  "Em progresso": "in_progress",
  "Aguardando Checkout": "completed",
  "Aprovado": "approved",
  "Reprovado": "rejected",
  "Cancelado": "rejected",
}

const TYPE_ORDER: Record<string, number> = {
  Discovery: 1,
  Design: 2,
  Diagram: 3,
}

const PHASE_ID_MAP: Record<string, string> = {
  discovery: "Discovery",
  design: "Design",
  diagram: "Diagram",
}

export function subTaskStatusToPhaseStatus(status: string): PhaseStatus {
  return SUBTASK_STATUS_MAP[status] ?? "not_started"
}

export function phaseIdToSubTaskType(id: string): string | null {
  const key = id.toLowerCase()
  return PHASE_ID_MAP[key] ?? null
}

export function normalizePriority(priority: string): string {
  const map: Record<string, string> = { baixa: "Baixa", média: "Média", alta: "Alta", media: "Média" }
  return map[priority.toLowerCase()] ?? priority
}

export function denormalizePriority(priority: string): string {
  return priority.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") === "media"
    ? "média"
    : priority.toLowerCase()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSubTask(st: any) {
  return {
    id: st.id,
    type: st.type.toLowerCase() as string,
    name: st.type as string,
    order: TYPE_ORDER[st.type] ?? 99,
    enabled: true,
    status: subTaskStatusToPhaseStatus(st.status),
    dueDate: st.expectedDelivery ?? undefined,
    startedAt: st.startDate ?? undefined,
    completedAt: st.completionDate ?? undefined,
    notes: "",
    checklist: [] as { id: string; label: string; completed: boolean }[],
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeTask(task: any) {
  const subTasks: unknown[] = task.subTasks ?? []
  const phases = subTasks.map(normalizeSubTask)
  const hasRejection = subTasks.some((st: any) => st.status === "Reprovado")

  return {
    id: task.id,
    taskNumber: task.taskNumber,
    name: task.name,
    description: task.description,
    project: task.project?.name ?? task.project ?? "",
    projectId: task.project?.id ?? undefined,
    applicant: task.applicant?.name ?? task.applicant ?? "",
    applicantId: task.applicant?.id ?? undefined,
    priority: normalizePriority(task.priority ?? ""),
    status: task.status,
    createdAt: task.createdAt,
    flows: task.flows ?? [],
    phases,
    hasRejection,
  }
}

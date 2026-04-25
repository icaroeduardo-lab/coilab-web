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

const LEVEL_REVERSE: Record<string, string> = { Alta: "alta", Média: "media", Baixa: "baixa" }
const FREQ_REVERSE: Record<string, string> = {
  Diária: "diario", Semanal: "semanal", Mensal: "mensal", Eventual: "eventual",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBackendDiscovery(form: any) {
  if (!form) return undefined
  return {
    projectName: form.projectName ?? "",
    sector: "",
    complexity: form.complexity === "Alta" ? "complex" : "small",
    flow: "interno",
    problemSummary: form.summary ?? "",
    userPains: form.painPoints ?? "",
    frequency: (FREQ_REVERSE[form.frequency] ?? "eventual") as "diario" | "semanal" | "mensal" | "eventual",
    currentProcess: form.currentProcess ?? "",
    inactionCost: form.inactionCost ?? "",
    volume: form.volume ?? "",
    averageTime: form.avgTime ?? "",
    humanDependency: (LEVEL_REVERSE[form.humanDependency] ?? "media") as "alta" | "media" | "baixa",
    reworkRate: form.rework !== "N/A" ? (form.rework ?? "") : "",
    previousAttempts: form.previousAttempts !== "N/A" ? (form.previousAttempts ?? "") : "",
    benchmark: form.benchmark !== "N/A" ? (form.benchmark ?? "") : "",
    institutionalPriority: (LEVEL_REVERSE[form.institutionalPriority] ?? "media") as "alta" | "media" | "baixa",
    aiPotential: "medio" as "alto" | "medio" | "baixo",
    technicalOpinion: form.technicalOpinion ?? "",
  }
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
    reason: st.reason ?? undefined,
    notes: "",
    checklist: [] as { id: string; label: string; completed: boolean }[],
    designs: (st.designs ?? []) as { id: string; url: string; title: string; description: string }[],
    discoveryData: mapBackendDiscovery(st.discoveryForm),
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

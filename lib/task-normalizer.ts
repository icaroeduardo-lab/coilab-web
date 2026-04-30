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

export type DiscoveryFieldMeta = { userId: string; filledAt: string }
export type DiscoveryMeta = Record<string, DiscoveryFieldMeta | null>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function val(field: any): string {
  if (!field) return ""
  return typeof field === "object" ? (field.value ?? "") : field
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function meta(field: any): DiscoveryFieldMeta | null {
  if (!field || typeof field !== "object" || !field.userId) return null
  return { userId: field.userId, filledAt: field.filledAt ?? "" }
}

const DISCOVERY_FIELDS = [
  "projectName","complexity","summary","painPoints","frequency",
  "currentProcess","inactionCost","volume","avgTime","humanDependency",
  "rework","previousAttempts","benchmark","institutionalPriority","technicalOpinion",
] as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBackendDiscovery(form: any): { data: ReturnType<typeof buildDiscoveryData>; meta: DiscoveryMeta } | null {
  if (!form) return null
  const m: DiscoveryMeta = {}
  for (const key of DISCOVERY_FIELDS) m[key] = meta(form[key])
  return { data: buildDiscoveryData(form), meta: m }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDiscoveryData(form: any) {
  return {
    projectName: val(form.projectName),
    complexity: (val(form.complexity) || "Baixa") as "Alta" | "Baixa",
    summary: val(form.summary),
    painPoints: val(form.painPoints),
    frequency: (val(form.frequency) || "Eventual") as "Diária" | "Semanal" | "Mensal" | "Eventual",
    currentProcess: val(form.currentProcess),
    inactionCost: val(form.inactionCost),
    volume: val(form.volume),
    avgTime: val(form.avgTime),
    humanDependency: (val(form.humanDependency) || "Média") as "Alta" | "Média" | "Baixa",
    rework: val(form.rework),
    previousAttempts: val(form.previousAttempts),
    benchmark: val(form.benchmark),
    institutionalPriority: (val(form.institutionalPriority) || "Média") as "Alta" | "Média" | "Baixa",
    technicalOpinion: val(form.technicalOpinion),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeSubTask(st: any) {
  const discovery = mapBackendDiscovery(st.discoveryForm)
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
    designs: (st.designs ?? []).map((d: any) => ({ ...d, url: d.url ?? d.urlImage ?? "" })),
    discoveryData: discovery?.data,
    discoveryMeta: discovery?.meta,
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

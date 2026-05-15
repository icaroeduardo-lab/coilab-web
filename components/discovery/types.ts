import { z } from "zod"

export type Frequency  = "Diária" | "Semanal" | "Mensal" | "Eventual"
export type Complexity = "Baixa" | "Alta"
export type Level      = "Alta" | "Média" | "Baixa"

export type DiscoveryData = {
  projectName: string
  complexity: Complexity
  summary: string
  painPoints: string
  frequency: Frequency
  currentProcess: string
  inactionCost: string
  volume: string
  avgTime: string
  humanDependency: Level
  rework?: string
  previousAttempts?: string
  benchmark?: string
  institutionalPriority: Level
  technicalOpinion: string
}

// ── Raw backend format ──────────────────────────────────────────────────────

export type FieldMeta = {
  value: string
  userId: string
  filledAt: string
}

export type DiscoveryFormPayload = {
  form: Partial<Record<keyof DiscoveryData, FieldMeta>>
}

// ── Normalizers (backend enum → display enum) ───────────────────────────────

function normalizeComplexity(v: string): Complexity {
  return (v === "complex" || v.toLowerCase() === "alta") ? "Alta" : "Baixa"
}

function normalizeLevel(v: string): Level {
  const l = v.toLowerCase()
  if (l === "alta" || l === "high")                       return "Alta"
  if (l === "media" || l === "média" || l === "medium")   return "Média"
  return "Baixa"
}

function normalizeFrequency(v: string): Frequency {
  const l = v.toLowerCase()
  if (l === "diario"  || l === "diária"  || l === "daily")   return "Diária"
  if (l === "semanal" || l === "weekly")                      return "Semanal"
  if (l === "mensal"  || l === "monthly")                     return "Mensal"
  return "Eventual"
}

export function normalizeDiscoveryForm(payload: DiscoveryFormPayload): DiscoveryData {
  const f = payload.form
  return {
    projectName:           f.projectName?.value           ?? "",
    complexity:            normalizeComplexity(f.complexity?.value    ?? ""),
    summary:               f.summary?.value               ?? "",
    painPoints:            f.painPoints?.value            ?? "",
    frequency:             normalizeFrequency(f.frequency?.value      ?? ""),
    currentProcess:        f.currentProcess?.value        ?? "",
    inactionCost:          f.inactionCost?.value          ?? "",
    volume:                f.volume?.value                ?? "",
    avgTime:               f.avgTime?.value               ?? "",
    humanDependency:       normalizeLevel(f.humanDependency?.value    ?? ""),
    rework:                f.rework?.value,
    previousAttempts:      f.previousAttempts?.value,
    benchmark:             f.benchmark?.value,
    institutionalPriority: normalizeLevel(f.institutionalPriority?.value ?? ""),
    technicalOpinion:      f.technicalOpinion?.value      ?? "",
  }
}

// ── Zod validation ──────────────────────────────────────────────────────────

const base = z.object({
  projectName:           z.string().min(1),
  complexity:            z.enum(["Baixa", "Alta"]),
  summary:               z.string().min(1),
  painPoints:            z.string().min(1),
  frequency:             z.enum(["Diária", "Semanal", "Mensal", "Eventual"]),
  currentProcess:        z.string().min(1),
  inactionCost:          z.string().min(1),
  volume:                z.string().min(1),
  avgTime:               z.string().min(1),
  humanDependency:       z.enum(["Alta", "Média", "Baixa"]),
  rework:                z.string().optional(),
  previousAttempts:      z.string().optional(),
  benchmark:             z.string().optional(),
  institutionalPriority: z.enum(["Alta", "Média", "Baixa"]),
  technicalOpinion:      z.string().min(1),
})

export const discoverySchema = base.superRefine((d, ctx) => {
  if (d.complexity !== "Alta") return
  const required: Array<keyof typeof d> = ["rework", "previousAttempts", "benchmark"]
  for (const key of required) {
    if (!d[key]?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${key} é obrigatório para complexidade Alta`,
      })
    }
  }
})

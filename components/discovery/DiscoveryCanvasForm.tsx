"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import useSWR from "swr"
import { toast } from "sonner"
import {
  Loader2, CheckCircle2, Save, Calendar, PlayCircle, XCircle,
  FileText, Flag, Frown, Workflow, DollarSign, Gauge,
  RotateCcw, History, Compass, Wand2, Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { CanvasCard } from "@/components/canvas/primitives/CanvasCard"
import { NumberedSteps } from "./primitives/NumberedSteps"

// ── Types ─────────────────────────────────────────────────────────────────────

type FieldAuthorMeta = { userId: string; filledAt: string }
type DiscoveryMeta   = Record<string, FieldAuthorMeta | null>

type Phase = {
  id: string
  name: string
  order: number
  enabled: boolean
  status: "not_started" | "in_progress" | "completed" | "approved" | "rejected" | "cancelled"
  dueDate?: string
  startedAt?: string
  completedAt?: string
  notes?: string
  checklist: { id: string; label: string; completed: boolean }[]
  discoveryData?: DiscoveryFormValues
}

type Task = {
  id: string
  name: string
  project: string
  applicant: string
  priority: string
  status: string
  createdAt: string
  description?: string
  phases?: Phase[]
  flows?: { id: string; name: string }[]
}

export type DiscoveryFormValues = {
  projectName: string
  complexity: "Alta" | "Baixa"
  summary: string
  painPoints: string
  frequency: "Diária" | "Semanal" | "Mensal" | "Eventual"
  currentProcess: string
  inactionCost: string
  volume: string
  avgTime: string
  humanDependency: "Alta" | "Média" | "Baixa"
  rework: string
  previousAttempts: string
  benchmark: string
  institutionalPriority: "Alta" | "Média" | "Baixa"
  technicalOpinion: string
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const baseSchema = z.object({
  projectName:           z.string().min(1, "Nome do projeto é obrigatório"),
  complexity:            z.enum(["Alta", "Baixa"]),
  summary:               z.string().min(1, "Resumo do problema é obrigatório"),
  painPoints:            z.string().min(1, "Dores do usuário são obrigatórias"),
  frequency:             z.enum(["Diária", "Semanal", "Mensal", "Eventual"]),
  currentProcess:        z.string().min(1, "Passo a passo atual é obrigatório"),
  inactionCost:          z.string().min(1, "Custo da inação é obrigatório"),
  volume:                z.string().min(1, "Volume é obrigatório"),
  avgTime:               z.string().min(1, "Tempo médio é obrigatório"),
  humanDependency:       z.enum(["Alta", "Média", "Baixa"]),
  rework:                z.string().optional(),
  previousAttempts:      z.string().optional(),
  benchmark:             z.string().optional(),
  institutionalPriority: z.enum(["Alta", "Média", "Baixa"]),
  technicalOpinion:      z.string().min(1, "Parecer técnico é obrigatório"),
})

const complexSchema = baseSchema.extend({
  rework:           z.string().min(1, "Retrabalho/Erro é obrigatório"),
  previousAttempts: z.string().min(1, "Tentativas anteriores é obrigatório"),
  benchmark:        z.string().min(1, "Benchmark é obrigatório"),
})

// ── Shared constants ──────────────────────────────────────────────────────────

const PRIMARY      = "#1E3A5F"
const PRIMARY_SOFT = "#EEF2F7"

const fetcher = (url: string) => fetch(url).then(r => r.json())

// ── FieldAuthor ───────────────────────────────────────────────────────────────

function getInitials(name: string) {
  if (!name || name === "—") return "?"
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

function fmtDateTime(iso: string) {
  if (!iso) return ""
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function fmtDate(iso?: string) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"
}

function FieldAuthor({ fieldMeta }: { fieldMeta: FieldAuthorMeta | null | undefined }) {
  const { data: session } = useSession()
  const isMe = !!fieldMeta && session?.user?.id === fieldMeta.userId
  const { data: backendUser } = useSWR<{ name: string; imageUrl?: string | null }>(
    fieldMeta && !isMe ? `/api/users/${fieldMeta.userId}` : null,
    fetcher
  )
  if (!fieldMeta) return null
  const name  = isMe ? (session?.user?.name ?? "—") : (backendUser?.name ?? "...")
  const image = isMe ? (session?.user?.image ?? null) : (backendUser?.imageUrl ?? null)
  return (
    <div className="flex items-center gap-1 mt-1.5">
      <div className="relative group/fa">
        <Avatar size="sm" className="h-4 w-4 cursor-default">
          {image && <AvatarImage src={image} alt={name} />}
          <AvatarFallback className="text-[7px]">{getInitials(name)}</AvatarFallback>
        </Avatar>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-popover text-popover-foreground border text-xs rounded shadow-md whitespace-nowrap opacity-0 group-hover/fa:opacity-100 pointer-events-none transition-opacity z-50">
          {name}
        </div>
      </div>
      <span className="text-[11px] text-muted-foreground">{name} · {fmtDateTime(fieldMeta.filledAt)}</span>
    </div>
  )
}

// ── Textarea / Input primitives ───────────────────────────────────────────────

const textareaClass =
  "w-full text-[13.5px] leading-relaxed text-slate-900 bg-transparent border border-slate-200 rounded-md p-2 resize-none outline-none focus:border-[var(--canvas-primary)] placeholder:text-slate-400 disabled:opacity-60"
const inputClass =
  "w-full text-[13.5px] text-slate-900 bg-transparent border-b border-slate-200 focus:border-[var(--canvas-primary)] outline-none pb-0.5 placeholder:text-slate-300 placeholder:font-normal disabled:opacity-60"

// ── EnumPillSelector ──────────────────────────────────────────────────────────

function PillSelector<T extends string>({
  value,
  options,
  onSelect,
  getActiveClass,
}: {
  value: T
  options: { value: T; label: string }[]
  onSelect: (v: T) => void
  getActiveClass: (v: T) => string
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(({ value: v, label }) => (
        <button
          key={v}
          type="button"
          onClick={() => onSelect(v)}
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-all
            ${v === value
              ? getActiveClass(v)
              : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
            }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── DiscoveryCanvasForm ───────────────────────────────────────────────────────

interface Props {
  phase: Phase
  taskId: string
  initialData?: DiscoveryFormValues
  taskData?: Task
  discoveryMeta?: DiscoveryMeta
  readOnly?: boolean
  onSaved: (completed?: boolean) => void
}

export function DiscoveryCanvasForm({
  phase,
  taskId,
  initialData,
  taskData: externalTaskData,
  discoveryMeta,
  readOnly = false,
  onSaved,
}: Props) {
  const [isSaving,     setIsSaving]     = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [isCancelling, setIsCancelling] = useState(false)
  const [localMeta,    setLocalMeta]    = useState<DiscoveryMeta>(() => discoveryMeta || {})
  const { data: session } = useSession()
  const { data: fetchedTaskData, mutate } = useSWR<Task>(`/api/tasks/${taskId}`, fetcher)
  const taskData = externalTaskData || fetchedTaskData

  useEffect(() => {
    document.documentElement.style.setProperty("--canvas-primary",      PRIMARY)
    document.documentElement.style.setProperty("--canvas-primary-soft", PRIMARY_SOFT)
    return () => {
      document.documentElement.style.removeProperty("--canvas-primary")
      document.documentElement.style.removeProperty("--canvas-primary-soft")
    }
  }, [])

  const markField = (fieldName: string, value: unknown) => {
    if (!value || (typeof value === "string" && !value.trim())) return
    const userId = session?.user?.id
    if (!userId) return
    setLocalMeta(prev => ({ ...prev, [fieldName]: { userId, filledAt: new Date().toISOString() } }))
  }

  const schema = (initialData?.complexity === "Alta" || undefined) ? complexSchema : baseSchema

  const {
    register,
    handleSubmit,
    watch,
    control,
    getValues,
    formState: { errors },
  } = useForm<z.infer<typeof baseSchema>>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      ...(initialData || {
        complexity:            "Baixa" as const,
        humanDependency:       "Média" as const,
        frequency:             "Eventual" as const,
        institutionalPriority: "Média" as const,
      }),
      projectName: taskData?.name || initialData?.projectName || "",
    },
  })

  const complexity = watch("complexity")

  const buildData = (data: any): DiscoveryFormValues => ({
    projectName:           data.projectName           || "",
    complexity:            data.complexity            || "Baixa",
    summary:               data.summary               || "",
    painPoints:            data.painPoints            || "",
    frequency:             data.frequency             || "Eventual",
    currentProcess:        data.currentProcess        || "",
    inactionCost:          data.inactionCost          || "",
    volume:                data.volume                || "",
    avgTime:               data.avgTime               || "",
    humanDependency:       data.humanDependency        || "Média",
    rework:                data.rework                || "",
    previousAttempts:      data.previousAttempts       || "",
    benchmark:             data.benchmark              || "",
    institutionalPriority: data.institutionalPriority  || "Média",
    technicalOpinion:      data.technicalOpinion       || "",
  })

  const saveDiscoveryData = async (discoveryData: DiscoveryFormValues) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phases: [{ id: phase.id, discoveryData }], partialPhaseUpdate: true }),
    })
    if (!res.ok) throw new Error("Erro ao salvar dados do Discovery")
  }

  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      await saveDiscoveryData(buildData(getValues()))
      mutate()
      onSaved(false)
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar rascunho")
    } finally {
      setIsSaving(false)
    }
  }

  const handleFinalize = async (data: any) => {
    setIsCompleting(true)
    try {
      await saveDiscoveryData(buildData(data))
      const res = await fetch(`/api/tasks/${taskId}/phases/${phase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || body.error || "Erro ao finalizar Discovery")
      }
      mutate()
      onSaved(true)
    } catch (e: any) {
      toast.error(e.message || "Erro ao finalizar Discovery")
    } finally {
      setIsCompleting(false)
    }
  }

  const handleCancelPhase = async () => {
    if (!cancelReason.trim()) return
    setIsCancelling(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/phases/${phase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reopen", notes: cancelReason.trim() }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Erro ao cancelar fase")
      }
      setIsCancelOpen(false)
      setCancelReason("")
      mutate()
      onSaved()
    } catch (e: any) {
      toast.error(e.message || "Erro ao cancelar fase")
    } finally {
      setIsCancelling(false)
    }
  }

  const busy = isSaving || isCompleting || isCancelling

  return (
    <div className="space-y-3">
      {/* ── Action bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-lg bg-muted/40 border">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Entrega:</span>
            <span className="font-medium">{fmtDate(phase.dueDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <PlayCircle className="h-3.5 w-3.5 text-sky-500" />
            <span className="text-muted-foreground">Início:</span>
            <span className="font-medium">{fmtDate(phase.startedAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-muted-foreground">Conclusão:</span>
            <span className="font-medium">{fmtDate(phase.completedAt)}</span>
          </div>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={handleSaveDraft} className="gap-2">
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar Rascunho
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={busy}
              onClick={() => setIsCancelOpen(o => !o)}
              className="gap-2 text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancelar
            </Button>
            <Button type="button" size="sm" disabled={busy} onClick={handleSubmit(handleFinalize)} className="gap-2">
              {isCompleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Finalizar Discovery
            </Button>
          </div>
        )}
      </div>

      {/* ── Cancel reason ── */}
      {isCancelOpen && (
        <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
          <label className="text-xs font-medium block">Justificativa do cancelamento *</label>
          <textarea
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder="Descreva o motivo do cancelamento..."
            rows={3}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={!cancelReason.trim() || isCancelling} onClick={handleCancelPhase}
              className="gap-2 bg-red-600 hover:bg-red-700"
            >
              {isCancelling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <XCircle className="h-3.5 w-3.5" />
              Confirmar cancelamento
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={isCancelling}
              onClick={() => { setIsCancelOpen(false); setCancelReason("") }}
            >
              Voltar
            </Button>
          </div>
        </div>
      )}

      {/* ── Canvas grid ── */}
      <form>
        <fieldset disabled={readOnly} className="contents">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="grid grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1 gap-3.5">

              {/* 1. Resumo Executivo — span 2 */}
              <CanvasCard id="disc-summary" title="Resumo Executivo" icon={<FileText className="h-3.5 w-3.5" />} span={2}>
                <div className="space-y-1.5">
                  <textarea
                    {...register("summary")}
                    onBlur={e => markField("summary", e.target.value)}
                    placeholder="Resuma o problema em uma frase"
                    rows={4}
                    className={textareaClass}
                  />
                  {errors.summary && <p className="text-[11px] text-destructive">{errors.summary.message as string}</p>}
                  <FieldAuthor fieldMeta={localMeta.summary} />
                </div>
              </CanvasCard>

              {/* 2. Sinalizadores — span 1 */}
              <CanvasCard id="disc-signals" title="Sinalizadores" icon={<Flag className="h-3.5 w-3.5" />} span={1}>
                <div className="space-y-3">
                  <div>
                    <span className="uppercase text-[11px] font-semibold tracking-wider text-slate-500 block mb-1.5">Complexidade</span>
                    <Controller name="complexity" control={control} render={({ field }) => (
                      <PillSelector
                        value={field.value as "Alta" | "Baixa"}
                        options={[{ value: "Baixa", label: "Pequena" }, { value: "Alta", label: "Média/Complexa" }]}
                        onSelect={v => { field.onChange(v); markField("complexity", v) }}
                        getActiveClass={v => v === "Alta" ? "bg-amber-100 text-amber-800 border-transparent" : "bg-green-100 text-green-700 border-transparent"}
                      />
                    )} />
                    <FieldAuthor fieldMeta={localMeta.complexity} />
                  </div>
                  <div>
                    <span className="uppercase text-[11px] font-semibold tracking-wider text-slate-500 block mb-1.5">Prioridade</span>
                    <Controller name="institutionalPriority" control={control} render={({ field }) => (
                      <PillSelector
                        value={field.value as "Alta" | "Média" | "Baixa"}
                        options={[{ value: "Alta", label: "Alta" }, { value: "Média", label: "Média" }, { value: "Baixa", label: "Baixa" }]}
                        onSelect={v => { field.onChange(v); markField("institutionalPriority", v) }}
                        getActiveClass={v => v === "Alta" ? "bg-red-100 text-red-700 border-transparent" : v === "Média" ? "bg-amber-100 text-amber-800 border-transparent" : "bg-slate-100 text-slate-600 border-transparent"}
                      />
                    )} />
                    <FieldAuthor fieldMeta={localMeta.institutionalPriority} />
                  </div>
                  <div>
                    <span className="uppercase text-[11px] font-semibold tracking-wider text-slate-500 block mb-1.5">Frequência</span>
                    <Controller name="frequency" control={control} render={({ field }) => (
                      <PillSelector
                        value={field.value as "Diária" | "Semanal" | "Mensal" | "Eventual"}
                        options={[
                          { value: "Diária", label: "Diária" },
                          { value: "Semanal", label: "Semanal" },
                          { value: "Mensal", label: "Mensal" },
                          { value: "Eventual", label: "Eventual" },
                        ]}
                        onSelect={v => { field.onChange(v); markField("frequency", v) }}
                        getActiveClass={() => "bg-[var(--canvas-primary-soft)] text-[var(--canvas-primary)] border-transparent"}
                      />
                    )} />
                    <FieldAuthor fieldMeta={localMeta.frequency} />
                  </div>
                  <div>
                    <span className="uppercase text-[11px] font-semibold tracking-wider text-slate-500 block mb-1.5">Dep. Humana</span>
                    <Controller name="humanDependency" control={control} render={({ field }) => (
                      <PillSelector
                        value={field.value as "Alta" | "Média" | "Baixa"}
                        options={[{ value: "Alta", label: "Alta" }, { value: "Média", label: "Média" }, { value: "Baixa", label: "Baixa" }]}
                        onSelect={v => { field.onChange(v); markField("humanDependency", v) }}
                        getActiveClass={v => v === "Alta" ? "bg-red-100 text-red-700 border-transparent" : v === "Média" ? "bg-amber-100 text-amber-800 border-transparent" : "bg-green-100 text-green-700 border-transparent"}
                      />
                    )} />
                    <FieldAuthor fieldMeta={localMeta.humanDependency} />
                  </div>
                </div>
              </CanvasCard>

              {/* 3. Pontos de Dor — span 1 */}
              <CanvasCard id="disc-pain" title="Pontos de Dor" icon={<Frown className="h-3.5 w-3.5" />} span={1} accent="danger">
                <div className="space-y-1.5">
                  <textarea
                    {...register("painPoints")}
                    onBlur={e => markField("painPoints", e.target.value)}
                    placeholder="Descreva as dores do usuário"
                    rows={5}
                    className={textareaClass}
                  />
                  {errors.painPoints && <p className="text-[11px] text-destructive">{errors.painPoints.message as string}</p>}
                  <FieldAuthor fieldMeta={localMeta.painPoints} />
                </div>
              </CanvasCard>

              {/* 4. Processo Atual — span 2 */}
              <CanvasCard id="disc-process" title="Processo Atual" icon={<Workflow className="h-3.5 w-3.5" />} span={2}>
                <div className="space-y-1.5">
                  {readOnly && initialData?.currentProcess ? (
                    <NumberedSteps text={initialData.currentProcess} />
                  ) : (
                    <textarea
                      {...register("currentProcess")}
                      onBlur={e => markField("currentProcess", e.target.value)}
                      placeholder={"1. Primeiro passo\n2. Segundo passo\n3. ..."}
                      rows={8}
                      className={textareaClass}
                    />
                  )}
                  {errors.currentProcess && <p className="text-[11px] text-destructive">{errors.currentProcess.message as string}</p>}
                  <FieldAuthor fieldMeta={localMeta.currentProcess} />
                </div>
              </CanvasCard>

              {/* 5. Custo da Inação — span 1 */}
              <CanvasCard id="disc-inaction" title="Custo da Inação" icon={<DollarSign className="h-3.5 w-3.5" />} span={1} accent="warn">
                <div className="space-y-1.5">
                  <textarea
                    {...register("inactionCost")}
                    onBlur={e => markField("inactionCost", e.target.value)}
                    placeholder="Qual é o custo de não resolver?"
                    rows={5}
                    className={textareaClass}
                  />
                  {errors.inactionCost && <p className="text-[11px] text-destructive">{errors.inactionCost.message as string}</p>}
                  <FieldAuthor fieldMeta={localMeta.inactionCost} />
                </div>
              </CanvasCard>

              {/* 6. Métricas Operacionais — span 2 */}
              <CanvasCard id="disc-metrics" title="Métricas Operacionais" icon={<Gauge className="h-3.5 w-3.5" />} span={2}>
                <div className="grid grid-cols-2 max-md:grid-cols-1 gap-3">
                  {/* Volume */}
                  <div className="bg-slate-50 border border-slate-200 rounded-[10px] p-4 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center shrink-0" style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: "var(--canvas-primary-soft)", color: "var(--canvas-primary)" }}>
                        <Workflow className="h-3.5 w-3.5" />
                      </div>
                      <span className="uppercase text-[11px] font-semibold tracking-wider text-slate-500">Volume</span>
                    </div>
                    <input
                      {...register("volume")}
                      onBlur={e => markField("volume", e.target.value)}
                      placeholder="Ex: 200 sol./mês"
                      className={inputClass + " text-[15px] font-bold"}
                    />
                    <span className="text-[11.5px] text-slate-500">demandas atendidas no período de referência</span>
                    {errors.volume && <p className="text-[11px] text-destructive">{errors.volume.message as string}</p>}
                    <FieldAuthor fieldMeta={localMeta.volume} />
                  </div>
                  {/* Tempo Médio */}
                  <div className="bg-slate-50 border border-slate-200 rounded-[10px] p-4 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center shrink-0" style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: "rgb(254 243 199)", color: "rgb(180 83 9)" }}>
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                      <span className="uppercase text-[11px] font-semibold tracking-wider text-slate-500">Tempo Médio</span>
                    </div>
                    <input
                      {...register("avgTime")}
                      onBlur={e => markField("avgTime", e.target.value)}
                      placeholder="Ex: 45 min"
                      className={inputClass + " text-[15px] font-bold"}
                    />
                    <span className="text-[11.5px] text-slate-500">por unidade de trabalho</span>
                    {errors.avgTime && <p className="text-[11px] text-destructive">{errors.avgTime.message as string}</p>}
                    <FieldAuthor fieldMeta={localMeta.avgTime} />
                  </div>
                </div>
              </CanvasCard>

              {/* 7–9. Alta only */}
              {complexity === "Alta" && (
                <CanvasCard id="disc-rework" title="Retrabalho / Erro" icon={<RotateCcw className="h-3.5 w-3.5" />} span={1} accent="danger">
                  <div className="space-y-1.5">
                    <textarea
                      {...register("rework")}
                      onBlur={e => markField("rework", e.target.value)}
                      placeholder="Qual é a taxa de retrabalho/erro?"
                      rows={4}
                      className={textareaClass}
                    />
                    {errors.rework && <p className="text-[11px] text-destructive">{errors.rework.message as string}</p>}
                    <FieldAuthor fieldMeta={localMeta.rework} />
                  </div>
                </CanvasCard>
              )}
              {complexity === "Alta" && (
                <CanvasCard id="disc-prev" title="Tentativas Anteriores" icon={<History className="h-3.5 w-3.5" />} span={1}>
                  <div className="space-y-1.5">
                    <textarea
                      {...register("previousAttempts")}
                      onBlur={e => markField("previousAttempts", e.target.value)}
                      placeholder="Descreva tentativas anteriores para resolver este problema"
                      rows={4}
                      className={textareaClass}
                    />
                    {errors.previousAttempts && <p className="text-[11px] text-destructive">{errors.previousAttempts.message as string}</p>}
                    <FieldAuthor fieldMeta={localMeta.previousAttempts} />
                  </div>
                </CanvasCard>
              )}
              {complexity === "Alta" && (
                <CanvasCard id="disc-benchmark" title="Benchmark" icon={<Compass className="h-3.5 w-3.5" />} span={1}>
                  <div className="space-y-1.5">
                    <textarea
                      {...register("benchmark")}
                      onBlur={e => markField("benchmark", e.target.value)}
                      placeholder="Como outras organizações resolvem este problema?"
                      rows={4}
                      className={textareaClass}
                    />
                    {errors.benchmark && <p className="text-[11px] text-destructive">{errors.benchmark.message as string}</p>}
                    <FieldAuthor fieldMeta={localMeta.benchmark} />
                  </div>
                </CanvasCard>
              )}

              {/* 10. Parecer Técnico — span 3 */}
              <CanvasCard
                id="disc-opinion"
                title="Parecer Técnico"
                icon={<Wand2 className="h-3.5 w-3.5" />}
                span={3}
                headerRight={
                  <span className="bg-[var(--canvas-primary-soft)] text-[var(--canvas-primary)] text-[10.5px] font-mono px-1.5 py-0.5 rounded">
                    conclusão do(a) avaliador(a)
                  </span>
                }
              >
                <div className="space-y-2">
                  {/* Task metadata strip */}
                  <div className="flex flex-wrap gap-3 mb-3 text-[12px] text-slate-500">
                    <span>
                      <span className="font-medium text-slate-700">Projeto:</span>{" "}
                      <input {...register("projectName")} disabled className="text-slate-500 bg-transparent outline-none" />
                    </span>
                    {taskData?.applicant && (
                      <span><span className="font-medium text-slate-700">Setor:</span>{" "}{taskData.applicant}</span>
                    )}
                    {taskData?.flows && taskData.flows.length > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-slate-700">Fluxos:</span>
                        {taskData.flows.map(f => (
                          <Badge key={f.id} variant="secondary" className="text-[10px] px-1.5 py-0 uppercase">{f.name}</Badge>
                        ))}
                      </span>
                    )}
                  </div>
                  <textarea
                    {...register("technicalOpinion")}
                    onBlur={e => markField("technicalOpinion", e.target.value)}
                    placeholder="Qual é seu parecer técnico sobre este problema?"
                    rows={5}
                    className={textareaClass}
                  />
                  {errors.technicalOpinion && <p className="text-[11px] text-destructive">{errors.technicalOpinion.message as string}</p>}
                  <FieldAuthor fieldMeta={localMeta.technicalOpinion} />
                </div>
              </CanvasCard>

            </div>
          </div>
        </fieldset>
      </form>
    </div>
  )
}

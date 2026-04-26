"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, Save, Calendar, PlayCircle, XCircle } from "lucide-react"
import useSWR from "swr"
import { toast } from "sonner"

type Phase = {
  id: string
  name: string
  order: number
  enabled: boolean
  status: "not_started" | "in_progress" | "completed" | "approved" | "rejected"
  dueDate?: string
  startedAt?: string
  completedAt?: string
  notes?: string
  checklist: { id: string; label: string; completed: boolean }[]
  discoveryData?: DiscoveryData
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

export type DiscoveryData = {
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

const baseSchema = z.object({
  projectName: z.string().min(1, "Nome do projeto é obrigatório"),
  complexity: z.enum(["Alta", "Baixa"]),
  summary: z.string().min(1, "Resumo do problema é obrigatório"),
  painPoints: z.string().min(1, "Dores do usuário são obrigatórias"),
  frequency: z.enum(["Diária", "Semanal", "Mensal", "Eventual"]),
  currentProcess: z.string().min(1, "Passo a passo atual é obrigatório"),
  inactionCost: z.string().min(1, "Custo da inação é obrigatório"),
  volume: z.string().min(1, "Volume é obrigatório"),
  avgTime: z.string().min(1, "Tempo médio é obrigatório"),
  humanDependency: z.enum(["Alta", "Média", "Baixa"]),
  rework: z.string().optional(),
  previousAttempts: z.string().optional(),
  benchmark: z.string().optional(),
  institutionalPriority: z.enum(["Alta", "Média", "Baixa"]),
  technicalOpinion: z.string().min(1, "Parecer técnico é obrigatório"),
})

const complexSchema = baseSchema.extend({
  rework: z.string().min(1, "Retrabalho/Erro é obrigatório"),
  previousAttempts: z.string().min(1, "Tentativas anteriores é obrigatório"),
  benchmark: z.string().min(1, "Benchmark é obrigatório"),
})

const draftSchema = baseSchema.partial()

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function DiscoveryForm({
  phase,
  taskId,
  initialData,
  taskData: externalTaskData,
  onSaved,
}: {
  phase: Phase
  taskId: string
  initialData?: DiscoveryData
  taskData?: Task
  onSaved: (completed?: boolean) => void
}) {
  const [isSaving, setIsSaving] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [isCancelling, setIsCancelling] = useState(false)
  const { data: fetchedTaskData, mutate } = useSWR<Task>(`/api/tasks/${taskId}`, fetcher)
  const taskData = externalTaskData || fetchedTaskData

  const defaultComplexity = initialData?.complexity || "Baixa"
  const schema = defaultComplexity === "Alta" ? complexSchema : baseSchema

  const {
    register,
    handleSubmit,
    watch,
    control,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema) as any,
    defaultValues: initialData || {
      projectName: taskData?.name || "",
      complexity: "Baixa" as const,
      humanDependency: "Média" as const,
      frequency: "Eventual" as const,
      institutionalPriority: "Média" as const,
    },
  })

  const complexity = watch("complexity")

  const buildDiscoveryData = (data: any): DiscoveryData => ({
    projectName: data.projectName || "",
    complexity: data.complexity || "Baixa",
    summary: data.summary || "",
    painPoints: data.painPoints || "",
    frequency: data.frequency || "Eventual",
    currentProcess: data.currentProcess || "",
    inactionCost: data.inactionCost || "",
    volume: data.volume || "",
    avgTime: data.avgTime || "",
    humanDependency: data.humanDependency || "Média",
    rework: data.rework || "",
    previousAttempts: data.previousAttempts || "",
    benchmark: data.benchmark || "",
    institutionalPriority: data.institutionalPriority || "Média",
    technicalOpinion: data.technicalOpinion || "",
  })

  const saveDiscoveryData = async (discoveryData: DiscoveryData) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phases: [{ id: phase.id, discoveryData }],
        partialPhaseUpdate: true,
      }),
    })
    if (!res.ok) throw new Error("Erro ao salvar dados do Discovery")
  }

  const handleSaveDraft = async () => {
    const data = getValues()
    setIsSaving(true)
    try {
      await saveDiscoveryData(buildDiscoveryData(data))
      mutate()
      onSaved(false)
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar rascunho")
    } finally {
      setIsSaving(false)
    }
  }

  const handleFinalize = async (data: any) => {
    setIsCompleting(true)
    try {
      await saveDiscoveryData(buildDiscoveryData(data))

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
    } catch (error: any) {
      toast.error(error.message || "Erro ao finalizar Discovery")
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
    } catch (error: any) {
      toast.error(error.message || "Erro ao cancelar fase")
    } finally {
      setIsCancelling(false)
    }
  }

  const fmtDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—"

  return (
    <form className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-muted/40 border mb-2">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Entrega prevista:</span>
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
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSaving || isCompleting || isCancelling}
            onClick={handleSaveDraft}
            className="gap-2"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Salvar Rascunho
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSaving || isCompleting || isCancelling}
            onClick={() => setIsCancelOpen(o => !o)}
            className="gap-2 text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          >
            <XCircle className="h-3.5 w-3.5" />
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSaving || isCompleting || isCancelling}
            onClick={handleSubmit(handleFinalize)}
            className="gap-2"
          >
            {isCompleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Finalizar Discovery
          </Button>
        </div>
      </div>

      {isCancelOpen && (
        <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
          <label className="text-xs font-medium block">Justificativa do cancelamento *</label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Descreva o motivo do cancelamento..."
            rows={3}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={!cancelReason.trim() || isCancelling} onClick={handleCancelPhase} className="gap-2 bg-red-600 hover:bg-red-700">
              {isCancelling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <XCircle className="h-3.5 w-3.5" />
              Confirmar cancelamento
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={isCancelling} onClick={() => { setIsCancelOpen(false); setCancelReason("") }}>
              Voltar
            </Button>
          </div>
        </div>
      )}

      <div>
        <label className="text-sm font-semibold block mb-3">
          Complexidade Inicial *
        </label>
        <Controller
          control={control}
          name="complexity"
          render={({ field }) => (
            <div className="flex gap-4">
              <div className="flex items-center space-x-1.5">
                <input type="radio" id="complexity-small" value="Baixa" checked={field.value === "Baixa"} onChange={() => field.onChange("Baixa")} className="cursor-pointer" />
                <Label htmlFor="complexity-small" className="font-normal cursor-pointer">Pequena</Label>
              </div>
              <div className="flex items-center space-x-1.5">
                <input type="radio" id="complexity-complex" value="Alta" checked={field.value === "Alta"} onChange={() => field.onChange("Alta")} className="cursor-pointer" />
                <Label htmlFor="complexity-complex" className="font-normal cursor-pointer">Média/Complexa</Label>
              </div>
            </div>
          )}
        />
        {errors.complexity && (
          <p className="text-xs text-destructive mt-1">{errors.complexity.message as string}</p>
        )}
      </div>

      {/* Identificação e Triagem */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold mb-4">1. Identificação e Triagem</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Nome do Projeto *</label>
            <input
              {...register("projectName")}
              placeholder="Digite o nome do projeto"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.projectName && (
              <p className="text-xs text-destructive mt-1">{errors.projectName.message as string}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Setor/Área <span className="text-xs text-muted-foreground">(preenchido automaticamente)</span>
            </label>
            {taskData?.applicant ? (
              <Badge variant="secondary" className="text-sm px-3 py-1">{taskData.applicant}</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">Não informado</span>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-3">
              Fluxo Previsto <span className="text-xs text-muted-foreground">(preenchido automaticamente)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {taskData?.flows && taskData.flows.length > 0 ? (
                taskData.flows.map((flow) => (
                  <Badge key={flow.id} className="uppercase">{flow.name}</Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Nenhum fluxo associado</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Diagnóstico do Problema */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold mb-4">2. Diagnóstico do Problema</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Resumo em 1 Frase *</label>
            <input
              {...register("summary")}
              placeholder="Resuma o problema em uma frase"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.summary && (
              <p className="text-xs text-destructive mt-1">{errors.summary.message as string}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Dores do Usuário *</label>
            <textarea
              {...register("painPoints")}
              placeholder="Descreva as dores do usuário"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-20"
            />
            {errors.painPoints && (
              <p className="text-xs text-destructive mt-1">{errors.painPoints.message as string}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-3">Frequência *</label>
            <Controller
              control={control}
              name="frequency"
              render={({ field }) => (
                <div className="flex gap-4 flex-wrap">
                  {[
                    { value: "Diária", label: "Diário" },
                    { value: "Semanal", label: "Semanal" },
                    { value: "Mensal", label: "Mensal" },
                    { value: "Eventual", label: "Eventual" },
                  ].map(({ value, label }) => (
                    <div key={value} className="flex items-center space-x-1.5">
                      <input type="radio" id={`frequency-${value}`} value={value} checked={field.value === value} onChange={() => field.onChange(value)} className="cursor-pointer" />
                      <Label htmlFor={`frequency-${value}`} className="font-normal cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </div>
              )}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Passo a Passo Atual *</label>
            <textarea
              {...register("currentProcess")}
              placeholder="Descreva o processo atual"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-20"
            />
            {errors.currentProcess && (
              <p className="text-xs text-destructive mt-1">{errors.currentProcess.message as string}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Custo da Inação *</label>
            <textarea
              {...register("inactionCost")}
              placeholder="Qual é o custo de não resolver?"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-20"
            />
            {errors.inactionCost && (
              <p className="text-xs text-destructive mt-1">{errors.inactionCost.message as string}</p>
            )}
          </div>
        </div>
      </div>

      {/* Dados para Decisão */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold mb-4">3. Dados para Decisão</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Volume *</label>
            <input
              {...register("volume")}
              placeholder="Ex: 1000 registros/mês"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.volume && (
              <p className="text-xs text-destructive mt-1">{errors.volume.message as string}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Tempo Médio *</label>
            <input
              {...register("avgTime")}
              placeholder="Ex: 2 horas por processo"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.avgTime && (
              <p className="text-xs text-destructive mt-1">{errors.avgTime.message as string}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-3">Dependência Humana *</label>
            <Controller
              control={control}
              name="humanDependency"
              render={({ field }) => (
                <div className="flex gap-4">
                  {[
                    { value: "Alta", label: "Alta" },
                    { value: "Média", label: "Média" },
                    { value: "Baixa", label: "Baixa" },
                  ].map(({ value, label }) => (
                    <div key={value} className="flex items-center space-x-1.5">
                      <input type="radio" id={`humanDependency-${value}`} value={value} checked={field.value === value} onChange={() => field.onChange(value)} className="cursor-pointer" />
                      <Label htmlFor={`humanDependency-${value}`} className="font-normal cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </div>
              )}
            />
          </div>

          {complexity === "Alta" && (
            <div>
              <label className="text-sm font-medium block mb-1">Retrabalho/Erro *</label>
              <input
                {...register("rework")}
                placeholder="Qual é a taxa de retrabalho/erro?"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.rework && (
                <p className="text-xs text-destructive mt-1">{errors.rework.message as string}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Histórico e Benchmark */}
      {complexity === "Alta" && (
        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold mb-4">4. Histórico e Benchmark</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Tentativas Anteriores *</label>
              <textarea
                {...register("previousAttempts")}
                placeholder="Descreva tentativas anteriores para resolver este problema"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-20"
              />
              {errors.previousAttempts && (
                <p className="text-xs text-destructive mt-1">{errors.previousAttempts.message as string}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Benchmark *</label>
              <textarea
                {...register("benchmark")}
                placeholder="Como outras organizações resolvem este problema?"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-20"
              />
              {errors.benchmark && (
                <p className="text-xs text-destructive mt-1">{errors.benchmark.message as string}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Avaliação do Analista */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold mb-4">{complexity === "Alta" ? "5." : "4."} Avaliação do Analista</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-3">Prioridade Institucional *</label>
            <Controller
              control={control}
              name="institutionalPriority"
              render={({ field }) => (
                <div className="flex gap-4">
                  {[
                    { value: "Alta", label: "Alta" },
                    { value: "Média", label: "Média" },
                    { value: "Baixa", label: "Baixa" },
                  ].map(({ value, label }) => (
                    <div key={value} className="flex items-center space-x-1.5">
                      <input type="radio" id={`institutionalPriority-${value}`} value={value} checked={field.value === value} onChange={() => field.onChange(value)} className="cursor-pointer" />
                      <Label htmlFor={`institutionalPriority-${value}`} className="font-normal cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </div>
              )}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Parecer Técnico *</label>
            <textarea
              {...register("technicalOpinion")}
              placeholder="Qual é seu parecer técnico sobre este problema?"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-20"
            />
            {errors.technicalOpinion && (
              <p className="text-xs text-destructive mt-1">{errors.technicalOpinion.message as string}</p>
            )}
          </div>
        </div>
      </div>

    </form>
  )
}

function DiscoveryDisplay({ data }: { data: DiscoveryData }) {
  const labelMap: Record<string, string> = {
    projectName: "Nome do Projeto",
    complexity: "Complexidade",
    summary: "Resumo do Problema",
    painPoints: "Dores do Usuário",
    frequency: "Frequência",
    currentProcess: "Passo a Passo Atual",
    inactionCost: "Custo da Inação",
    volume: "Volume",
    avgTime: "Tempo Médio",
    humanDependency: "Dependência Humana",
    rework: "Retrabalho/Erro",
    previousAttempts: "Tentativas Anteriores",
    benchmark: "Benchmark",
    institutionalPriority: "Prioridade Institucional",
    technicalOpinion: "Parecer Técnico",
  }

  const formatValue = (key: string, value: any) => {
    const maps: Record<string, Record<string, string>> = {
      complexity: { Alta: "Média/Complexa", Baixa: "Pequena" },
    }
    return maps[key]?.[value] ?? value
  }

  return (
    <Accordion
      type="multiple"
      defaultValue={["identificacao", "diagnostico", "dados", "historico", "avaliacao"]}
      className="space-y-2"
    >
      <AccordionItem value="identificacao">
        <AccordionTrigger>1. Identificação e Triagem</AccordionTrigger>
        <AccordionContent className="space-y-3">
          {["projectName", "complexity"].map(key => (
            <div key={key}>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">{labelMap[key]}</h4>
              <p className="text-sm text-foreground">{formatValue(key, data[key as keyof DiscoveryData])}</p>
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="diagnostico">
        <AccordionTrigger>2. Diagnóstico do Problema</AccordionTrigger>
        <AccordionContent className="space-y-3">
          {["summary", "painPoints", "frequency", "currentProcess", "inactionCost"].map(key => (
            <div key={key}>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">{labelMap[key]}</h4>
              <p className="text-sm text-foreground whitespace-pre-wrap">{formatValue(key, data[key as keyof DiscoveryData])}</p>
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="dados">
        <AccordionTrigger>3. Dados para Decisão</AccordionTrigger>
        <AccordionContent className="space-y-3">
          {["volume", "avgTime", "humanDependency", ...(data.rework ? ["rework"] : [])].map(key => (
            <div key={key}>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">{labelMap[key]}</h4>
              <p className="text-sm text-foreground">{formatValue(key, data[key as keyof DiscoveryData])}</p>
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>

      {data.complexity === "Alta" && (
        <AccordionItem value="historico">
          <AccordionTrigger>4. Histórico e Benchmark</AccordionTrigger>
          <AccordionContent className="space-y-3">
            {["previousAttempts", "benchmark"].map(key => (
              <div key={key}>
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">{labelMap[key]}</h4>
                <p className="text-sm text-foreground whitespace-pre-wrap">{data[key as keyof DiscoveryData]}</p>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      )}

      <AccordionItem value="avaliacao">
        <AccordionTrigger>{data.complexity === "Alta" ? "5." : "4."} Avaliação do Analista</AccordionTrigger>
        <AccordionContent className="space-y-3">
          {["institutionalPriority", "technicalOpinion"].map(key => (
            <div key={key}>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">{labelMap[key]}</h4>
              <p className="text-sm text-foreground whitespace-pre-wrap">{formatValue(key, data[key as keyof DiscoveryData])}</p>
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export function DiscoveryPhaseTab({
  phase,
  taskId,
  onPhaseUpdate,
}: {
  phase: Phase
  taskId: string
  onPhaseUpdate: (phases: Phase[]) => void
}) {
  const { data: taskData, mutate } = useSWR<Task>(`/api/tasks/${taskId}`, fetcher)
  const [isStarting, setIsStarting] = useState(false)

  const handleStart = async () => {
    setIsStarting(true)
    try {
      await fetch(`/api/tasks/${taskId}/phases/${phase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      })
      mutate()
      onPhaseUpdate([])
    } catch (error: any) {
      toast.error(error.message || "Erro ao iniciar fase")
    } finally {
      setIsStarting(false)
    }
  }

  if (phase.status === "not_started") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed">
        <div className="flex-1">
          <p className="text-sm font-medium">Discovery</p>
          <p className="text-xs text-muted-foreground mt-0.5">Clique em Iniciar para começar o preenchimento</p>
        </div>
        <Button onClick={handleStart} disabled={isStarting} className="gap-2 shrink-0">
          {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
          Iniciar
        </Button>
      </div>
    )
  }

  if ((phase.status === "approved" || phase.status === "rejected") && phase.discoveryData) {
    return (
      <div className="space-y-6">
        <DiscoveryDisplay data={phase.discoveryData} />
      </div>
    )
  }

  if (phase.status === "completed" && phase.discoveryData) {
    return (
      <div className="space-y-6">
        <DiscoveryDisplay data={phase.discoveryData} />
      </div>
    )
  }

  return (
    <DiscoveryForm
      phase={phase}
      taskId={taskId}
      initialData={phase.discoveryData}
      taskData={taskData}
      onSaved={() => { mutate(); onPhaseUpdate([]) }}
    />
  )
}

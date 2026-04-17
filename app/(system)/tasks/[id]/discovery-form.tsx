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
import { Loader2 } from "lucide-react"
import useSWR from "swr"

type Phase = {
  id: string
  name: string
  order: number
  enabled: boolean
  status: "not_started" | "in_progress" | "completed"
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
  sector: string
  complexity: "small" | "complex"
  flow: "interno" | "coppe" | "externo"
  problemSummary: string
  userPains: string
  frequency: "diario" | "semanal" | "mensal" | "eventual"
  currentProcess: string
  inactionCost: string
  volume: string
  averageTime: string
  humanDependency: "alta" | "media" | "baixa"
  reworkRate?: string
  previousAttempts?: string
  benchmark?: string
  institutionalPriority: "alta" | "media" | "baixa"
  aiPotential: "alto" | "medio" | "baixo"
  technicalOpinion: string
}

const baseSchema = z.object({
  projectName: z.string().min(1, "Nome do projeto é obrigatório"),
  sector: z.string().optional(),
  complexity: z.enum(["small", "complex"]),
  flow: z.enum(["interno", "coppe", "externo"]),
  problemSummary: z.string().min(1, "Resumo do problema é obrigatório"),
  userPains: z.string().min(1, "Dores do usuário são obrigatórias"),
  frequency: z.enum(["diario", "semanal", "mensal", "eventual"]),
  currentProcess: z.string().min(1, "Passo a passo atual é obrigatório"),
  inactionCost: z.string().min(1, "Custo da inação é obrigatório"),
  volume: z.string().min(1, "Volume é obrigatório"),
  averageTime: z.string().min(1, "Tempo médio é obrigatório"),
  humanDependency: z.enum(["alta", "media", "baixa"]),
  institutionalPriority: z.enum(["alta", "media", "baixa"]),
  aiPotential: z.enum(["alto", "medio", "baixo"]),
  technicalOpinion: z.string().min(1, "Parecer técnico é obrigatório"),
})

const complexSchema = baseSchema.extend({
  reworkRate: z.string().min(1, "Retrabalho/Erro é obrigatório"),
  previousAttempts: z.string().min(1, "Tentativas anteriores é obrigatório"),
  benchmark: z.string().min(1, "Benchmark é obrigatório"),
})

type FormData = z.infer<typeof baseSchema>
type ComplexFormData = z.infer<typeof complexSchema>

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function DiscoveryForm({
  phase,
  taskId,
  initialData,
  taskData: externalTaskData,
  onSave,
  onCancel,
}: {
  phase: Phase
  taskId: string
  initialData?: DiscoveryData
  taskData?: Task
  onSave: () => void
  onCancel: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const { data: fetchedTaskData, mutate } = useSWR<Task>(`/api/tasks/${taskId}`, fetcher)
  const taskData = externalTaskData || fetchedTaskData

  const defaultComplexity = initialData?.complexity || "small"
  const schema = defaultComplexity === "complex" ? complexSchema : baseSchema

  // Mapear flows da tarefa para o campo flow (interno, coppe, externo)
  const getDefaultFlow = () => {
    if (initialData?.flow) return initialData.flow
    if (taskData?.flows && taskData.flows.length > 0) {
      const flowName = taskData.flows[0].name.toLowerCase()
      if (flowName.includes("coppe")) return "coppe"
      if (flowName.includes("externo")) return "externo"
      // Adicionar mais mapeamentos conforme necessário
    }
    return "interno"
  }

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema) as any,
    defaultValues: initialData || {
      projectName: taskData?.name || "",
      sector: taskData?.applicant || "",
      complexity: "small",
      humanDependency: "media",
      frequency: "eventual",
      institutionalPriority: "media",
      aiPotential: "medio",
      flow: getDefaultFlow(),
    },
  })

  const complexity = watch("complexity")

  const onSubmit = async (data: any) => {
    if (!taskData) return
    setIsLoading(true)
    try {
      const discoveryData: DiscoveryData = {
        projectName: data.projectName,
        sector: data.sector || taskData.applicant || "",
        complexity: data.complexity,
        flow: data.flow,
        problemSummary: data.problemSummary,
        userPains: data.userPains,
        frequency: data.frequency,
        currentProcess: data.currentProcess,
        inactionCost: data.inactionCost,
        volume: data.volume,
        averageTime: data.averageTime,
        humanDependency: data.humanDependency,
        institutionalPriority: data.institutionalPriority,
        aiPotential: data.aiPotential,
        technicalOpinion: data.technicalOpinion,
        ...(data.complexity === "complex" && {
          reworkRate: data.reworkRate,
          previousAttempts: data.previousAttempts,
          benchmark: data.benchmark,
        }),
      }

      const updatedPhases = taskData.phases?.map(p =>
        p.id === phase.id
          ? { ...p, discoveryData, status: "in_progress" }
          : p
      ) || []

      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phases: updatedPhases }),
      })

      mutate()
      onSave()
    } catch (error) {
      console.error("Error saving discovery:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                <input type="radio" id="complexity-small" value="small" checked={field.value === "small"} onChange={() => field.onChange("small")} className="cursor-pointer" />
                <Label htmlFor="complexity-small" className="font-normal cursor-pointer">Pequena</Label>
              </div>
              <div className="flex items-center space-x-1.5">
                <input type="radio" id="complexity-complex" value="complex" checked={field.value === "complex"} onChange={() => field.onChange("complex")} className="cursor-pointer" />
                <Label htmlFor="complexity-complex" className="font-normal cursor-pointer">Média/Complexa</Label>
              </div>
            </div>
          )}
        />
        {errors.complexity && (
          <p className="text-xs text-destructive mt-1">{errors.complexity.message}</p>
        )}
      </div>

      {/* Identificação e Triagem */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold mb-4">1. Identificação e Triagem</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">
              Nome do Projeto *
            </label>
            <input
              {...register("projectName")}
              placeholder="Digite o nome do projeto"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.projectName && (
              <p className="text-xs text-destructive mt-1">
                {errors.projectName.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">
              Setor/Área <span className="text-xs text-muted-foreground">(preenchido automaticamente)</span>
            </label>
            {taskData?.applicant ? (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {taskData.applicant}
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">Não informado</span>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-3">
              Fluxo Previsto * <span className="text-xs text-muted-foreground">(preenchido automaticamente)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {taskData?.flows && taskData.flows.length > 0 ? (
                taskData.flows.map((flow) => (
                  <label
                    key={flow.id}
                    className="inline-flex items-center px-3 py-2 rounded-full border-2 border-primary bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors"
                  >
                    <input
                      type="checkbox"
                      value={flow.id}
                      checked={true}
                      disabled
                      className="cursor-not-allowed"
                    />
                    <span className="ml-2 text-sm font-medium">{flow.name}</span>
                  </label>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Nenhum fluxo associado</span>
              )}
            </div>
            {errors.flow && (
              <p className="text-xs text-destructive mt-2">
                {errors.flow.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Diagnóstico do Problema */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold mb-4">2. Diagnóstico do Problema</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">
              Resumo em 1 Frase *
            </label>
            <input
              {...register("problemSummary")}
              placeholder="Resuma o problema em uma frase"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.problemSummary && (
              <p className="text-xs text-destructive mt-1">
                {errors.problemSummary.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              Dores do Usuário *
            </label>
            <textarea
              {...register("userPains")}
              placeholder="Descreva as dores do usuário"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-20"
            />
            {errors.userPains && (
              <p className="text-xs text-destructive mt-1">
                {errors.userPains.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-3">
              Frequência *
            </label>
            <Controller
              control={control}
              name="frequency"
              render={({ field }) => (
                <div className="flex gap-4 flex-wrap">
                  <div className="flex items-center space-x-1.5">
                    <input type="radio" id="frequency-diario" value="diario" checked={field.value === "diario"} onChange={() => field.onChange("diario")} className="cursor-pointer" />
                    <Label htmlFor="frequency-diario" className="font-normal cursor-pointer">Diário</Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input type="radio" id="frequency-semanal" value="semanal" checked={field.value === "semanal"} onChange={() => field.onChange("semanal")} className="cursor-pointer" />
                    <Label htmlFor="frequency-semanal" className="font-normal cursor-pointer">Semanal</Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input type="radio" id="frequency-mensal" value="mensal" checked={field.value === "mensal"} onChange={() => field.onChange("mensal")} className="cursor-pointer" />
                    <Label htmlFor="frequency-mensal" className="font-normal cursor-pointer">Mensal</Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input type="radio" id="frequency-eventual" value="eventual" checked={field.value === "eventual"} onChange={() => field.onChange("eventual")} className="cursor-pointer" />
                    <Label htmlFor="frequency-eventual" className="font-normal cursor-pointer">Eventual</Label>
                  </div>
                </div>
              )}
            />
            {errors.frequency && (
              <p className="text-xs text-destructive mt-1">
                {errors.frequency.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              Passo a Passo Atual *
            </label>
            <textarea
              {...register("currentProcess")}
              placeholder="Descreva o processo atual"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-20"
            />
            {errors.currentProcess && (
              <p className="text-xs text-destructive mt-1">
                {errors.currentProcess.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              Custo da Inação *
            </label>
            <textarea
              {...register("inactionCost")}
              placeholder="Qual é o custo de não resolver?"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-20"
            />
            {errors.inactionCost && (
              <p className="text-xs text-destructive mt-1">
                {errors.inactionCost.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dados para Decisão */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold mb-4">3. Dados para Decisão</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">
              Volume *
            </label>
            <input
              {...register("volume")}
              placeholder="Ex: 1000 registros/mês"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.volume && (
              <p className="text-xs text-destructive mt-1">
                {errors.volume.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              Tempo Médio *
            </label>
            <input
              {...register("averageTime")}
              placeholder="Ex: 2 horas por processo"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.averageTime && (
              <p className="text-xs text-destructive mt-1">
                {errors.averageTime.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-3">
              Dependência Humana *
            </label>
            <Controller
              control={control}
              name="humanDependency"
              render={({ field }) => (
                <div className="flex gap-4">
                  <div className="flex items-center space-x-1.5">
                    <input type="radio" id="humanDependency-alta" value="alta" checked={field.value === "alta"} onChange={() => field.onChange("alta")} className="cursor-pointer" />
                    <Label htmlFor="humanDependency-alta" className="font-normal cursor-pointer">Alta</Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input type="radio" id="humanDependency-media" value="media" checked={field.value === "media"} onChange={() => field.onChange("media")} className="cursor-pointer" />
                    <Label htmlFor="humanDependency-media" className="font-normal cursor-pointer">Média</Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input type="radio" id="humanDependency-baixa" value="baixa" checked={field.value === "baixa"} onChange={() => field.onChange("baixa")} className="cursor-pointer" />
                    <Label htmlFor="humanDependency-baixa" className="font-normal cursor-pointer">Baixa</Label>
                  </div>
                </div>
              )}
            />
            {errors.humanDependency && (
              <p className="text-xs text-destructive mt-1">
                {errors.humanDependency.message}
              </p>
            )}
          </div>

          {complexity === "complex" && (
            <>
              <div>
                <label className="text-sm font-medium block mb-1">
                  Retrabalho/Erro *
                </label>
                <input
                  {...register("reworkRate")}
                  placeholder="Qual é a taxa de retrabalho/erro?"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {errors.reworkRate && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.reworkRate.message}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Histórico e Benchmark - Only for complex */}
      {complexity === "complex" && (
        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold mb-4">4. Histórico e Benchmark</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">
                Tentativas Anteriores *
              </label>
              <textarea
                {...register("previousAttempts")}
                placeholder="Descreva tentativas anteriores para resolver este problema"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-20"
              />
              {errors.previousAttempts && (
                <p className="text-xs text-destructive mt-1">
                  {errors.previousAttempts.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">
                Benchmark *
              </label>
              <textarea
                {...register("benchmark")}
                placeholder="Como outras organizações resolvem este problema?"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-20"
              />
              {errors.benchmark && (
                <p className="text-xs text-destructive mt-1">
                  {errors.benchmark.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Avaliação do Analista */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-semibold mb-4">5. Avaliação do Analista</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-3">
              Prioridade Institucional *
            </label>
            <Controller
              control={control}
              name="institutionalPriority"
              render={({ field }) => (
                <div className="flex gap-4">
                  <div className="flex items-center space-x-1.5">
                    <input type="radio" id="institutionalPriority-alta" value="alta" checked={field.value === "alta"} onChange={() => field.onChange("alta")} className="cursor-pointer" />
                    <Label htmlFor="institutionalPriority-alta" className="font-normal cursor-pointer">Alta</Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input type="radio" id="institutionalPriority-media" value="media" checked={field.value === "media"} onChange={() => field.onChange("media")} className="cursor-pointer" />
                    <Label htmlFor="institutionalPriority-media" className="font-normal cursor-pointer">Média</Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input type="radio" id="institutionalPriority-baixa" value="baixa" checked={field.value === "baixa"} onChange={() => field.onChange("baixa")} className="cursor-pointer" />
                    <Label htmlFor="institutionalPriority-baixa" className="font-normal cursor-pointer">Baixa</Label>
                  </div>
                </div>
              )}
            />
            {errors.institutionalPriority && (
              <p className="text-xs text-destructive mt-1">
                {errors.institutionalPriority.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-3">
              Potencial de IA/Automação *
            </label>
            <Controller
              control={control}
              name="aiPotential"
              render={({ field }) => (
                <div className="flex gap-4">
                  <div className="flex items-center space-x-1.5">
                    <input type="radio" id="aiPotential-alto" value="alto" checked={field.value === "alto"} onChange={() => field.onChange("alto")} className="cursor-pointer" />
                    <Label htmlFor="aiPotential-alto" className="font-normal cursor-pointer">Alto</Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input type="radio" id="aiPotential-medio" value="medio" checked={field.value === "medio"} onChange={() => field.onChange("medio")} className="cursor-pointer" />
                    <Label htmlFor="aiPotential-medio" className="font-normal cursor-pointer">Médio</Label>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <input type="radio" id="aiPotential-baixo" value="baixo" checked={field.value === "baixo"} onChange={() => field.onChange("baixo")} className="cursor-pointer" />
                    <Label htmlFor="aiPotential-baixo" className="font-normal cursor-pointer">Baixo</Label>
                  </div>
                </div>
              )}
            />
            {errors.aiPotential && (
              <p className="text-xs text-destructive mt-1">
                {errors.aiPotential.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              Parecer Técnico *
            </label>
            <textarea
              {...register("technicalOpinion")}
              placeholder="Qual é seu parecer técnico sobre este problema?"
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-20"
            />
            {errors.technicalOpinion && (
              <p className="text-xs text-destructive mt-1">
                {errors.technicalOpinion.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 border-t pt-6">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Discovery"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancelar
        </Button>
      </div>
    </form>
  )
}

function DiscoveryDisplay({ data }: { data: DiscoveryData }) {
  const labelMap: Record<string, string> = {
    projectName: "Nome do Projeto",
    sector: "Setor/Área",
    complexity: "Complexidade",
    flow: "Fluxo Previsto",
    problemSummary: "Resumo do Problema",
    userPains: "Dores do Usuário",
    frequency: "Frequência",
    currentProcess: "Passo a Passo Atual",
    inactionCost: "Custo da Inação",
    volume: "Volume",
    averageTime: "Tempo Médio",
    humanDependency: "Dependência Humana",
    reworkRate: "Retrabalho/Erro",
    previousAttempts: "Tentativas Anteriores",
    benchmark: "Benchmark",
    institutionalPriority: "Prioridade Institucional",
    aiPotential: "Potencial de IA/Automação",
    technicalOpinion: "Parecer Técnico",
  }

  const formatValue = (key: string, value: any) => {
    if (key === "complexity") {
      return value === "small" ? "Pequena" : "Média/Complexa"
    }
    if (key === "flow") {
      const flowMap: Record<string, string> = {
        interno: "Interno",
        coppe: "COPPE",
        externo: "Externo",
      }
      return flowMap[value] || value
    }
    if (["frequency", "humanDependency", "institutionalPriority"].includes(key)) {
      const mapValues: Record<string, Record<string, string>> = {
        frequency: {
          diario: "Diário",
          semanal: "Semanal",
          mensal: "Mensal",
          eventual: "Eventual",
        },
        humanDependency: {
          alta: "Alta",
          media: "Média",
          baixa: "Baixa",
        },
        institutionalPriority: {
          alta: "Alta",
          media: "Média",
          baixa: "Baixa",
        },
      }
      return mapValues[key]?.[value] || value
    }
    if (key === "aiPotential") {
      const aiMap: Record<string, string> = {
        alto: "Alto",
        medio: "Médio",
        baixo: "Baixo",
      }
      return aiMap[value] || value
    }
    return value
  }

  return (
    <Accordion
      type="multiple"
      defaultValue={[
        "identificacao",
        "diagnostico",
        "dados",
        "historico",
        "avaliacao",
      ]}
      className="space-y-2"
    >
      <AccordionItem value="identificacao">
        <AccordionTrigger>1. Identificação e Triagem</AccordionTrigger>
        <AccordionContent className="space-y-3">
          {["projectName", "sector", "complexity", "flow"].map(key => (
            <div key={key}>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                {labelMap[key]}
              </h4>
              <p className="text-sm text-foreground">
                {formatValue(key, data[key as keyof DiscoveryData])}
              </p>
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="diagnostico">
        <AccordionTrigger>2. Diagnóstico do Problema</AccordionTrigger>
        <AccordionContent className="space-y-3">
          {[
            "problemSummary",
            "userPains",
            "frequency",
            "currentProcess",
            "inactionCost",
          ].map(key => (
            <div key={key}>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                {labelMap[key]}
              </h4>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {formatValue(key, data[key as keyof DiscoveryData])}
              </p>
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="dados">
        <AccordionTrigger>3. Dados para Decisão</AccordionTrigger>
        <AccordionContent className="space-y-3">
          {["volume", "averageTime", "humanDependency", ...(data.reworkRate ? ["reworkRate"] : [])].map(
            key => (
              <div key={key}>
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                  {labelMap[key]}
                </h4>
                <p className="text-sm text-foreground">
                  {formatValue(key, data[key as keyof DiscoveryData])}
                </p>
              </div>
            )
          )}
        </AccordionContent>
      </AccordionItem>

      {data.complexity === "complex" && (
        <AccordionItem value="historico">
          <AccordionTrigger>4. Histórico e Benchmark</AccordionTrigger>
          <AccordionContent className="space-y-3">
            {["previousAttempts", "benchmark"].map(key => (
              <div key={key}>
                <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                  {labelMap[key]}
                </h4>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {data[key as keyof DiscoveryData]}
                </p>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      )}

      <AccordionItem value="avaliacao">
        <AccordionTrigger>5. Avaliação do Analista</AccordionTrigger>
        <AccordionContent className="space-y-3">
          {[
            "institutionalPriority",
            "aiPotential",
            "technicalOpinion",
          ].map(key => (
            <div key={key}>
              <h4 className="text-xs font-semibold text-muted-foreground mb-1">
                {labelMap[key]}
              </h4>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {formatValue(key, data[key as keyof DiscoveryData])}
              </p>
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
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleEditClick = async () => {
    if (!taskData) return
    setIsLoading(true)
    try {
      const updatedPhases = taskData.phases?.map(p =>
        p.id === phase.id ? { ...p, status: "in_progress" } : p
      ) || []

      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phases: updatedPhases }),
      })

      mutate()
      setIsFormOpen(true)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (phase.discoveryData && !isFormOpen) {
    return (
      <div className="space-y-6">
        <DiscoveryDisplay data={phase.discoveryData} />
        <Button
          onClick={handleEditClick}
          variant="outline"
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Carregando...
            </>
          ) : (
            "Editar Discovery"
          )}
        </Button>
      </div>
    )
  }

  if (isFormOpen) {
    return (
      <DiscoveryForm
        phase={phase}
        taskId={taskId}
        initialData={phase.discoveryData}
        taskData={taskData}
        onSave={() => {
          setIsFormOpen(false)
          mutate()
        }}
        onCancel={() => setIsFormOpen(false)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Nenhuma análise de discovery foi criada ainda.
      </p>
      <Button
        onClick={() => setIsFormOpen(true)}
        className="w-full sm:w-auto"
      >
        Criar Discovery
      </Button>
    </div>
  )
}

"use client"

import { useRouter, useParams } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, AlertCircle, Loader2, User, Calendar, Plus, Trash2, Check } from "lucide-react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DiscoveryPhaseTab } from "./discovery-form"

import DesignManager, { Design } from "@/components/design-manager"
const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Phase = {
  id: string
  name: string
  order: number
  enabled: boolean
  status: "not_started" | "in_progress" | "completed"
  completedAt?: string
  notes?: string
  checklist: { id: string; label: string; completed: boolean }[]
  discoveryData?: any
}

type Task = {
  id: string
  taskNumber?: string
  name: string
  project: string
  applicant: string
  priority: string
  status: string
  createdAt: string
  description?: string
  design?: Design[]
  phases?: Phase[]
  flows?: { id: string; name: string }[]
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = priority.toLowerCase()
  if (p === "alta" || p === "high" || p === "urgente" || p === "crítica") {
    return (
      <Badge variant="destructive" className="gap-1">
        {priority}
      </Badge>
    )
  }
  if (p === "média" || p === "media" || p === "normal" || p === "medium") {
    return (
      <Badge className="gap-1 bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
        {priority}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="gap-1 text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30">
      {priority}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  if (s.includes("conclu") || s.includes("done") || s.includes("feito") || s.includes("finaliz")) {
    return (
      <Badge className="gap-1 bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
        {status}
      </Badge>
    )
  }
  if (s.includes("andamento") || s.includes("progress") || s.includes("fazendo") || s.includes("execu")) {
    return (
      <Badge className="gap-1 bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800">
        {status}
      </Badge>
    )
  }
  if (s.includes("bloqueado") || s.includes("blocked") || s.includes("impedido")) {
    return (
      <Badge variant="destructive" className="gap-1">
        {status}
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="gap-1">
      {status}
    </Badge>
  )
}

function PhaseStatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <Badge className="gap-1 bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
        <Check className="h-3 w-3" />
        Concluída
      </Badge>
    )
  }
  if (status === "in_progress") {
    return (
      <Badge className="gap-1 bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800">
        Em Progresso
      </Badge>
    )
  }
  return (
    <Badge variant="outline">
      Não Iniciada
    </Badge>
  )
}

function PhaseTab({ phase, taskId, onPhaseUpdate }: { phase: Phase; taskId: string; onPhaseUpdate: (phases: Phase[]) => void }) {
  const { data: taskData, mutate } = useSWR<Task>(`/api/tasks/${taskId}`, fetcher)
  const [notes, setNotes] = useState(phase.notes || "")
  const [checklist, setChecklist] = useState(phase.checklist || [])
  const [newChecklistItem, setNewChecklistItem] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const updatePhase = async (updates: Partial<Phase>) => {
    if (!taskData) return
    setIsLoading(true)
    try {
      const updatedPhases = taskData.phases?.map(p =>
        p.id === phase.id ? { ...p, ...updates } : p
      ) || []
      
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phases: updatedPhases }),
      })
      
      mutate()
      onPhaseUpdate(updatedPhases)
    } catch (error) {
      console.error("Error updating phase:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartPhase = () => {
    updatePhase({ status: "in_progress" })
  }

  const handleSaveRascunho = () => {
    updatePhase({ notes, checklist, status: "in_progress" })
  }

  const handleCompletePhase = () => {
    updatePhase({
      status: "completed",
      notes,
      checklist,
      completedAt: new Date().toISOString(),
    })
  }

  const handleReopenPhase = () => {
    updatePhase({ status: "in_progress" })
  }

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklist([...checklist, { id: Date.now().toString(), label: newChecklistItem, completed: false }])
      setNewChecklistItem("")
    }
  }

  const toggleChecklistItem = (id: string) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id))
  }

  if (phase.status === "not_started") {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">Esta fase ainda não foi iniciada.</p>
        <Button onClick={handleStartPhase} disabled={isLoading} className="w-full sm:w-auto">
          Iniciar Fase
        </Button>
      </div>
    )
  }

  if (phase.status === "completed") {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold mb-2">Status</h3>
          <PhaseStatusBadge status="completed" />
        </div>
        
        {phase.completedAt && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Data de Conclusão</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(phase.completedAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold mb-2">Notas</h3>
          <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded">
            {phase.notes || "Nenhuma nota registrada."}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-3">Checklist</h3>
          <div className="space-y-2">
            {phase.checklist && phase.checklist.length > 0 ? (
              phase.checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={item.completed} disabled className="rounded" />
                  <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                    {item.label}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum item no checklist.</p>
            )}
          </div>
        </div>

        <Button onClick={handleReopenPhase} variant="outline" disabled={isLoading} className="w-full sm:w-auto">
          Reabrir Fase
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-2">Status</h3>
        <PhaseStatusBadge status="in_progress" />
      </div>

      <div>
        <label className="text-sm font-semibold block mb-2">Notas</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escreva suas notas sobre esta fase..."
          className="w-full min-h-24 p-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3">Checklist</h3>
        <div className="space-y-2 mb-3">
          {checklist.map(item => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => toggleChecklistItem(item.id)}
                className="rounded"
              />
              <span className={item.completed ? "line-through text-muted-foreground flex-1" : "flex-1"}>
                {item.label}
              </span>
              <button
                onClick={() => removeChecklistItem(item.id)}
                className="text-destructive hover:text-destructive/80 p-1"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newChecklistItem}
            onChange={(e) => setNewChecklistItem(e.target.value)}
            placeholder="Novo item..."
            className="flex-1 px-2 py-1 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyPress={(e) => e.key === "Enter" && addChecklistItem()}
          />
          <Button onClick={addChecklistItem} size="sm" variant="outline">
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={handleSaveRascunho} variant="outline" disabled={isLoading} className="flex-1">
          Salvar Rascunho
        </Button>
        <Button onClick={handleCompletePhase} disabled={isLoading} className="flex-1">
          Marcar como Concluída
        </Button>
      </div>
    </div>
  )
}

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [phases, setPhases] = useState<Phase[]>([])

  const { data, isLoading, error, mutate } = useSWR<Task>(
    id ? `/api/tasks/${id}` : null,
    fetcher
  )

  const enabledPhases = (data?.phases || []).filter(p => p.enabled).sort((a, b) => a.order - b.order)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Card className="border-destructive/50">
            <CardContent className="pt-6 flex gap-4">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-destructive mb-1">Tarefa não encontrada</h2>
                <p className="text-sm text-muted-foreground">
                  Não conseguimos localizar a tarefa solicitada. Ela pode ter sido removida ou o ID está incorreto.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            {data.taskNumber && (
              <span className="text-xs font-mono text-muted-foreground mb-1 block">#{data.taskNumber}</span>
            )}
            <h1 className="text-4xl font-bold tracking-tight">{data.name}</h1>
            <div className="h-0.5 w-12 bg-primary rounded-full mt-2" />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="visao-geral" className="space-y-4">
          <TabsList>
            <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
            {enabledPhases.map(phase => (
              <TabsTrigger key={phase.id} value={phase.id}>
                {phase.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="visao-geral" className="space-y-6">
            {/* Info cards row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {data.taskNumber && (
                <Card className="col-span-2 sm:col-span-1">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-muted-foreground mb-1">Identificador</p>
                    <p className="text-sm font-mono font-medium">#{data.taskNumber}</p>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <StatusBadge status={data.status} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">Prioridade</p>
                  <PriorityBadge priority={data.priority} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">Projeto</p>
                  <p className="text-sm font-medium truncate">{data.project || "—"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-1">Solicitante</p>
                  <p className="text-sm font-medium truncate">{data.applicant || "—"}</p>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            {data.description && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Descrição</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{data.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Phases progress */}
            {enabledPhases.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Fases</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {enabledPhases.map((phase) => (
                      <div key={phase.id} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-2 w-2 rounded-full shrink-0 ${
                            phase.status === "completed" ? "bg-emerald-500" :
                            phase.status === "in_progress" ? "bg-sky-500" : "bg-muted-foreground/30"
                          }`} />
                          <span className="text-sm truncate">{phase.name}</span>
                        </div>
                        <PhaseStatusBadge status={phase.status} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Flows */}
            {data.flows && data.flows.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Fluxos Previstos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {data.flows.map((flow: any) => (
                      <Badge key={flow.id} variant="secondary">{flow.name}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Created at */}
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              Criada em {new Date(data.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </TabsContent>

          {/* Phase tabs */}
          {enabledPhases.map(phase => (
            <TabsContent key={phase.id} value={phase.id}>
              <Card>
                <CardContent className="pt-6">
                  {phase.id === "discovery" ? (
                    <DiscoveryPhaseTab
                      phase={phase}
                      taskId={id}
                      onPhaseUpdate={setPhases}
                    />
                  ) : phase.id === "design" ? (
                    <DesignManager
                      taskId={id}
                      taskNumber={data.taskNumber}
                      initialDesigns={data.design || []}
                      onSave={async (designs) => {
                        try {
                          await fetch(`/api/designs?taskId=${id}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ taskId: id, designs }),
                          })
                          mutate()
                        } catch (error) {
                          console.error("Error saving designs:", error)
                        }
                      }}
                    />
                  ) : (
                    <PhaseTab
                      phase={phase}
                      taskId={id}
                      onPhaseUpdate={setPhases}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}

        </Tabs>
      </div>
    </div>
  )
}

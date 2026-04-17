"use client"

import { useRouter, useParams } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, AlertCircle, Loader2, User, Calendar, Plus, Trash2, Check, PlayCircle, CheckCircle2, RotateCcw, Clock, Save } from "lucide-react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DiscoveryPhaseTab } from "./discovery-form"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import DesignManager, { Design } from "@/components/design-manager"
const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Phase = {
  id: string
  name: string
  order: number
  enabled: boolean
  status: "not_started" | "in_progress" | "completed"
  dueDate?: string
  startedAt?: string
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

function fmtDate(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function PhaseDateBar({ phase }: { phase: Phase }) {
  return (
    <div className="flex flex-wrap gap-4 p-3 rounded-lg bg-muted/40 border text-xs mb-6">
      <div className="flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Entrega prevista:</span>
        <span className="font-medium">{phase.dueDate ? fmtDate(phase.dueDate) : "—"}</span>
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
  )
}

function usePhaseActions(phase: Phase, taskId: string, onPhaseUpdate: (phases: Phase[]) => void) {
  const { mutate } = useSWR<Task>(`/api/tasks/${taskId}`, fetcher)
  const [isLoading, setIsLoading] = useState(false)

  const callPhaseAction = async (action: "start" | "complete" | "reopen", extra?: object) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/phases/${phase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      })
      if (!res.ok) throw new Error("Erro ao atualizar fase")
      const { phase: updated } = await res.json()
      mutate(
        (current) => current
          ? { ...current, phases: current.phases?.map(p => p.id === phase.id ? updated : p) }
          : current,
        { revalidate: false }
      )
      onPhaseUpdate([])
    } catch (error) {
      console.error("Error updating phase:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return { isLoading, callPhaseAction }
}

function PhaseStatusHeader({
  phase,
  taskId,
  onPhaseUpdate,
}: {
  phase: Phase
  taskId: string
  onPhaseUpdate: (phases: Phase[]) => void
}) {
  const { isLoading, callPhaseAction } = usePhaseActions(phase, taskId, onPhaseUpdate)

  return (
    <div className="space-y-4 mb-6">
      <PhaseDateBar phase={phase} />
      <div className="flex items-center justify-between">
        <PhaseStatusBadge status={phase.status} />
        <div className="flex gap-2">
          {phase.status === "not_started" && (
            <Button size="sm" disabled={isLoading} onClick={() => callPhaseAction("start")} className="gap-2">
              <PlayCircle className="h-4 w-4" />
              Iniciar Fase
            </Button>
          )}
          {phase.status === "in_progress" && (
            <Button size="sm" disabled={isLoading} onClick={() => callPhaseAction("complete")} className="gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Finalizar Fase
            </Button>
          )}
          {phase.status === "completed" && (
            <Button size="sm" variant="outline" disabled={isLoading} onClick={() => callPhaseAction("reopen")} className="gap-2">
              <RotateCcw className="h-3.5 w-3.5" />
              Reabrir Fase
            </Button>
          )}
        </div>
      </div>
      {phase.status === "not_started" && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed text-sm text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0" />
          Esta fase ainda não foi iniciada.
        </div>
      )}
    </div>
  )
}

function PhaseTab({ phase, taskId, onPhaseUpdate }: { phase: Phase; taskId: string; onPhaseUpdate: (phases: Phase[]) => void }) {
  const { mutate } = useSWR<Task>(`/api/tasks/${taskId}`, fetcher)
  const { isLoading, callPhaseAction } = usePhaseActions(phase, taskId, onPhaseUpdate)
  const [notes, setNotes] = useState(phase.notes || "")
  const [checklist, setChecklist] = useState(phase.checklist || [])
  const [newChecklistItem, setNewChecklistItem] = useState("")

  const handleSaveRascunho = async () => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phases: [{ id: phase.id, notes, checklist }],
          partialPhaseUpdate: true,
        }),
      })
      mutate()
    } catch {
      console.error("Erro ao salvar rascunho")
    }
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

  return (
    <div className="space-y-6">
      <PhaseStatusHeader phase={phase} taskId={taskId} onPhaseUpdate={onPhaseUpdate} />

      {phase.status !== "not_started" && (
        <>
          <div>
            <label className="text-sm font-semibold block mb-2">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escreva suas notas sobre esta fase..."
              className="w-full min-h-24 p-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={phase.status === "completed"}
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
                    onChange={() => phase.status !== "completed" && toggleChecklistItem(item.id)}
                    disabled={phase.status === "completed"}
                    className="rounded"
                  />
                  <span className={item.completed ? "line-through text-muted-foreground flex-1" : "flex-1"}>
                    {item.label}
                  </span>
                  {phase.status !== "completed" && (
                    <button onClick={() => removeChecklistItem(item.id)} className="text-destructive hover:text-destructive/80 p-1">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {phase.status !== "completed" && (
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
            )}
          </div>

          {phase.status !== "completed" && (
            <div className="flex gap-2">
              <Button onClick={handleSaveRascunho} variant="outline" size="sm" disabled={isLoading} className="gap-2">
                <Save className="h-3.5 w-3.5" />
                Salvar Rascunho
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const ALL_PHASES = [
  { id: "discovery", name: "Discovery", order: 1 },
  { id: "design", name: "Design", order: 2 },
  { id: "development", name: "Development", order: 3 },
  { id: "testes", name: "Testes", order: 4 },
]

function PhasesCard({
  allPhases,
  enabledPhases,
  taskId,
  onUpdate,
}: {
  allPhases: Phase[]
  enabledPhases: Phase[]
  taskId: string
  onUpdate: () => void
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [selectedPhaseId, setSelectedPhaseId] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<{ phase?: string; date?: string }>({})

  const disabledPhases = ALL_PHASES.filter(
    p => !allPhases.find(ap => ap.id === p.id && ap.enabled)
  )

  const handleAdd = async () => {
    const newErrors: { phase?: string; date?: string } = {}
    if (!selectedPhaseId) newErrors.phase = "Selecione uma fase"
    if (!dueDate) newErrors.date = "Selecione uma data"
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setIsSaving(true)
    try {
      const phaseTemplate = ALL_PHASES.find(p => p.id === selectedPhaseId)!
      const existing = allPhases.find(p => p.id === selectedPhaseId)

      const updatedPhases = allPhases.map(p =>
        p.id === selectedPhaseId
          ? { ...p, enabled: true, dueDate: dueDate!.toISOString() }
          : p
      )

      // If phase doesn't exist in array yet, add it
      if (!existing) {
        updatedPhases.push({
          ...phaseTemplate,
          enabled: true,
          status: "not_started",
          notes: "",
          checklist: [],
          dueDate: dueDate!.toISOString(),
        })
      }

      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phases: updatedPhases }),
      })

      onUpdate()
      setIsAdding(false)
      setSelectedPhaseId("")
      setDueDate(undefined)
      setErrors({})
    } catch (error) {
      console.error("Error adding phase:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setSelectedPhaseId("")
    setDueDate(undefined)
    setErrors({})
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">Fases</CardTitle>
          {disabledPhases.length > 0 && !isAdding && (
            <Button size="sm" variant="outline" className="gap-1.5 h-7 px-2.5 text-xs" onClick={() => setIsAdding(true)}>
              <Plus className="h-3.5 w-3.5" />
              Adicionar Fase
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-2.5">Fase</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Entrega Prevista</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Data de Início</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5">Data de Conclusão</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {enabledPhases.map((phase) => (
                <tr key={phase.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${
                        phase.status === "completed" ? "bg-emerald-500" :
                        phase.status === "in_progress" ? "bg-sky-500" : "bg-muted-foreground/30"
                      }`} />
                      <span className="font-medium">{phase.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><PhaseStatusBadge status={phase.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(phase.dueDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(phase.startedAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(phase.completedAt)}</td>
                  <td className="px-4 py-3" />
                </tr>
              ))}

              {isAdding && (
                <tr className="bg-muted/20">
                  <td className="px-6 py-3">
                    <div className="space-y-1">
                      <select
                        value={selectedPhaseId}
                        onChange={(e) => { setSelectedPhaseId(e.target.value); setErrors(prev => ({ ...prev, phase: undefined })) }}
                        className="w-full px-2 py-1.5 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Selecionar fase...</option>
                        {disabledPhases.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      {errors.phase && <p className="text-xs text-destructive">{errors.phase}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">Não Iniciada</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="flex items-center gap-2 text-xs border rounded-md px-2.5 py-1.5 w-full text-left hover:bg-muted/50 transition-colors min-w-[130px]"
                          >
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className={dueDate ? "text-foreground" : "text-muted-foreground"}>
                              {dueDate ? format(dueDate, "dd/MM/yyyy", { locale: ptBR }) : "dd/mm/aaaa"}
                            </span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarPicker
                            mode="single"
                            selected={dueDate}
                            onSelect={(d) => { setDueDate(d); setErrors(prev => ({ ...prev, date: undefined })) }}
                            locale={ptBR}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">—</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">—</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" disabled={isSaving} onClick={handleAdd} className="h-7 px-2.5 text-xs gap-1.5">
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSaving} className="h-7 px-2.5 text-xs">
                        Cancelar
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function DesignPhaseTab({
  phase,
  taskId,
  taskNumber,
  initialDesigns,
  onSave,
  onPhaseUpdate,
}: {
  phase: Phase
  taskId: string
  taskNumber?: string
  initialDesigns: any[]
  onSave: (designs: any[]) => Promise<void>
  onPhaseUpdate: (phases: Phase[]) => void
}) {
  const { isLoading, callPhaseAction } = usePhaseActions(phase, taskId, onPhaseUpdate)

  if (phase.status === "not_started") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed">
        <div className="flex-1">
          <p className="text-sm font-medium">Design</p>
          <p className="text-xs text-muted-foreground mt-0.5">Clique em Iniciar para começar o design</p>
        </div>
        <Button onClick={() => callPhaseAction("start")} disabled={isLoading} className="gap-2 shrink-0">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
          Iniciar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-muted/40 border">
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
          {phase.status === "completed" ? (
            <Button size="sm" variant="outline" disabled={isLoading} onClick={() => callPhaseAction("reopen")} className="gap-2">
              <RotateCcw className="h-3.5 w-3.5" />
              Reabrir Design
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" disabled={isLoading} onClick={() => onSave(initialDesigns)} className="gap-2">
                <Save className="h-3.5 w-3.5" />
                Salvar Rascunho
              </Button>
              <Button size="sm" disabled={isLoading} onClick={() => callPhaseAction("complete")} className="gap-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Finalizar Design
              </Button>
            </>
          )}
        </div>
      </div>
      <DesignManager
        taskId={taskId}
        taskNumber={taskNumber}
        initialDesigns={initialDesigns}
        onSave={onSave}
      />
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
            {(enabledPhases.length > 0 || (data.phases || []).some(p => !p.enabled)) && (
              <PhasesCard
                allPhases={data.phases || []}
                enabledPhases={enabledPhases}
                taskId={id}
                onUpdate={() => mutate()}
              />
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
                    <div className="space-y-6">
                      <DiscoveryPhaseTab
                        phase={phase}
                        taskId={id}
                        onPhaseUpdate={setPhases}
                      />
                    </div>
                  ) : phase.id === "design" ? (
                    <DesignPhaseTab
                      phase={phase}
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
                      onPhaseUpdate={setPhases}
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

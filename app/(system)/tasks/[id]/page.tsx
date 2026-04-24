"use client"

import { useRouter, useParams } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, AlertCircle, Loader2, User, Calendar, Plus, Trash2, Check, PlayCircle, CheckCircle2, RotateCcw, Clock, Save, Pencil } from "lucide-react"
import useSWR, { useSWRConfig } from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DiscoveryPhaseTab } from "./discovery-form"
import { PhaseApproval } from "@/components/phase-approval"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import DesignManager, { Design } from "@/components/design-manager"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Phase = {
  id: string
  type?: string
  name: string
  order: number
  enabled: boolean
  status: "not_started" | "in_progress" | "completed" | "approved" | "rejected"
  dueDate?: string
  startedAt?: string
  completedAt?: string
  notes?: string
  checklist: { id: string; label: string; completed: boolean }[]
  designs?: Design[]
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
  if (status === "approved") {
    return (
      <Badge className="gap-1 bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
        <Check className="h-3 w-3" />
        Aprovada
      </Badge>
    )
  }
  if (status === "rejected") {
    return (
      <Badge className="gap-1 bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800">
        Reprovada
      </Badge>
    )
  }
  if (status === "completed") {
    return (
      <Badge className="gap-1 bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800">
        Aguardando Aprovação
      </Badge>
    )
  }
  if (status === "in_progress") {
    return (
      <Badge className="gap-1 bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
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
  const { mutate: mutateGlobal } = useSWRConfig()
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
      const { phase: updated, taskStatus } = await res.json()
      mutate(
        (current) => current
          ? {
              ...current,
              ...(taskStatus && { status: taskStatus }),
              phases: current.phases?.map(p => p.id === phase.id ? updated : p),
            }
          : current,
        { revalidate: false }
      )
      if (action === "start" && taskStatus) {
        mutateGlobal("/api/tasks")
      }
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
          {(phase.status === "approved" || phase.status === "rejected") && (
            <Badge variant="outline" className="text-xs text-muted-foreground">Fase encerrada</Badge>
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
  { id: "diagram", name: "Diagram", order: 3 },
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

  const { data: allApprovals } = useSWR<{ phaseId: string; status: string; createdAt: string }[]>(
    `/api/approvals?taskId=${taskId}`,
    fetcher
  )

  const effectiveStatus = (phase: Phase): Phase["status"] => {
    if (!allApprovals) return phase.status
    const phaseApprovals = allApprovals
      .filter(a => a.phaseId === phase.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const latest = phaseApprovals[0]
    if (!latest) return phase.status
    return latest.status as Phase["status"]
  }

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
              {enabledPhases.map((phase) => {
                const status = effectiveStatus(phase)
                return (
                <tr key={phase.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${
                        status === "approved" ? "bg-emerald-500" :
                        status === "rejected" ? "bg-red-500" :
                        status === "completed" ? "bg-sky-500" :
                        status === "in_progress" ? "bg-amber-500" : "bg-muted-foreground/30"
                      }`} />
                      <span className="font-medium">{phase.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><PhaseStatusBadge status={status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(phase.dueDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(phase.startedAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(phase.completedAt)}</td>
                  <td className="px-4 py-3" />
                </tr>
              )})}

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
  onPhaseUpdate,
}: {
  phase: Phase
  taskId: string
  taskNumber?: string
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
          {(phase.status === "approved" || phase.status === "rejected") ? (
            <Badge variant="outline" className="text-xs text-muted-foreground">Fase encerrada</Badge>
          ) : phase.status === "completed" ? (
            <Button size="sm" variant="outline" disabled={isLoading} onClick={() => callPhaseAction("reopen")} className="gap-2">
              <RotateCcw className="h-3.5 w-3.5" />
              Reabrir Design
            </Button>
          ) : (
            <Button size="sm" disabled={isLoading} onClick={() => callPhaseAction("complete")} className="gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Finalizar Design
            </Button>
          )}
        </div>
      </div>
      <DesignManager
        taskId={taskId}
        subTaskId={phase.id}
        taskNumber={taskNumber}
        initialDesigns={phase.designs ?? []}
      />
    </div>
  )
}

type Option = { id: string; name: string }

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [phases, setPhases] = useState<Phase[]>([])
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [phasesToDelete, setPhasesToDelete] = useState<Set<string>>(new Set())
  const [editForm, setEditForm] = useState<{
    name: string; description: string; project: string; applicant: string; priority: string
  } | null>(null)

  const { data, isLoading, error, mutate } = useSWR<Task>(
    id ? `/api/tasks/${id}` : null,
    fetcher
  )
  const { mutate: mutateGlobalTasks } = useSWRConfig()
  const { data: applicantsData } = useSWR<Option[]>("/api/applicants", fetcher)
  const { data: projectsData } = useSWR<Option[]>("/api/projects", fetcher)
  const applicants = Array.isArray(applicantsData) ? applicantsData.map(a => ({ ...a, name: a.name.toUpperCase() })) : []
  const projects = Array.isArray(projectsData) ? projectsData.map(p => ({ ...p, name: p.name.toUpperCase() })) : []

  const openEdit = () => {
    if (!data) return
    setEditForm({
      name: data.name,
      description: data.description || "",
      project: data.project,
      applicant: data.applicant,
      priority: data.priority,
    })
    setPhasesToDelete(new Set())
    setIsEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editForm) return
    setIsSavingEdit(true)
    try {
      const promises: Promise<any>[] = [
        fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        }),
      ]
      if (phasesToDelete.size > 0) {
        const updatedPhases = (data?.phases || []).map(p =>
          phasesToDelete.has(p.id) ? { ...p, enabled: false } : p
        )
        promises.push(
          fetch(`/api/tasks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phases: updatedPhases }),
          })
        )
      }
      await Promise.all(promises)
      await mutate()
      mutateGlobalTasks("/api/tasks")
      setPhasesToDelete(new Set())
      setIsEditOpen(false)
    } catch (e) {
      console.error("Error saving edit:", e)
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" })
      mutateGlobalTasks("/api/tasks")
      router.push("/tasks")
    } catch (e) {
      console.error("Error deleting task:", e)
      setIsDeleting(false)
    }
  }

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
          <div className="flex items-start justify-between gap-4">
            <div>
              {data.taskNumber && (
                <span className="text-xs font-mono text-muted-foreground mb-1 block">#{data.taskNumber}</span>
              )}
              <h1 className="text-4xl font-bold tracking-tight">{data.name}</h1>
              <div className="h-0.5 w-12 bg-primary rounded-full mt-2" />
            </div>
            <div className="flex items-center gap-1 mt-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={openEdit}
                title="Editar tarefa"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => setIsDeleteOpen(true)}
                title="Excluir tarefa"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Edit Sheet */}
        <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md flex flex-col overflow-y-auto">
            <SheetHeader className="pb-4 border-b">
              <SheetTitle>Editar Tarefa</SheetTitle>
            </SheetHeader>
            {editForm && (
              <div className="flex flex-col gap-5 p-6 flex-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nome</label>
                  <Input
                    value={editForm.name}
                    onChange={e => setEditForm(f => f ? { ...f, name: e.target.value } : f)}
                    placeholder="Nome da tarefa"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Descrição</label>
                  <Textarea
                    value={editForm.description}
                    onChange={e => setEditForm(f => f ? { ...f, description: e.target.value } : f)}
                    placeholder="Descrição da tarefa..."
                    className="min-h-28 resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Projeto</label>
                  <Select value={editForm.project} onValueChange={v => setEditForm(f => f ? { ...f, project: v } : f)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Solicitante</label>
                  <Select value={editForm.applicant} onValueChange={v => setEditForm(f => f ? { ...f, applicant: v } : f)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {applicants.map(a => <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prioridade</label>
                  <div className="flex gap-4">
                    {["Baixa", "Média", "Alta"].map(p => (
                      <label key={p} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="edit-priority"
                          value={p}
                          checked={editForm.priority === p}
                          onChange={() => setEditForm(f => f ? { ...f, priority: p } : f)}
                          className="cursor-pointer"
                        />
                        <span className="text-sm">{p}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* Subtasks list */}
                {enabledPhases.length > 0 && (
                  <div className="space-y-1.5 pt-4 border-t">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subtarefas</label>
                    <div className="divide-y border rounded-lg overflow-hidden">
                      {enabledPhases.map(phase => {
                        const markedForDelete = phasesToDelete.has(phase.id)
                        return (
                          <div key={phase.id} className={`flex items-center justify-between px-3 py-2.5 transition-colors ${markedForDelete ? "bg-destructive/5" : "bg-background hover:bg-muted/40"}`}>
                            <div className="flex items-center gap-2.5">
                              <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${markedForDelete ? "bg-destructive/40" :
                                phase.status === "approved" ? "bg-emerald-500" :
                                phase.status === "rejected" ? "bg-red-500" :
                                phase.status === "completed" ? "bg-sky-500" :
                                phase.status === "in_progress" ? "bg-amber-500" : "bg-muted-foreground/30"
                              }`} />
                              <span className={`text-sm ${markedForDelete ? "line-through text-muted-foreground/50" : ""}`}>
                                {phase.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPhasesToDelete(prev => {
                                const next = new Set(prev)
                                if (next.has(phase.id)) next.delete(phase.id)
                                else next.add(phase.id)
                                return next
                              })}
                              className={`p-1 rounded transition-colors ${markedForDelete
                                ? "text-destructive bg-destructive/10 hover:bg-destructive/20"
                                : "text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                              }`}
                              title={markedForDelete ? `Desfazer remoção de ${phase.name}` : `Remover ${phase.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                    {phasesToDelete.size > 0 && (
                      <p className="text-xs text-muted-foreground/70 pt-0.5">
                        {phasesToDelete.size} subtarefa{phasesToDelete.size > 1 ? "s" : ""} será{phasesToDelete.size > 1 ? "o" : ""} removida{phasesToDelete.size > 1 ? "s" : ""} ao salvar.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-3 mt-auto pt-4 border-t">
                  <Button onClick={handleSaveEdit} disabled={isSavingEdit} className="flex-1 gap-2">
                    {isSavingEdit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSavingEdit} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A tarefa <strong>"{data.name}"</strong> e todos os seus dados serão removidos permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="gap-2">
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
                  {(phase.type === "discovery" || phase.id.startsWith("discovery")) ? (
                    <div className="space-y-6">
                      {(phase.status === "completed" || phase.status === "approved" || phase.status === "rejected") && (
                        <PhaseApproval
                          taskId={id}
                          phaseId={phase.id}
                          onApproved={() => mutate()}
                          onRejected={() => mutate()}
                        />
                      )}
                      <DiscoveryPhaseTab
                        phase={phase}
                        taskId={id}
                        onPhaseUpdate={setPhases}
                      />
                    </div>
                  ) : (phase.type === "design" || phase.id.startsWith("design")) ? (
                    <div className="space-y-6">
                      {(phase.status === "completed" || phase.status === "approved" || phase.status === "rejected") && (
                        <PhaseApproval
                          taskId={id}
                          phaseId={phase.id}
                          onApproved={() => mutate()}
                          onRejected={() => mutate()}
                        />
                      )}
                      <DesignPhaseTab
                        phase={phase}
                        taskId={id}
                        taskNumber={data.taskNumber}
                        onPhaseUpdate={setPhases}
                      />
                    </div>
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

"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Loader2, PlayCircle, Maximize2, Minimize2 } from "lucide-react"
import useSWR from "swr"
import { toast } from "sonner"
import { DiscoveryCanvasForm, type DiscoveryFormValues } from "@/components/discovery/DiscoveryCanvasForm"
import { DiscoveryCanvas } from "@/components/discovery/DiscoveryCanvas"

export type DiscoveryData = DiscoveryFormValues

type FieldMeta     = { userId: string; filledAt: string }
type DiscoveryMeta = Record<string, FieldMeta | null>

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

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function DiscoveryPhaseTab({
  phase,
  taskId,
  onPhaseUpdate,
  discoveryMeta,
  disabled = false,
  onAfterSave,
}: {
  phase: Phase
  taskId: string
  onPhaseUpdate: (phases: Phase[]) => void
  discoveryMeta?: DiscoveryMeta
  disabled?: boolean
  onAfterSave?: () => void
}) {
  const { data: taskData, mutate } = useSWR<Task>(`/api/tasks/${taskId}`, fetcher)
  const [isStarting, setIsStarting] = useState(false)
  const [expanded,   setExpanded]   = useState(false)

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
    } catch (e: any) {
      toast.error(e.message || "Erro ao iniciar fase")
    } finally {
      setIsStarting(false)
    }
  }

  const onSaved = () => { mutate(); onPhaseUpdate([]); onAfterSave?.() }
  const isReadOnly = ["completed", "approved", "rejected", "cancelled"].includes(phase.status)

  if (phase.status === "not_started") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed">
        <div className="flex-1">
          <p className="text-sm font-medium">Discovery</p>
          <p className="text-xs text-muted-foreground mt-0.5">Clique em Iniciar para começar o preenchimento</p>
        </div>
        {!disabled && (
          <Button onClick={handleStart} disabled={isStarting} className="gap-2 shrink-0">
            {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            Iniciar
          </Button>
        )}
      </div>
    )
  }

  const toolbar = (
    <div className="flex items-center justify-end gap-3 mb-3">
      <Link
        href="/discovery/demo"
        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
      >
        Ver exemplo
      </Link>
      <button
        onClick={() => setExpanded(true)}
        title="Expandir canvas"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </div>
  )

  const mainContent = isReadOnly && phase.discoveryData ? (
    <DiscoveryCanvas data={phase.discoveryData} />
  ) : (
    <DiscoveryCanvasForm
      phase={phase}
      taskId={taskId}
      initialData={phase.discoveryData}
      discoveryMeta={discoveryMeta}
      taskData={taskData}
      readOnly={disabled}
      onSaved={onSaved}
    />
  )

  return (
    <>
      {toolbar}
      {mainContent}

      {expanded && (
        <div className="fixed inset-0 z-50 bg-slate-50 overflow-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-900">
                {taskData?.name ?? "Discovery"}
              </span>
              <span className="text-xs text-slate-400">— Canvas de Discovery</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/discovery/demo"
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Ver exemplo
              </Link>
              <button
                onClick={() => setExpanded(false)}
                title="Minimizar"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-6">
            {mainContent}
          </div>
        </div>
      )}
    </>
  )
}

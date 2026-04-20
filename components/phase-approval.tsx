"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, User } from "lucide-react"

type Approval = {
  id: string
  taskId: string
  phaseId: string
  status: "approved" | "rejected"
  comment: string
  approvedBy: string
  createdAt: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function PhaseApproval({
  taskId,
  phaseId,
  onApproved,
  onRejected,
}: {
  taskId: string
  phaseId: string
  onApproved: () => void
  onRejected: () => void
}) {
  const { data: approvals, mutate } = useSWR<Approval[]>(
    `/api/approvals?taskId=${taskId}&phaseId=${phaseId}`,
    fetcher
  )

  const [showHistory, setShowHistory] = useState(false)
  const [action, setAction] = useState<"approve" | "reject" | null>(null)
  const [comment, setComment] = useState("")
  const [commentError, setCommentError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const latestApproval = approvals?.[0]
  const isApproved = latestApproval?.status === "approved"
  const isDecided = latestApproval !== undefined
  const history = approvals || []

  const handleSubmit = async () => {
    if (action === "reject" && !comment.trim()) {
      setCommentError("Justificativa é obrigatória ao reprovar")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          phaseId,
          status: action === "approve" ? "approved" : "rejected",
          comment: comment.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setCommentError(err.error || "Erro ao salvar")
        return
      }

      await mutate()
      setAction(null)
      setComment("")
      setCommentError("")

      if (action === "approve") onApproved()
      else onRejected()
    } catch (error) {
      console.error("Error submitting approval:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Aprovação</h3>
          {isApproved ? (
            <Badge className="gap-1 bg-emerald-100 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3 w-3" />
              Aprovado
            </Badge>
          ) : latestApproval?.status === "rejected" ? (
            <Badge className="gap-1 bg-red-100 text-red-700 border border-red-200">
              <XCircle className="h-3 w-3" />
              Reprovado
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              Aguardando aprovação
            </Badge>
          )}
        </div>

        {history.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Histórico ({history.length})
            {showHistory ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* Latest rejection comment */}
      {latestApproval?.status === "rejected" && latestApproval.comment && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p className="font-medium mb-0.5">Motivo da reprovação:</p>
          <p className="whitespace-pre-wrap">{latestApproval.comment}</p>
          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <User className="h-3 w-3" />
            {latestApproval.approvedBy} · {fmtDateTime(latestApproval.createdAt)}
          </p>
        </div>
      )}

      {/* Approval history */}
      {showHistory && history.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Histórico</p>
          {history.map((item) => (
            <div key={item.id} className="flex gap-3 text-xs">
              <div className="mt-0.5 shrink-0">
                {item.status === "approved"
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  : <XCircle className="h-3.5 w-3.5 text-red-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium">{item.approvedBy}</span>
                  <span className="text-muted-foreground">
                    {item.status === "approved" ? "aprovou" : "reprovou"}
                  </span>
                  <span className="text-muted-foreground">· {fmtDateTime(item.createdAt)}</span>
                </div>
                {item.comment && (
                  <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap">{item.comment}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons — only show if no decision has been made yet */}
      {!isDecided && (
        <>
          {action === null ? (
            <div className="flex gap-2 border-t pt-3">
              <Button
                size="sm"
                onClick={() => setAction("approve")}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAction("reject")}
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reprovar
              </Button>
            </div>
          ) : (
            <div className="space-y-3 border-t pt-3">
              <div>
                <label className="text-xs font-medium block mb-1.5">
                  {action === "reject"
                    ? "Justificativa (obrigatória) *"
                    : "Comentário (opcional)"}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => { setComment(e.target.value); setCommentError("") }}
                  placeholder={
                    action === "reject"
                      ? "Descreva o motivo da reprovação..."
                      : "Algum comentário sobre a aprovação?"
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                {commentError && (
                  <p className="text-xs text-destructive mt-1">{commentError}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className={action === "approve"
                    ? "gap-2 bg-emerald-600 hover:bg-emerald-700"
                    : "gap-2 bg-red-600 hover:bg-red-700"
                  }
                >
                  {action === "approve"
                    ? <><CheckCircle2 className="h-3.5 w-3.5" /> Confirmar Aprovação</>
                    : <><XCircle className="h-3.5 w-3.5" /> Confirmar Reprovação</>
                  }
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => { setAction(null); setComment(""); setCommentError("") }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {isApproved && latestApproval && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t pt-3">
          <User className="h-3 w-3" />
          Aprovado por <span className="font-medium">{latestApproval.approvedBy}</span>
          em {fmtDateTime(latestApproval.createdAt)}
        </div>
      )}
    </div>
  )
}

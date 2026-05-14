"use client"

import { useState } from "react"
import { FileText } from "lucide-react"
import { CanvasCard } from "../primitives/CanvasCard"
import { AddButton, EditActions } from "../primitives/InlineInput"

interface Props { notes: string; onChange: (v: string) => void }

export function NotesBlock({ notes, onChange }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState("")

  const open = () => { setDraft(notes); setEditing(true) }
  const save = () => { onChange(draft); setEditing(false) }
  const cancel = () => setEditing(false)

  return (
    <CanvasCard id="notes" title="Observações" icon={<FileText className="h-3.5 w-3.5" />} span={2}>
      {editing ? (
        <div>
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Escape") cancel() }}
            className="w-full text-[13.5px] leading-relaxed text-slate-900 bg-transparent border border-slate-200 rounded-md p-2 resize-none outline-none focus:border-[var(--canvas-primary)] min-h-[80px]"
          />
          <EditActions onSave={save} onCancel={cancel} />
        </div>
      ) : notes ? (
        <div className="group relative cursor-text" onClick={open}>
          <p className="text-[13.5px] leading-relaxed text-slate-900 whitespace-pre-wrap">{notes}</p>
          <span className="absolute top-0 right-0 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">editar</span>
        </div>
      ) : (
        <AddButton onClick={open} label="Adicionar observação" />
      )}
    </CanvasCard>
  )
}

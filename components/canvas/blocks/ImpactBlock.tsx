"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { CanvasCard } from "../primitives/CanvasCard"
import { TagInput, RemovableItem, AddButton, EditActions } from "../primitives/InlineInput"

type Impact = { description: string; labels: string[] }
interface Props { impact: Impact; onChange: (v: Impact) => void }

export function ImpactBlock({ impact, onChange }: Props) {
  const [editingDesc, setEditingDesc] = useState(false)
  const [draft, setDraft] = useState("")
  const [addingLabel, setAddingLabel] = useState(false)

  const open = () => { setDraft(impact.description); setEditingDesc(true) }
  const save = () => { onChange({ ...impact, description: draft }); setEditingDesc(false) }
  const cancel = () => setEditingDesc(false)

  return (
    <CanvasCard id="impact" title="Impacto Esperado" icon={<Sparkles className="h-3.5 w-3.5" />} span={2}>
      <div className="flex flex-col gap-3">
        {editingDesc ? (
          <div>
            <textarea
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Escape") cancel() }}
              className="w-full text-[13.5px] leading-relaxed text-slate-900 bg-transparent border border-slate-200 rounded-md p-2 resize-none outline-none focus:border-[var(--canvas-primary)] min-h-[60px]"
            />
            <EditActions onSave={save} onCancel={cancel} />
          </div>
        ) : impact.description ? (
          <div className="group relative cursor-text" onClick={open}>
            <p className="text-[13.5px] leading-relaxed text-slate-900">{impact.description}</p>
            <span className="absolute top-0 right-0 text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">editar</span>
          </div>
        ) : (
          <AddButton onClick={open} label="Descrever impacto" />
        )}

        <div className="flex flex-wrap gap-1.5">
          {impact.labels.map((badge, i) => (
            <RemovableItem key={i} onRemove={() => onChange({ ...impact, labels: impact.labels.filter((_, j) => j !== i) })}>
              <span className="inline-flex bg-slate-100 border border-slate-200 text-slate-500 text-[11.5px] rounded-full px-2.5 py-0.5">{badge}</span>
            </RemovableItem>
          ))}
          {addingLabel ? (
            <TagInput
              placeholder="Ex: −40% tempo..."
              autoFocus
              onAdd={v => { onChange({ ...impact, labels: [...impact.labels, v] }); setAddingLabel(false) }}
              onCancel={() => setAddingLabel(false)}
            />
          ) : (
            <AddButton onClick={() => setAddingLabel(true)} label="Adicionar métrica" />
          )}
        </div>
      </div>
    </CanvasCard>
  )
}

"use client"

import { useState } from "react"
import { Package } from "lucide-react"
import { CanvasCard } from "../primitives/CanvasCard"
import { TagInput, RemovableItem, AddButton } from "../primitives/InlineInput"

type Resource = { type: string; description: string[] }
interface Props { resources: Resource[]; onChange: (v: Resource[]) => void }

const DOT_COLORS = ["#1E3A5F", "#1F5F4A", "#7A5B00"]

function ResourceCard({ res, index, onUpdate, onRemove }: { res: Resource; index: number; onUpdate: (r: Resource) => void; onRemove: () => void }) {
  const [addingDesc, setAddingDesc] = useState(false)
  const [editingType, setEditingType] = useState(false)
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col gap-2 group relative">
      <button onClick={onRemove} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 text-xs">✕</button>
      <div className="flex items-center gap-1.5">
        <span className="shrink-0 rounded-full" style={{ width: 6, height: 6, backgroundColor: DOT_COLORS[index % DOT_COLORS.length] }} />
        {editingType ? (
          <input autoFocus defaultValue={res.type} onBlur={e => { onUpdate({ ...res, type: e.target.value }); setEditingType(false) }}
            className="text-[11.5px] font-semibold tracking-wider text-slate-500 uppercase bg-transparent border-b border-slate-300 outline-none w-full" />
        ) : (
          <span className="text-[11.5px] font-semibold tracking-wider text-slate-500 uppercase cursor-text" onClick={() => setEditingType(true)}>{res.type || "Tipo"}</span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        {res.description.map((desc, j) => (
          <RemovableItem key={j} onRemove={() => onUpdate({ ...res, description: res.description.filter((_, k) => k !== j) })}>
            <div className="flex gap-2 items-start">
              <span className="shrink-0 rounded-full bg-slate-400 mt-[7px]" style={{ width: 4, height: 4 }} />
              <span className="text-[12.5px] leading-relaxed text-slate-700">{desc}</span>
            </div>
          </RemovableItem>
        ))}
        {addingDesc ? (
          <TagInput placeholder="Adicionar item..." autoFocus
            onAdd={v => { onUpdate({ ...res, description: [...res.description, v] }); setAddingDesc(false) }}
            onCancel={() => setAddingDesc(false)}
          />
        ) : (
          <AddButton onClick={() => setAddingDesc(true)} label="Adicionar" />
        )}
      </div>
    </div>
  )
}

function NewResourceForm({ onAdd, onCancel }: { onAdd: (r: Resource) => void; onCancel: () => void }) {
  const [type, setType] = useState("")
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col gap-2">
      <input autoFocus value={type} onChange={e => setType(e.target.value)} placeholder="Tipo (ex: Humanos)" className="text-[11.5px] font-semibold tracking-wider uppercase bg-transparent border-b border-slate-300 focus:border-[var(--canvas-primary)] outline-none placeholder:text-slate-400"
        onKeyDown={e => { if (e.key === "Enter" && type.trim()) { onAdd({ type: type.trim(), description: [] }); } if (e.key === "Escape") onCancel() }}
      />
      <div className="flex gap-2 mt-1">
        <button onClick={() => { if (type.trim()) onAdd({ type: type.trim(), description: [] }); else onCancel() }} className="text-[11px] px-2 py-0.5 rounded bg-[var(--canvas-primary)] text-white">Criar</button>
        <button onClick={onCancel} className="text-[11px] px-2 py-0.5 rounded text-slate-500 hover:text-slate-700">Cancelar</button>
      </div>
    </div>
  )
}

export function ResourcesBlock({ resources, onChange }: Props) {
  const [adding, setAdding] = useState(false)
  return (
    <CanvasCard id="resources" title="Recursos Necessários" icon={<Package className="h-3.5 w-3.5" />} span={2}>
      <div className="grid grid-cols-3 gap-3.5">
        {resources.map((res, i) => (
          <ResourceCard key={i} res={res} index={i}
            onUpdate={r => onChange(resources.map((x, j) => j === i ? r : x))}
            onRemove={() => onChange(resources.filter((_, j) => j !== i))}
          />
        ))}
        {adding
          ? <NewResourceForm onAdd={r => { onChange([...resources, r]); setAdding(false) }} onCancel={() => setAdding(false)} />
          : <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-lg p-3.5 flex items-center justify-center">
              <AddButton onClick={() => setAdding(true)} label="Novo recurso" />
            </div>
        }
      </div>
    </CanvasCard>
  )
}

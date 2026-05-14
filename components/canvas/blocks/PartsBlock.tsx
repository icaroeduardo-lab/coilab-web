"use client"

import { useState } from "react"
import { Handshake } from "lucide-react"
import { CanvasCard } from "../primitives/CanvasCard"
import { RemovableItem, AddButton } from "../primitives/InlineInput"

type Part = { name: string; role: string }
interface Props { parts: Part[]; onChange: (v: Part[]) => void }

function PartForm({ onAdd, onCancel }: { onAdd: (p: Part) => void; onCancel: () => void }) {
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const submit = () => { if (name.trim()) { onAdd({ name: name.trim(), role: role.trim() }); } else onCancel() }
  return (
    <div className="flex flex-col gap-1.5 mt-2 p-2 bg-slate-50 rounded-md border border-slate-200">
      <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Nome do parceiro" className="text-[13px] bg-transparent border-b border-slate-300 focus:border-[var(--canvas-primary)] outline-none pb-0.5 placeholder:text-slate-400" />
      <input value={role} onChange={e => setRole(e.target.value)} placeholder="Papel / função" className="text-[13px] bg-transparent border-b border-slate-300 focus:border-[var(--canvas-primary)] outline-none pb-0.5 placeholder:text-slate-400"
        onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel() }}
      />
      <div className="flex gap-2 mt-1">
        <button onClick={submit} className="text-[11px] px-2 py-0.5 rounded bg-[var(--canvas-primary)] text-white">Adicionar</button>
        <button onClick={onCancel} className="text-[11px] px-2 py-0.5 rounded text-slate-500 hover:text-slate-700">Cancelar</button>
      </div>
    </div>
  )
}

export function PartsBlock({ parts, onChange }: Props) {
  const [adding, setAdding] = useState(false)
  return (
    <CanvasCard id="parts" title="Parceiros" icon={<Handshake className="h-3.5 w-3.5" />} span={1}>
      <div className="flex flex-col gap-3">
        {parts.map((part, i) => (
          <RemovableItem key={i} onRemove={() => onChange(parts.filter((_, j) => j !== i))}>
            <div className="flex gap-2.5 items-start">
              <span className="shrink-0 rounded-full mt-[7px]" style={{ width: 6, height: 6, backgroundColor: "var(--canvas-primary)" }} />
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-slate-900">{part.name}</span>
                <span className="text-[11.5px] text-slate-500">{part.role}</span>
              </div>
            </div>
          </RemovableItem>
        ))}
        {adding
          ? <PartForm onAdd={p => { onChange([...parts, p]); setAdding(false) }} onCancel={() => setAdding(false)} />
          : <AddButton onClick={() => setAdding(true)} label="Adicionar parceiro" />
        }
      </div>
    </CanvasCard>
  )
}

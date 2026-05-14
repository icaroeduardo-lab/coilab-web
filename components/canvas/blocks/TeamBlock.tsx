"use client"

import { useState } from "react"
import { UserSquare2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CanvasCard } from "../primitives/CanvasCard"
import { RemovableItem, AddButton } from "../primitives/InlineInput"

type Member = { avatar: string; name: string; role: string; isLead: boolean }
interface Props { team: Member[]; onChange: (v: Member[]) => void }

function MemberForm({ onAdd, onCancel }: { onAdd: (m: Member) => void; onCancel: () => void }) {
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [isLead, setIsLead] = useState(false)
  const submit = () => {
    if (!name.trim()) { onCancel(); return }
    const initials = name.trim().split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    onAdd({ avatar: initials, name: name.trim(), role: role.trim(), isLead })
  }
  return (
    <div className="flex flex-col gap-1.5 mt-1 p-2 bg-slate-50 rounded-md border border-slate-200">
      <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Nome completo"
        className="text-[13px] bg-transparent border-b border-slate-300 focus:border-[var(--canvas-primary)] outline-none pb-0.5 placeholder:text-slate-400" />
      <input value={role} onChange={e => setRole(e.target.value)} placeholder="Papel / função"
        className="text-[13px] bg-transparent border-b border-slate-300 focus:border-[var(--canvas-primary)] outline-none pb-0.5 placeholder:text-slate-400"
        onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel() }}
      />
      <label className="flex items-center gap-1.5 text-[12px] text-slate-600 cursor-pointer">
        <input type="checkbox" checked={isLead} onChange={e => setIsLead(e.target.checked)} className="rounded" />
        Coordenador
      </label>
      <div className="flex gap-2 mt-1">
        <button onClick={submit} className="text-[11px] px-2 py-0.5 rounded bg-[var(--canvas-primary)] text-white">Adicionar</button>
        <button onClick={onCancel} className="text-[11px] px-2 py-0.5 rounded text-slate-500 hover:text-slate-700">Cancelar</button>
      </div>
    </div>
  )
}

export function TeamBlock({ team, onChange }: Props) {
  const [adding, setAdding] = useState(false)
  return (
    <CanvasCard id="team" title="Equipe Responsável" icon={<UserSquare2 className="h-3.5 w-3.5" />} span={1}>
      <div className="flex flex-col gap-3">
        {team.map((member, i) => (
          <RemovableItem key={i} onRemove={() => onChange(team.filter((_, j) => j !== i))}>
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8 ring-1 ring-slate-200 ring-offset-1 shrink-0" aria-label={member.name}>
                <AvatarFallback
                  className="text-[11px] font-semibold"
                  style={member.isLead
                    ? { backgroundColor: "var(--canvas-primary)", color: "#fff" }
                    : { backgroundColor: "#e2e8f0", color: "#1e293b" }}
                >
                  {member.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[13px] ${member.isLead ? "font-semibold" : "font-medium"} text-slate-900 truncate`}>
                    {member.name}
                  </span>
                  {member.isLead && (
                    <span className="text-[10px] font-semibold tracking-wider px-1.5 py-0.5 rounded shrink-0"
                      style={{ backgroundColor: "var(--canvas-primary-soft)", color: "var(--canvas-primary)" }}>
                      COORD.
                    </span>
                  )}
                </div>
                <span className="text-[11.5px] text-slate-500 truncate">{member.role}</span>
              </div>
            </div>
          </RemovableItem>
        ))}
        {adding
          ? <MemberForm onAdd={m => { onChange([...team, m]); setAdding(false) }} onCancel={() => setAdding(false)} />
          : <AddButton onClick={() => setAdding(true)} label="Adicionar membro" />
        }
      </div>
    </CanvasCard>
  )
}

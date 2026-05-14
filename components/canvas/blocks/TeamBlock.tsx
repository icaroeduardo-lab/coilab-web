"use client"

import { useState } from "react"
import { UserSquare2, Search } from "lucide-react"
import useSWR from "swr"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CanvasCard } from "../primitives/CanvasCard"
import { RemovableItem, AddButton } from "../primitives/InlineInput"

type Member = { avatar: string; name: string; imageUrl?: string }
type ApiUser = { id: string; name: string; email: string; imageUrl?: string }

interface Props { team: Member[]; onChange: (v: Member[]) => void }

const fetcher = async (url: string) => {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

function UserSearch({ team, onAdd, onCancel }: { team: Member[]; onAdd: (m: Member) => void; onCancel: () => void }) {
  const [query, setQuery] = useState("")
  const { data: rawUsers } = useSWR<ApiUser[]>("/api/users", fetcher)
  const users = Array.isArray(rawUsers) ? rawUsers : []

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(query.toLowerCase()) &&
    !team.some(m => m.name === u.name)
  )

  return (
    <div className="relative mt-1">
      <div className="flex items-center gap-1.5 border border-slate-200 rounded-md px-2 py-1.5 bg-white focus-within:border-[var(--canvas-primary)]">
        <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar usuário..."
          onKeyDown={e => { if (e.key === "Escape") onCancel() }}
          className="flex-1 text-[13px] bg-transparent outline-none placeholder:text-slate-400"
        />
      </div>
      {query.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-md z-20 max-h-48 overflow-auto">
          {filtered.length === 0 ? (
            <p className="text-[12px] text-slate-500 px-3 py-2">Nenhum usuário encontrado.</p>
          ) : (
            filtered.map(u => (
              <button key={u.id}
                onClick={() => onAdd({ avatar: initials(u.name), name: u.name, imageUrl: u.imageUrl })}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 text-left transition-colors">
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={u.imageUrl} alt={u.name} />
                  <AvatarFallback className="text-[10px] font-semibold bg-slate-200 text-slate-700">
                    {initials(u.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-slate-900 truncate">{u.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
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
              <Avatar className="h-8 w-8 ring-1 ring-slate-200 ring-offset-1 shrink-0">
                <AvatarImage src={member.imageUrl} alt={member.name} />
                <AvatarFallback className="text-[11px] font-semibold"
                  style={{ backgroundColor: "var(--canvas-primary-soft)", color: "var(--canvas-primary)" }}>
                  {member.avatar}
                </AvatarFallback>
              </Avatar>
              <span className="text-[13px] font-medium text-slate-900 truncate">{member.name}</span>
            </div>
          </RemovableItem>
        ))}
        {adding ? (
          <UserSearch team={team} onAdd={m => { onChange([...team, m]); setAdding(false) }} onCancel={() => setAdding(false)} />
        ) : (
          <AddButton onClick={() => setAdding(true)} label="Adicionar membro" />
        )}
      </div>
    </CanvasCard>
  )
}

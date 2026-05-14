"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { CanvasCard } from "../primitives/CanvasCard"
import { AddButton } from "../primitives/InlineInput"

type Risk = { risk: string; mitigation: string }
interface Props { risksAndMitigation: Risk[]; onChange: (v: Risk[]) => void }

function RiskForm({ onAdd, onCancel }: { onAdd: (r: Risk) => void; onCancel: () => void }) {
  const [risk, setRisk] = useState("")
  const [mitigation, setMitigation] = useState("")
  const submit = () => { if (risk.trim()) onAdd({ risk: risk.trim(), mitigation: mitigation.trim() }); else onCancel() }
  return (
    <tr className="bg-slate-50">
      <td className="px-3 py-2 border-r border-slate-200 align-top">
        <input autoFocus value={risk} onChange={e => setRisk(e.target.value)} placeholder="Descrever risco..."
          className="w-full text-[13px] bg-transparent border-b border-slate-300 focus:border-[var(--canvas-primary)] outline-none placeholder:text-slate-400 pb-0.5" />
      </td>
      <td className="px-3 py-2 align-top">
        <input value={mitigation} onChange={e => setMitigation(e.target.value)} placeholder="Como mitigar..."
          className="w-full text-[13px] bg-transparent border-b border-slate-300 focus:border-[var(--canvas-primary)] outline-none placeholder:text-slate-400 pb-0.5"
          onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel() }}
        />
        <div className="flex gap-2 mt-1.5">
          <button onClick={submit} className="text-[10px] px-2 py-0.5 rounded bg-[var(--canvas-primary)] text-white">Adicionar</button>
          <button onClick={onCancel} className="text-[10px] px-2 py-0.5 rounded text-slate-500 hover:text-slate-700">Cancelar</button>
        </div>
      </td>
    </tr>
  )
}

export function RisksBlock({ risksAndMitigation, onChange }: Props) {
  const [adding, setAdding] = useState(false)
  return (
    <CanvasCard id="risks" title="Riscos e Mitigações" icon={<AlertTriangle className="h-3.5 w-3.5" />} span={2}>
      <table className="w-full text-[13px]" aria-label="Riscos e mitigações">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th scope="col" className="text-left px-3 py-2 text-[10.5px] font-semibold tracking-widest text-slate-500 uppercase border-r border-slate-200 w-1/2">Risco</th>
            <th scope="col" className="text-left px-3 py-2 text-[10.5px] font-semibold tracking-widest text-slate-500 uppercase w-1/2">Mitigação</th>
          </tr>
        </thead>
        <tbody>
          {risksAndMitigation.map((row, i) => (
            <tr key={i} className={`group ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
              <td className="px-3 py-2.5 border-r border-slate-200 align-top">
                <span className="text-[#B45309] mr-1.5">●</span>
                <span className="text-slate-900 text-[13px] leading-relaxed">{row.risk}</span>
              </td>
              <td className="px-3 py-2.5 align-top">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[#15803D] mr-1.5">↳</span>
                    <span className="text-slate-900 text-[13px] leading-relaxed">{row.mitigation}</span>
                  </div>
                  <button onClick={() => onChange(risksAndMitigation.filter((_, j) => j !== i))}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 shrink-0 mt-0.5 text-xs">✕</button>
                </div>
              </td>
            </tr>
          ))}
          {adding && <RiskForm onAdd={r => { onChange([...risksAndMitigation, r]); setAdding(false) }} onCancel={() => setAdding(false)} />}
        </tbody>
      </table>
      <div className="px-3 pt-2">
        {!adding && <AddButton onClick={() => setAdding(true)} label="Adicionar risco" />}
      </div>
    </CanvasCard>
  )
}

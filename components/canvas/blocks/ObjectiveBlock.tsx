"use client"

import { useState } from "react"
import { Target } from "lucide-react"
import { CanvasCard } from "../primitives/CanvasCard"
import { TagInput, RemovableItem, AddButton } from "../primitives/InlineInput"

interface Props { objective: string[]; onChange: (v: string[]) => void }

export function ObjectiveBlock({ objective, onChange }: Props) {
  const [adding, setAdding] = useState(false)

  return (
    <CanvasCard id="objective" title="Objetivos" icon={<Target className="h-3.5 w-3.5" />} span={1}>
      <div className="flex flex-col gap-2">
        {objective.map((item, i) => (
          <RemovableItem key={i} onRemove={() => onChange(objective.filter((_, j) => j !== i))}>
            <div className="flex gap-2.5 items-start">
              <span className="shrink-0 rounded-full mt-[7px]" style={{ width: 6, height: 6, backgroundColor: "var(--canvas-primary)" }} />
              <span className="text-[13.5px] leading-relaxed text-slate-900">{item}</span>
            </div>
          </RemovableItem>
        ))}
        {adding ? (
          <TagInput
            placeholder="Descrever objetivo..."
            autoFocus
            onAdd={v => { onChange([...objective, v]); setAdding(false) }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <AddButton onClick={() => setAdding(true)} label="Adicionar objetivo" />
        )}
      </div>
    </CanvasCard>
  )
}

"use client"

import { useState } from "react"
import { BarChart3 } from "lucide-react"
import { CanvasCard } from "../primitives/CanvasCard"
import { TagInput, RemovableItem, AddButton } from "../primitives/InlineInput"

interface Props { indicators: string[]; onChange: (v: string[]) => void }

export function IndicatorsBlock({ indicators, onChange }: Props) {
  const [adding, setAdding] = useState(false)
  return (
    <CanvasCard id="indicators" title="Indicadores (KPIs)" icon={<BarChart3 className="h-3.5 w-3.5" />} span={1}>
      <div className="flex flex-col gap-2">
        {indicators.map((item, i) => (
          <RemovableItem key={i} onRemove={() => onChange(indicators.filter((_, j) => j !== i))}>
            <div className="flex gap-2.5 items-start">
              <span className="shrink-0 rounded-full mt-[7px]" style={{ width: 6, height: 6, backgroundColor: "var(--canvas-primary)" }} />
              <span className="text-[13.5px] leading-relaxed text-slate-900">{item}</span>
            </div>
          </RemovableItem>
        ))}
        {adding ? (
          <TagInput placeholder="Ex: Taxa de conclusão > 85%..." autoFocus
            onAdd={v => { onChange([...indicators, v]); setAdding(false) }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <AddButton onClick={() => setAdding(true)} label="Adicionar indicador" />
        )}
      </div>
    </CanvasCard>
  )
}

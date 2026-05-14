"use client"

import { useState } from "react"
import { Users } from "lucide-react"
import { CanvasCard } from "../primitives/CanvasCard"
import { TagInput, RemovableItem, AddButton } from "../primitives/InlineInput"

interface Props { target: string[]; onChange: (v: string[]) => void }

export function TargetBlock({ target, onChange }: Props) {
  const [adding, setAdding] = useState(false)

  return (
    <CanvasCard id="target" title="Público-alvo" icon={<Users className="h-3.5 w-3.5" />} span={1}>
      <div className="flex flex-wrap gap-1.5">
        {target.map((item, i) => (
          <RemovableItem key={i} onRemove={() => onChange(target.filter((_, j) => j !== i))}>
            <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: "var(--canvas-primary-soft)", color: "var(--canvas-primary)" }}>
              {item}
            </span>
          </RemovableItem>
        ))}
      </div>
      {adding ? (
        <TagInput
          placeholder="Ex: Equipe de TI..."
          autoFocus
          onAdd={v => { onChange([...target, v]); setAdding(false) }}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <AddButton onClick={() => setAdding(true)} label="Adicionar público" />
      )}
    </CanvasCard>
  )
}

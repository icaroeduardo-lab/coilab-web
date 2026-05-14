"use client"

import { useEffect } from "react"
import { Canvas, CanvasTheme } from "./types"
import { ProblemBlock } from "./blocks/ProblemBlock"
import { TargetBlock } from "./blocks/TargetBlock"
import { ObjectiveBlock } from "./blocks/ObjectiveBlock"
import { ImpactBlock } from "./blocks/ImpactBlock"
import { PartsBlock } from "./blocks/PartsBlock"
import { ResourcesBlock } from "./blocks/ResourcesBlock"
import { IndicatorsBlock } from "./blocks/IndicatorsBlock"
import { RisksBlock } from "./blocks/RisksBlock"
import { TeamBlock } from "./blocks/TeamBlock"
import { NotesBlock } from "./blocks/NotesBlock"

interface ProjectCanvasProps {
  canvas: Canvas
  onUpdate: (patch: Partial<Canvas> | ((prev: Canvas) => Canvas)) => void
  saving?: boolean
  theme?: CanvasTheme
}

const THEMES: Record<CanvasTheme, { primary: string; soft: string }> = {
  blue:  { primary: "#1E3A5F", soft: "#EEF2F7" },
  green: { primary: "#1F5F4A", soft: "#E8F1ED" },
}

export function ProjectCanvas({ canvas, onUpdate, saving, theme = "blue" }: ProjectCanvasProps) {
  const colors = THEMES[theme]

  useEffect(() => {
    document.documentElement.style.setProperty("--canvas-primary", colors.primary)
    document.documentElement.style.setProperty("--canvas-primary-soft", colors.soft)
    return () => {
      document.documentElement.style.removeProperty("--canvas-primary")
      document.documentElement.style.removeProperty("--canvas-primary-soft")
    }
  }, [colors.primary, colors.soft])

  return (
    <div className="bg-slate-50 p-4 relative">
      {saving && (
        <div className="absolute top-2 right-4 text-[11px] text-slate-400 animate-pulse">Salvando...</div>
      )}
      <div className="grid grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1 gap-3.5">
        <ProblemBlock problem={canvas.problem} onChange={v => onUpdate({ problem: v })} />
        <TargetBlock target={canvas.target} onChange={v => onUpdate({ target: v })} />

        <ObjectiveBlock objective={canvas.objective} onChange={v => onUpdate({ objective: v })} />
        <ImpactBlock impact={canvas.impact} onChange={v => onUpdate({ impact: v })} />

        <PartsBlock parts={canvas.parts} onChange={v => onUpdate({ parts: v })} />
        <ResourcesBlock resources={canvas.resources} onChange={v => onUpdate({ resources: v })} />

        <IndicatorsBlock indicators={canvas.indicators} onChange={v => onUpdate({ indicators: v })} />
        <RisksBlock risksAndMitigation={canvas.risksAndMitigation} onChange={v => onUpdate({ risksAndMitigation: v })} />

        <TeamBlock team={canvas.team} onChange={v => onUpdate({ team: v })} />
        <NotesBlock notes={canvas.notes} onChange={v => onUpdate({ notes: v })} />
      </div>
    </div>
  )
}

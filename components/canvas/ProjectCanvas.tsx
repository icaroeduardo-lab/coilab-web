"use client"

import { useEffect } from "react"
import { Canvas, CanvasTheme } from "./types"
import { useCanvasEditor } from "./useCanvasEditor"
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
  projectId: string
  initialCanvas?: Canvas | null
  theme?: CanvasTheme
}

const THEMES: Record<CanvasTheme, { primary: string; soft: string }> = {
  blue:  { primary: "#1E3A5F", soft: "#EEF2F7" },
  green: { primary: "#1F5F4A", soft: "#E8F1ED" },
}

export function ProjectCanvas({ projectId, initialCanvas, theme = "blue" }: ProjectCanvasProps) {
  const colors = THEMES[theme]
  const { canvas, update, saving } = useCanvasEditor(projectId, initialCanvas)

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
        {/* Row 1: Problem (2) + Target (1) */}
        <ProblemBlock problem={canvas.problem} onChange={v => update({ problem: v })} />
        <TargetBlock target={canvas.target} onChange={v => update({ target: v })} />

        {/* Row 2: Objective (1) + Impact (2) */}
        <ObjectiveBlock objective={canvas.objective} onChange={v => update({ objective: v })} />
        <ImpactBlock impact={canvas.impact} onChange={v => update({ impact: v })} />

        {/* Row 3: Parts (1) + Resources (2) */}
        <PartsBlock parts={canvas.parts} onChange={v => update({ parts: v })} />
        <ResourcesBlock resources={canvas.resources} onChange={v => update({ resources: v })} />

        {/* Row 4: Indicators (1) + Risks (2) */}
        <IndicatorsBlock indicators={canvas.indicators} onChange={v => update({ indicators: v })} />
        <RisksBlock risksAndMitigation={canvas.risksAndMitigation} onChange={v => update({ risksAndMitigation: v })} />

        {/* Row 5: Team (1) + Notes (2) */}
        <TeamBlock team={canvas.team} onChange={v => update({ team: v })} />
        <NotesBlock notes={canvas.notes} onChange={v => update({ notes: v })} />
      </div>
    </div>
  )
}

import React from "react"

export type MetricTileTone = "primary" | "warn"

const toneStyle: Record<MetricTileTone, React.CSSProperties> = {
  primary: { backgroundColor: "var(--canvas-primary-soft)", color: "var(--canvas-primary)" },
  warn:    { backgroundColor: "rgb(254 243 199)",           color: "rgb(180 83 9)" },
}

interface MetricTileProps {
  label: string
  value: string
  unit: string
  icon: React.ReactNode
  tone: MetricTileTone
}

export function MetricTile({ label, value, unit, icon, tone }: MetricTileProps) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-[10px] p-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center shrink-0"
          style={{ width: 26, height: 26, borderRadius: 7, ...toneStyle[tone] }}
        >
          {icon}
        </div>
        <span className="uppercase text-[11px] font-semibold tracking-wider text-slate-500">{label}</span>
      </div>
      <span className="text-[26px] font-bold tracking-tight leading-[1.1] text-slate-900">{value}</span>
      <span className="text-[11.5px] text-slate-500">{unit}</span>
    </div>
  )
}

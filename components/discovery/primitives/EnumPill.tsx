export type PillTone = "primary" | "warn" | "danger" | "ok" | "neutral"

const toneClass: Record<PillTone, string> = {
  primary: "bg-[var(--canvas-primary-soft)] text-[var(--canvas-primary)]",
  warn:    "bg-amber-100 text-amber-800",
  danger:  "bg-red-100 text-red-700",
  ok:      "bg-green-100 text-green-700",
  neutral: "bg-slate-100 text-slate-600",
}

interface EnumPillProps {
  label: string
  value: string
  tone: PillTone
}

export function EnumPill({ label, value, tone }: EnumPillProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200">
      <span className="uppercase text-[11px] font-semibold tracking-wider text-slate-500">{label}</span>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClass[tone]}`}
        aria-label={`${label}: ${value}`}
      >
        {value}
      </span>
    </div>
  )
}

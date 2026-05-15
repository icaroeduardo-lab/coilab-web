interface NumberedStepsProps {
  text: string
}

export function NumberedSteps({ text }: NumberedStepsProps) {
  const steps = text
    .split(/\n+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.replace(/^\d+\.\s*/, ""))

  return (
    <ol className="space-y-2.5 list-none p-0 m-0">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 items-start">
          <div
            className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold font-mono"
            style={{ backgroundColor: "var(--canvas-primary-soft)", color: "var(--canvas-primary)" }}
          >
            {i + 1}
          </div>
          <span className="text-[13.5px] leading-relaxed text-slate-900">{step}</span>
        </li>
      ))}
    </ol>
  )
}

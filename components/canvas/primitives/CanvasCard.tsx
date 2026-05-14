import React from "react"
import { cn } from "@/lib/utils"

interface CanvasCardProps {
  id: string
  title: string
  icon: React.ReactNode
  span?: 1 | 2 | 3
  headerRight?: React.ReactNode
  children: React.ReactNode
  className?: string
}

// On desktop (3 cols): span as-is
// On tablet max-lg (2 cols): span-1 stays 1, span-2/3 become 2 (full)
// On mobile max-md (1 col): everything becomes 1
const spanClass: Record<1 | 2 | 3, string> = {
  1: "col-span-1",
  2: "col-span-2 max-lg:col-span-2 max-md:col-span-1",
  3: "col-span-3 max-lg:col-span-2 max-md:col-span-1",
}

export function CanvasCard({ id, title, icon, span = 1, headerRight, children, className }: CanvasCardProps) {
  const titleId = `canvas-block-${id}`
  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "bg-white border border-slate-200 rounded-[10px] shadow-sm flex flex-col overflow-hidden",
        spanClass[span],
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              backgroundColor: "var(--canvas-primary-soft)",
              color: "var(--canvas-primary)",
            }}
          >
            {icon}
          </div>
          <h2 id={titleId} className="text-[13px] font-semibold text-slate-900">
            {title}
          </h2>
        </div>
        {headerRight}
      </div>
      <div className="p-4 flex-1">{children}</div>
    </section>
  )
}

import { Skeleton } from "@/components/ui/skeleton"

const BLOCKS: { span: 1 | 2; lines: number }[] = [
  { span: 2, lines: 3 }, // Problem
  { span: 1, lines: 4 }, // Target
  { span: 1, lines: 4 }, // Objective
  { span: 2, lines: 3 }, // Impact
  { span: 1, lines: 3 }, // Parts
  { span: 2, lines: 4 }, // Resources
  { span: 1, lines: 3 }, // Indicators
  { span: 2, lines: 3 }, // Risks
  { span: 1, lines: 3 }, // Team
  { span: 2, lines: 2 }, // Notes
]

const spanClass: Record<1 | 2, string> = {
  1: "col-span-1",
  2: "col-span-2 max-lg:col-span-2 max-md:col-span-1",
}

export function CanvasSkeleton() {
  return (
    <div className="bg-slate-50 p-4">
      <div className="grid grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1 gap-3.5">
        {BLOCKS.map((block, i) => (
          <div
            key={i}
            className={`bg-white border border-slate-200 rounded-[10px] shadow-sm flex flex-col ${spanClass[block.span]}`}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-200">
              <Skeleton className="h-7 w-7 rounded-[7px]" />
              <Skeleton className="h-3.5 w-32" />
            </div>
            {/* Body */}
            <div className="p-4 flex flex-col gap-2.5">
              {Array.from({ length: block.lines }).map((_, j) => (
                <Skeleton key={j} className={`h-3 ${j === block.lines - 1 ? "w-2/3" : "w-full"}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

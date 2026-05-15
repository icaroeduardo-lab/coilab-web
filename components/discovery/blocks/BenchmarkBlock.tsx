import { Compass } from "lucide-react"
import { CanvasCard } from "@/components/canvas/primitives/CanvasCard"

interface Props { benchmark: string }

export function BenchmarkBlock({ benchmark }: Props) {
  return (
    <CanvasCard id="disc-benchmark" title="Benchmark" icon={<Compass className="h-3.5 w-3.5" />} span={1}>
      <p className="text-[13.5px] leading-relaxed text-slate-900">{benchmark}</p>
    </CanvasCard>
  )
}

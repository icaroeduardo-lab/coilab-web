import { Frown } from "lucide-react"
import { CanvasCard } from "@/components/canvas/primitives/CanvasCard"

interface Props { painPoints: string }

export function PainPointsBlock({ painPoints }: Props) {
  return (
    <CanvasCard id="disc-pain" title="Pontos de Dor" icon={<Frown className="h-3.5 w-3.5" />} span={1} accent="danger">
      <p className="text-[13.5px] leading-relaxed text-slate-900">{painPoints}</p>
    </CanvasCard>
  )
}

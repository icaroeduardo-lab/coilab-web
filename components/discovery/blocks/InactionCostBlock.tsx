import { DollarSign } from "lucide-react"
import { CanvasCard } from "@/components/canvas/primitives/CanvasCard"

interface Props { inactionCost: string }

export function InactionCostBlock({ inactionCost }: Props) {
  return (
    <CanvasCard id="disc-inaction" title="Custo da Inação" icon={<DollarSign className="h-3.5 w-3.5" />} span={1} accent="warn">
      <p className="text-[13.5px] leading-relaxed text-slate-900">{inactionCost}</p>
    </CanvasCard>
  )
}

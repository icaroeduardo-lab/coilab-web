import { RotateCcw } from "lucide-react"
import { CanvasCard } from "@/components/canvas/primitives/CanvasCard"

interface Props { rework: string }

export function ReworkBlock({ rework }: Props) {
  return (
    <CanvasCard id="disc-rework" title="Retrabalho / Erro" icon={<RotateCcw className="h-3.5 w-3.5" />} span={1} accent="danger">
      <p className="text-[13.5px] leading-relaxed text-slate-900">{rework}</p>
    </CanvasCard>
  )
}

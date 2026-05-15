import { History } from "lucide-react"
import { CanvasCard } from "@/components/canvas/primitives/CanvasCard"

interface Props { previousAttempts: string }

export function PreviousAttemptsBlock({ previousAttempts }: Props) {
  return (
    <CanvasCard id="disc-prev" title="Tentativas Anteriores" icon={<History className="h-3.5 w-3.5" />} span={1}>
      <p className="text-[13.5px] leading-relaxed text-slate-900">{previousAttempts}</p>
    </CanvasCard>
  )
}

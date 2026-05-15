import { Workflow } from "lucide-react"
import { CanvasCard } from "@/components/canvas/primitives/CanvasCard"
import { NumberedSteps } from "../primitives/NumberedSteps"

interface Props { currentProcess: string }

export function CurrentProcessBlock({ currentProcess }: Props) {
  return (
    <CanvasCard id="disc-process" title="Processo Atual" icon={<Workflow className="h-3.5 w-3.5" />} span={2}>
      <NumberedSteps text={currentProcess} />
    </CanvasCard>
  )
}

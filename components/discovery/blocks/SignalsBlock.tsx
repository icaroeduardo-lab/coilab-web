import { Flag } from "lucide-react"
import { CanvasCard } from "@/components/canvas/primitives/CanvasCard"
import { EnumPill, PillTone } from "../primitives/EnumPill"
import type { Complexity, Level, Frequency } from "../types"

const complexityLabel: Record<Complexity, string> = { Alta: "Média/Complexa", Baixa: "Pequena" }

function complexityTone(v: Complexity): PillTone { return v === "Alta" ? "warn" : "ok" }
function priorityTone(v: Level): PillTone         { return v === "Alta" ? "danger" : v === "Média" ? "warn" : "neutral" }
function dependencyTone(v: Level): PillTone        { return v === "Alta" ? "danger" : v === "Média" ? "warn" : "ok" }

interface Props {
  complexity: Complexity
  institutionalPriority: Level
  frequency: Frequency
  humanDependency: Level
}

export function SignalsBlock({ complexity, institutionalPriority, frequency, humanDependency }: Props) {
  return (
    <CanvasCard id="disc-signals" title="Sinalizadores" icon={<Flag className="h-3.5 w-3.5" />} span={1}>
      <div className="space-y-2">
        <EnumPill label="Complexidade"  value={complexityLabel[complexity]}   tone={complexityTone(complexity)} />
        <EnumPill label="Prioridade"    value={institutionalPriority}         tone={priorityTone(institutionalPriority)} />
        <EnumPill label="Frequência"    value={frequency}                     tone="primary" />
        <EnumPill label="Dep. Humana"   value={humanDependency}               tone={dependencyTone(humanDependency)} />
      </div>
    </CanvasCard>
  )
}

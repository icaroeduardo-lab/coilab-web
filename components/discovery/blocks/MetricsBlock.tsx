import { Gauge, Workflow, Clock } from "lucide-react"
import { CanvasCard } from "@/components/canvas/primitives/CanvasCard"
import { MetricTile } from "../primitives/MetricTile"

interface Props { volume: string; avgTime: string }

export function MetricsBlock({ volume, avgTime }: Props) {
  return (
    <CanvasCard id="disc-metrics" title="Métricas Operacionais" icon={<Gauge className="h-3.5 w-3.5" />} span={2}>
      <div className="grid grid-cols-2 max-md:grid-cols-1 gap-3">
        <MetricTile
          label="Volume"
          value={volume}
          unit="demandas atendidas no período de referência"
          icon={<Workflow className="h-3.5 w-3.5" />}
          tone="primary"
        />
        <MetricTile
          label="Tempo Médio"
          value={avgTime}
          unit="por unidade de trabalho"
          icon={<Clock className="h-3.5 w-3.5" />}
          tone="warn"
        />
      </div>
    </CanvasCard>
  )
}

"use client"

import { useEffect } from "react"
import type { DiscoveryData, DiscoveryFormPayload } from "./types"
import { normalizeDiscoveryForm } from "./types"
import { SummaryBlock }          from "./blocks/SummaryBlock"
import { SignalsBlock }           from "./blocks/SignalsBlock"
import { PainPointsBlock }        from "./blocks/PainPointsBlock"
import { CurrentProcessBlock }    from "./blocks/CurrentProcessBlock"
import { InactionCostBlock }      from "./blocks/InactionCostBlock"
import { MetricsBlock }           from "./blocks/MetricsBlock"
import { ReworkBlock }            from "./blocks/ReworkBlock"
import { PreviousAttemptsBlock }  from "./blocks/PreviousAttemptsBlock"
import { BenchmarkBlock }         from "./blocks/BenchmarkBlock"
import { TechnicalOpinionBlock }  from "./blocks/TechnicalOpinionBlock"

const PRIMARY      = "#1E3A5F"
const PRIMARY_SOFT = "#EEF2F7"

type DiscoveryCanvasProps = {
  evaluatorName?: string
  evaluatorRole?: string
  evaluatorAvatar?: string | null
  evaluatedAt?: string
} & ({ data: DiscoveryData; payload?: never } | { payload: DiscoveryFormPayload; data?: never })

export function DiscoveryCanvas({ data: dataProp, payload, evaluatorName, evaluatorRole, evaluatorAvatar, evaluatedAt }: DiscoveryCanvasProps) {
  useEffect(() => {
    document.documentElement.style.setProperty("--canvas-primary",      PRIMARY)
    document.documentElement.style.setProperty("--canvas-primary-soft", PRIMARY_SOFT)
    return () => {
      document.documentElement.style.removeProperty("--canvas-primary")
      document.documentElement.style.removeProperty("--canvas-primary-soft")
    }
  }, [])

  const data  = dataProp ?? normalizeDiscoveryForm(payload!)
  const isAlta = data.complexity === "Alta"

  const inferredEvaluatedAt = evaluatedAt
    ?? (payload?.form.technicalOpinion?.filledAt)

  return (
    <div className="bg-slate-50 p-4">
      <div className="grid grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1 gap-3.5">
        <SummaryBlock       summary={data.summary} />
        <SignalsBlock
          complexity={data.complexity}
          institutionalPriority={data.institutionalPriority}
          frequency={data.frequency}
          humanDependency={data.humanDependency}
        />
        <PainPointsBlock    painPoints={data.painPoints} />
        <CurrentProcessBlock currentProcess={data.currentProcess} />
        <InactionCostBlock  inactionCost={data.inactionCost} />
        <MetricsBlock       volume={data.volume} avgTime={data.avgTime} />

        {isAlta && data.rework          && <ReworkBlock          rework={data.rework} />}
        {isAlta && data.previousAttempts && <PreviousAttemptsBlock previousAttempts={data.previousAttempts} />}
        {isAlta && data.benchmark       && <BenchmarkBlock        benchmark={data.benchmark} />}

        <TechnicalOpinionBlock
          technicalOpinion={data.technicalOpinion}
          evaluatorName={evaluatorName}
          evaluatorRole={evaluatorRole}
          evaluatorAvatar={evaluatorAvatar}
          evaluatedAt={inferredEvaluatedAt}
        />
      </div>
    </div>
  )
}

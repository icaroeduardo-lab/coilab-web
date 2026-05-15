import { Wand2 } from "lucide-react"
import { CanvasCard } from "@/components/canvas/primitives/CanvasCard"

interface Props {
  technicalOpinion: string
  evaluatorName?: string
  evaluatorRole?: string
  evaluatorAvatar?: string | null
  evaluatedAt?: string
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function TechnicalOpinionBlock({ technicalOpinion, evaluatorName, evaluatorRole, evaluatorAvatar, evaluatedAt }: Props) {
  const headerRight = (
    <span className="bg-[var(--canvas-primary-soft)] text-[var(--canvas-primary)] text-[10.5px] font-mono px-1.5 py-0.5 rounded">
      conclusão do(a) avaliador(a)
    </span>
  )

  return (
    <CanvasCard
      id="disc-opinion"
      title="Parecer Técnico"
      icon={<Wand2 className="h-3.5 w-3.5" />}
      span={3}
      headerRight={headerRight}
    >
      <div className="space-y-4">
        <p className="text-[13.5px] leading-relaxed text-slate-900">{technicalOpinion}</p>

        {evaluatorName && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
            <div
              className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold overflow-hidden"
              style={{ backgroundColor: "var(--canvas-primary-soft)", color: "var(--canvas-primary)" }}
            >
              {evaluatorAvatar ? (
                <img src={evaluatorAvatar} alt={evaluatorName} className="w-full h-full object-cover" />
              ) : (
                getInitials(evaluatorName)
              )}
            </div>
            <span className="text-xs text-slate-500 flex-1">
              Avaliado por <strong className="text-slate-700">{evaluatorName}</strong>
              {evaluatorRole && ` · ${evaluatorRole}`}
            </span>
            {evaluatedAt && (
              <span className="text-[11px] font-mono text-slate-400">{fmtDate(evaluatedAt)}</span>
            )}
          </div>
        )}
      </div>
    </CanvasCard>
  )
}

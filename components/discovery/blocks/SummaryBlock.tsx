import { FileText } from "lucide-react"
import { CanvasCard } from "@/components/canvas/primitives/CanvasCard"

interface Props { summary: string }

export function SummaryBlock({ summary }: Props) {
  return (
    <CanvasCard id="disc-summary" title="Resumo Executivo" icon={<FileText className="h-3.5 w-3.5" />} span={2}>
      <p className="text-[13.5px] leading-relaxed text-slate-900">{summary}</p>
    </CanvasCard>
  )
}

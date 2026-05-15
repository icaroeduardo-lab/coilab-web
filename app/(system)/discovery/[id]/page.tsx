"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DiscoveryCanvas } from "@/components/discovery/DiscoveryCanvas"
import type { DiscoveryData } from "@/components/discovery/types"

const MOCK: DiscoveryData = {
  projectName:           "Sistema de Aprovação de Férias",
  complexity:            "Alta",
  summary:               "RH processa aprovações de férias manualmente por e-mail, gerando atrasos de 3–5 dias úteis, erros de lançamento e insatisfação dos colaboradores.",
  painPoints:            "Demora de 3 a 5 dias para resposta sem visibilidade do status. Erros frequentes de registro na folha de pagamento. Retrabalho manual para correções. Dependência de e-mail para comunicação entre RH, gestor e funcionário.",
  frequency:             "Mensal",
  currentProcess:        "1. Funcionário envia e-mail para o RH solicitando férias\n2. RH verifica calendário e disponibilidade de período\n3. Gestor aprova ou reprova por resposta de e-mail\n4. RH lança manualmente no sistema de ponto\n5. DP confere e ajusta na folha de pagamento",
  inactionCost:          "Impacto direto na folha de pagamento com erros recorrentes. Insatisfação crescente dos colaboradores. Horas extras do time de RH para correções manuais mensais.",
  volume:                "200 sol./mês",
  avgTime:               "45 min",
  humanDependency:       "Alta",
  rework:                "Cerca de 18% das solicitações exigem correção posterior, principalmente por erros de data ou ausência de aprovação do gestor antes do lançamento.",
  previousAttempts:      "Tentou-se uso de formulário Google Forms em 2022, mas sem integração com o sistema de ponto. Planilha compartilhada abandonada por dificuldades de acesso simultâneo.",
  benchmark:             "Empresas como Totvs e Senior oferecem módulos de self-service de férias. Benchmarks internos apontam que organizações similares reduziram o tempo para menos de 24h com workflows automatizados.",
  institutionalPriority: "Alta",
  technicalOpinion:      "Alta automabilidade. Fluxo bem definido e documentado. Integração viável com sistema de ponto via API REST já disponível. Baixo risco técnico. Estimativa de 3 sprints para MVP com self-service completo.",
}

export default function DiscoveryDemoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <div>
          <h1 className="text-sm font-semibold text-slate-900">{MOCK.projectName}</h1>
          <p className="text-xs text-slate-500">Canvas de Discovery · #{id}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => router.back()} className="gap-1.5 text-xs h-7">
          <ArrowLeft className="h-3 w-3" />
          Voltar
        </Button>
      </div>

      <div className="p-6">
        <DiscoveryCanvas
          data={MOCK}
          evaluatorName="Ícaro Albar"
          evaluatorRole="Analista de Automação"
          evaluatedAt={new Date().toISOString()}
        />
      </div>
    </div>
  )
}

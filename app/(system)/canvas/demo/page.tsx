"use client"

import { useState } from "react"
import { ProjectCanvas } from "@/components/canvas/ProjectCanvas"
import { Canvas, CanvasTheme } from "@/components/canvas/types"
import { Button } from "@/components/ui/button"

const MOCK_CANVAS: Canvas = {
  problem:
    "Processos manuais de controle de demandas consomem tempo excessivo das equipes, geram retrabalho por falta de visibilidade e dificultam a priorização estratégica. A ausência de um sistema centralizado cria silos de informação e impede a rastreabilidade do progresso.",

  target: [
    "Equipes de TI",
    "Gestores de Projetos",
    "Diretoria Executiva",
    "Áreas solicitantes",
    "COI / COILAB",
  ],

  objective: [
    "Centralizar o registro e acompanhamento de todas as demandas de automação",
    "Reduzir o tempo de resposta entre solicitação e início da execução",
    "Aumentar a visibilidade do portfólio de projetos para a liderança",
    "Padronizar o processo de discovery e aprovação técnica",
  ],

  impact: {
    description:
      "Espera-se redução de 40% no tempo de gestão de demandas, eliminação de retrabalho por falta de alinhamento e maior capacidade de entrega da equipe de automação ao longo do ano.",
    labels: ["−40% tempo gestão", "Rastreabilidade 100%", "SLA definido", "Menos retrabalho"],
  },

  parts: [
    { name: "Diretoria de Operações", role: "Patrocinadora estratégica" },
    { name: "TI Infraestrutura", role: "Suporte técnico e ambientes" },
    { name: "RH Corporativo", role: "Apoio em mudança organizacional" },
    { name: "Fornecedor de IA", role: "Parceiro tecnológico" },
  ],

  resources: [
    {
      type: "Humanos",
      description: [
        "1 Tech Lead",
        "2 Desenvolvedores Full-stack",
        "1 UX Designer",
        "1 Product Owner",
      ],
    },
    {
      type: "Tecnológicos",
      description: [
        "Next.js + TypeScript",
        "AWS DynamoDB",
        "Vercel (deploy)",
        "Cognito (autenticação)",
      ],
    },
    {
      type: "Financeiros",
      description: [
        "Budget AWS: R$ 2.400/mês",
        "Licenças SaaS: R$ 800/mês",
        "Horas de desenvolvimento: 480h",
      ],
    },
  ],

  risksAndMitigation: [
    {
      risk: "Baixa adoção pelos usuários finais",
      mitigation: "Treinamentos semanais e suporte dedicado nos primeiros 30 dias",
    },
    {
      risk: "Escopo mal definido gerando entregas incompletas",
      mitigation: "Discovery obrigatório antes de qualquer desenvolvimento",
    },
    {
      risk: "Dependência de APIs externas com instabilidade",
      mitigation: "Implementar circuit breakers e fallbacks locais",
    },
    {
      risk: "Custo de infraestrutura acima do previsto",
      mitigation: "Monitoramento de custos semanal com alertas automáticos",
    },
  ],

  indicators: [
    "Tempo médio de discovery: < 5 dias úteis",
    "Taxa de conclusão de tarefas no prazo: > 85%",
    "NPS interno da ferramenta: ≥ 70",
    "Número de demandas em backlog reduzido em 30%",
    "Tempo de onboarding de novos usuários: < 2h",
  ],

  team: [
    { avatar: "IA", name: "Ícaro Albar", role: "Product Owner & Dev Lead", isLead: true },
    { avatar: "MS", name: "Mariana Silva", role: "UX / UI Designer", isLead: false },
    { avatar: "RC", name: "Rafael Costa", role: "Full-stack Developer", isLead: false },
    { avatar: "LF", name: "Lara Fonseca", role: "QA & Automação", isLead: false },
  ],

  notes:
    "Este canvas é um documento vivo e deve ser revisado a cada sprint. Alterações de escopo devem ser aprovadas pelo Product Owner e comunicadas à diretoria patrocinadora antes da implementação. Reuniões de alinhamento quinzenais estão previstas no calendário do projeto.",
}

export default function CanvasDemoPage() {
  const [theme, setTheme] = useState<CanvasTheme>("blue")

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <div>
          <h1 className="text-sm font-semibold text-slate-900">Canvas Demo</h1>
          <p className="text-xs text-slate-500">Rota de visualização — /canvas/demo</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={theme === "blue" ? "default" : "outline"}
            onClick={() => setTheme("blue")}
            className="text-xs h-7"
          >
            Azul
          </Button>
          <Button
            size="sm"
            variant={theme === "green" ? "default" : "outline"}
            onClick={() => setTheme("green")}
            className="text-xs h-7"
          >
            Verde
          </Button>
        </div>
      </div>
      <div className="p-6">
        <ProjectCanvas projectId="demo" initialCanvas={MOCK_CANVAS} theme={theme} />
      </div>
    </div>
  )
}

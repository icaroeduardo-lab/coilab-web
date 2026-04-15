"use client"

import { useMemo } from "react"
import Link from "next/link"
import useSWR from "swr"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  CheckCircle2,
  CircleDot,
  ListTodo,
  ArrowUp,
  ArrowDown,
  Minus,
  FolderOpen,
  LayoutDashboard,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Task = {
  id: string
  name: string
  project: string
  applicant: string
  priority: string
  status: string
  createdAt: string
  description?: string
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = priority.toLowerCase()
  if (p === "alta" || p === "high" || p === "urgente" || p === "crítica") {
    return (
      <Badge variant="destructive" className="gap-1">
        <ArrowUp />
        {priority}
      </Badge>
    )
  }
  if (p === "média" || p === "media" || p === "normal" || p === "medium") {
    return (
      <Badge className="gap-1 bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
        <Minus />
        {priority}
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="gap-1 text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30"
    >
      <ArrowDown />
      {priority}
    </Badge>
  )
}

function StatCard({
  label,
  value,
  icon,
  accentClass = "border-l-primary/60",
  valueClass = "text-foreground",
}: {
  label: string
  value: number
  icon: React.ReactNode
  accentClass?: string
  valueClass?: string
}) {
  return (
    <Card className={`border-l-4 ${accentClass}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <span className="text-muted-foreground/60">{icon}</span>
        </div>
        <p className={`text-4xl font-bold tabular-nums tracking-tight ${valueClass}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

function DistributionBar({
  label,
  count,
  total,
  barClass,
}: {
  label: string
  count: number
  total: number
  barClass: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {count}{" "}
          <span className="text-xs opacity-70">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function statusBarClass(status: string) {
  const s = status.toLowerCase()
  if (s.includes("conclu") || s.includes("done") || s.includes("finaliz"))
    return "bg-emerald-500"
  if (s.includes("andamento") || s.includes("progress") || s.includes("execu"))
    return "bg-sky-500"
  if (s.includes("bloqueado") || s.includes("blocked")) return "bg-red-400"
  return "bg-primary/50"
}

function priorityBarClass(priority: string) {
  const p = priority.toLowerCase()
  if (p === "alta" || p === "high" || p === "urgente") return "bg-red-400"
  if (p === "média" || p === "media" || p === "normal") return "bg-amber-400"
  if (p === "baixa" || p === "low") return "bg-emerald-400"
  return "bg-muted-foreground/40"
}

export default function DashboardPage() {
  const { data: tasks = [] } = useSWR<Task[]>("/api/tasks", fetcher)

  const stats = useMemo(() => {
    const total = tasks.length

    const byStatus: Record<string, number> = {}
    const byPriority: Record<string, number> = {}

    for (const task of tasks) {
      const s = task.status || "Sem Status"
      byStatus[s] = (byStatus[s] || 0) + 1
      const p = task.priority || "Sem Prioridade"
      byPriority[p] = (byPriority[p] || 0) + 1
    }

    const done = tasks.filter(
      (t) =>
        t.status.toLowerCase().includes("conclu") ||
        t.status.toLowerCase().includes("done") ||
        t.status.toLowerCase().includes("finaliz")
    ).length

    const inProgress = tasks.filter(
      (t) =>
        t.status.toLowerCase().includes("andamento") ||
        t.status.toLowerCase().includes("progress") ||
        t.status.toLowerCase().includes("execu")
    ).length

    const highPriority = tasks.filter(
      (t) =>
        t.priority.toLowerCase() === "alta" ||
        t.priority.toLowerCase() === "urgente" ||
        t.priority.toLowerCase() === "high"
    ).length

    const recent = [...tasks]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 6)

    return { total, byStatus, byPriority, done, inProgress, highPriority, recent }
  }, [tasks])

  const currentHour = new Date().getHours()
  const greeting =
    currentHour < 12 ? "Bom dia" : currentHour < 18 ? "Boa tarde" : "Boa noite"

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-6 py-3 flex items-center gap-6">
        <span className="font-bold text-primary tracking-tight text-lg select-none">
          COILAB
        </span>
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-primary/10 text-primary"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/tasks"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ListTodo className="h-4 w-4" />
            Tarefas
          </Link>
          <Link
            href="/projects"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <FolderOpen className="h-4 w-4" />
            Projetos
          </Link>
        </div>
      </nav>

      <div className="p-8 flex flex-col gap-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1 capitalize">{today}</p>
            <h1 className="text-4xl font-bold tracking-tight">{greeting}!</h1>
            <div className="h-0.5 w-12 bg-primary rounded-full mt-2" />
          </div>
          <p className="text-sm text-muted-foreground">
            {stats.total} tarefa{stats.total !== 1 ? "s" : ""} cadastrada
            {stats.total !== 1 ? "s" : ""}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total de Tarefas"
            value={stats.total}
            icon={<ListTodo className="h-4 w-4" />}
            accentClass="border-l-primary"
          />
          <StatCard
            label="Em Andamento"
            value={stats.inProgress}
            icon={<CircleDot className="h-4 w-4 text-sky-500" />}
            accentClass="border-l-sky-500"
            valueClass="text-sky-600 dark:text-sky-400"
          />
          <StatCard
            label="Concluídas"
            value={stats.done}
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            accentClass="border-l-emerald-500"
            valueClass="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            label="Alta Prioridade"
            value={stats.highPriority}
            icon={<ArrowUp className="h-4 w-4 text-red-500" />}
            accentClass="border-l-red-500"
            valueClass="text-red-600 dark:text-red-400"
          />
        </div>

        {/* Distribution Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Distribuição por Status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {Object.keys(stats.byStatus).length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados disponíveis.</p>
              ) : (
                Object.entries(stats.byStatus)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => (
                    <DistributionBar
                      key={status}
                      label={status}
                      count={count}
                      total={stats.total}
                      barClass={statusBarClass(status)}
                    />
                  ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Por Prioridade
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {Object.keys(stats.byPriority).length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados disponíveis.</p>
              ) : (
                Object.entries(stats.byPriority)
                  .sort((a, b) => b[1] - a[1])
                  .map(([priority, count]) => (
                    <DistributionBar
                      key={priority}
                      label={priority}
                      count={count}
                      total={stats.total}
                      barClass={priorityBarClass(priority)}
                    />
                  ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Tasks */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tarefas Recentes
            </CardTitle>
            <Link href="/tasks" className="text-xs text-primary hover:underline">
              Ver todas →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 py-4">
                Nenhuma tarefa cadastrada.
              </p>
            ) : (
              <div className="divide-y">
                {stats.recent.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium truncate">{task.name}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {task.project}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <PriorityBadge priority={task.priority} />
                      <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                        {formatDistanceToNow(new Date(task.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

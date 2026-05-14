"use client"

import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import Link from "next/link"
import {
  ArrowLeft, Calendar, Hash, AlertCircle,
  Loader2, ClipboardList, Eye, LayoutTemplate,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ProjectCanvas } from "@/components/canvas/ProjectCanvas"
import type { Canvas } from "@/components/canvas/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Project = {
  id: string
  projectNumber?: string
  name: string
  description?: string
  status: string
  createdAt: string
  canvas?: Canvas
}

type Task = {
  id: string
  taskNumber?: string
  name: string
  status: string
  priority: string
  applicant: string
  createdAt: string
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = priority?.toLowerCase()
  if (p === "alta" || p === "urgente")
    return <Badge variant="destructive">{priority}</Badge>
  if (p === "média" || p === "media")
    return (
      <Badge className="bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
        {priority}
      </Badge>
    )
  return <Badge variant="secondary">{priority}</Badge>
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase()
  if (s === "concluído" || s === "concluido")
    return <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400">{status}</Badge>
  if (s === "em andamento" || s === "design" || s === "development")
    return <Badge className="bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-950/30 dark:text-sky-400">{status}</Badge>
  return <Badge variant="outline">{status}</Badge>
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: project, error: projectError, isLoading } = useSWR<Project>(
    `/api/projects/${id}`,
    fetcher
  )

  const { data: tasks = [], isLoading: tasksLoading } = useSWR<Task[]>(
    id ? `/api/tasks/project/${id}` : null,
    fetcher
  )

  if (isLoading) {
    return (
      <div className="px-6 py-8 space-y-8">
        <Skeleton className="h-8 w-20" />
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-72" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-3/4 max-w-xl" />
          <Skeleton className="h-4 w-1/2 max-w-lg" />
        </div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
          <div className="space-y-2 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-2">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (projectError || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">Projeto não encontrado.</p>
        <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header fixo */}
      <div className="px-8 pt-8 pb-6 space-y-4 border-b bg-background">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0 flex-1">
            {project.projectNumber && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                <Hash className="h-3 w-3" />
                {project.projectNumber}
              </div>
            )}
            <h1 className="text-3xl font-bold tracking-tight uppercase">{project.name}</h1>
            <div className="h-0.5 w-12 bg-primary rounded-full mt-2" />
          </div>
          <Badge variant="secondary" className="shrink-0 mt-1">{project.status}</Badge>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          Criado em {new Date(project.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit", month: "long", year: "numeric",
          })}
        </div>

        {project.description && (
          <p className="text-sm leading-relaxed text-muted-foreground max-w-4xl">
            {project.description}
          </p>
        )}
      </div>

      {/* Tabs + conteúdo scrollável */}
      <Tabs defaultValue="canvas" className="flex-1 flex flex-col min-h-0">
        <div className="px-8 pt-4 border-b bg-background">
          <TabsList className="bg-muted/40 border border-border/50 p-0.5 h-9">
            <TabsTrigger value="canvas" className="gap-2 px-4">
              <LayoutTemplate className="h-3.5 w-3.5" />
              Canvas
            </TabsTrigger>
            <TabsTrigger value="tarefas" className="gap-2 px-4">
              <ClipboardList className="h-3.5 w-3.5" />
              Tarefas
              {tasks.length > 0 && (
                <span className="ml-1 text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded-full">
                  {tasks.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Canvas */}
        <TabsContent value="canvas" className="flex-1 min-h-0 overflow-auto m-0">
          <ProjectCanvas projectId={id} initialCanvas={project.canvas} />
        </TabsContent>

        {/* Tarefas */}
        <TabsContent value="tarefas" className="flex-1 min-h-0 overflow-auto m-0 p-8">
          {tasksLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : tasks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <ClipboardList className="h-8 w-8 opacity-30" />
                <p className="text-sm">Nenhuma tarefa vinculada a este projeto.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 max-w-4xl">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 border rounded-lg bg-card hover:border-primary/40 hover:bg-muted/30 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {task.taskNumber && (
                      <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                        {task.taskNumber}
                      </span>
                    )}
                    <span className="text-sm font-medium truncate">{task.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={task.priority} />
                    <StatusBadge status={task.status} />
                    <Link
                      href={`/tasks/${task.id}`}
                      className="p-1.5 hover:bg-primary/10 rounded text-primary transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

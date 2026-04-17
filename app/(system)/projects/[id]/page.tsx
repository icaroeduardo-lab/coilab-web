"use client"

import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Link from "next/link"
import {
  ArrowLeft, FileText, Calendar, Hash, AlertCircle,
  Loader2, BookOpen, ClipboardList, Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const fetcher = (url: string) => fetch(url).then((r) => r.json())
const textFetcher = (url: string) =>
  fetch(url).then((r) => (r.ok ? r.text() : null))

type Project = {
  id: string
  projectNumber?: string
  name: string
  description?: string
  documentPath?: string
  status: string
  createdAt: string
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

  const { data: markdown, isLoading: markdownLoading } = useSWR<string | null>(
    project?.documentPath ? `/api/projects/${id}/document` : null,
    textFetcher
  )

  const { data: tasks = [], isLoading: tasksLoading } = useSWR<Task[]>(
    project?.name ? `/api/tasks?project=${encodeURIComponent(project.name)}` : null,
    fetcher
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
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

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Criado em {new Date(project.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "long", year: "numeric",
            })}
          </span>
          {project.documentPath && (
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Documentação anexada
            </span>
          )}
        </div>

        {project.description && (
          <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl">
            {project.description}
          </p>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="documentacao">
        <TabsList>
          <TabsTrigger value="documentacao" className="gap-2">
            <BookOpen className="h-3.5 w-3.5" />
            Documentação
          </TabsTrigger>
          <TabsTrigger value="tarefas" className="gap-2">
            <ClipboardList className="h-3.5 w-3.5" />
            Tarefas
            {tasks.length > 0 && (
              <span className="ml-1 text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded-full">
                {tasks.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Documentação */}
        <TabsContent value="documentacao" className="mt-6">
          {project.documentPath ? (
            <div className="space-y-0">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border rounded-t-lg border-b-0">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Documentação do Projeto
                </span>
              </div>
              <Card className="rounded-t-none border-t-0 shadow-none">
                <CardContent className="p-6 md:p-8">
                  {markdownLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : !markdown ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                      <FileText className="h-8 w-8 opacity-40" />
                      <p className="text-sm">Não foi possível carregar o documento.</p>
                    </div>
                  ) : (
                    <div className="markdown-body">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <FileText className="h-8 w-8 opacity-30" />
                <p className="text-sm">Nenhum documento anexado a este projeto.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tarefas */}
        <TabsContent value="tarefas" className="mt-6">
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
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 border rounded-lg bg-card hover:border-primary/40 hover:bg-muted/30 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {task.taskNumber && (
                      <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                        #{task.taskNumber}
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

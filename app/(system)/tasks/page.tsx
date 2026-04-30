"use client"

import { useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Plus,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Clock,
  CircleDot,
  CircleCheck,
  CircleX,
  CalendarDays,
  User,
  CalendarIcon,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ColumnDef } from "@tanstack/react-table"
import useSWR, { useSWRConfig } from "swr"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Badge
} from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const formSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  applicant: z.string().min(1, {
    message: "O departamento que solicitou é obrigatório.",
  }),
  project: z.string().min(2, {
    message: "O projeto é obrigatório.",
  }),
  priority: z.string().min(2, {
    message: "A prioridade é obrigatória.",
  }),
  description: z.string().min(2, {
    message: "A tarefa deve ter uma descrição obrigatória.",
  }),
  phases: z.array(z.string()),
  flows: z.array(z.string()).optional(),
})

const editSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  applicant: z.string().min(1, { message: "O departamento que solicitou é obrigatório." }),
  project: z.string().min(2, { message: "O projeto é obrigatório." }),
  priority: z.string().min(2, { message: "A prioridade é obrigatória." }),
  description: z.string().min(2, { message: "A tarefa deve ter uma descrição obrigatória." }),
})

type Phase = {
  id: string
  name: string
  order: number
  enabled: boolean
  status: "not_started" | "in_progress" | "completed"
  completedAt?: string
  notes?: string
  checklist: { id: string, label: string, completed: boolean }[]
}

type Task = {
  id: string
  taskNumber?: string
  name: string
  project: string
  applicant: string
  priority: string
  status: string
  createdAt: string
  description?: string
  hasRejection?: boolean
  phases?: { id: string; status: string; enabled: boolean; name: string }[]
}

type Option = {
  id: string
  name: string
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
    <Badge variant="outline" className="gap-1 text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30">
      <ArrowDown />
      {priority}
    </Badge>
  )
}

const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  { id: "Backlog",         name: "Backlog",         accent: "border-t-muted-foreground/40", description: "Aguardando início" },
  { id: "Em Execução",      name: "Em Execução",      accent: "border-t-sky-400",             description: "Discovery e Design em andamento" },
  { id: "Checkout",        name: "Checkout",        accent: "border-t-amber-400",           description: "Aprovado, aguardando desenvolvimento" },
  { id: "Desenvolvimento", name: "Desenvolvimento", accent: "border-t-orange-400",          description: "Com equipe de desenvolvimento", externalTeam: true },
  { id: "Testes",          name: "Testes",          accent: "border-t-blue-400",            description: "Validação e QA" },
  { id: "Concluído",       name: "Concluído",       accent: "border-t-emerald-400",         description: "Finalizado" },
]

type KanbanColumnConfig = {
  id: string
  name: string
  accent: string
  description: string
  externalTeam?: boolean
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  if (s === "concluído" || s === "concluido") {
    return (
      <Badge className="gap-1 bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
        <CircleCheck />
        {status}
      </Badge>
    )
  }
  if (s === "desenvolvimento") {
    return (
      <Badge className="gap-1 bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800">
        <CircleDot />
        {status}
      </Badge>
    )
  }
  if (s === "testes") {
    return (
      <Badge className="gap-1 bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800">
        <CircleDot />
        {status}
      </Badge>
    )
  }
  if (s === "em análise" || s === "em analise") {
    return (
      <Badge className="gap-1 bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800">
        <CircleDot />
        {status}
      </Badge>
    )
  }
  if (s === "checkout") {
    return (
      <Badge className="gap-1 bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
        <Clock />
        {status}
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Clock />
      {status}
    </Badge>
  )
}

function TaskCard({
  task,
  onEdit,
  onDelete,
}: {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}) {
  const isRejected = task.hasRejection && task.status === "Em Execução"
  const rejectedPhases = isRejected
    ? (task.phases || []).filter(p => p.enabled && p.status === "rejected").map(p => p.name)
    : []

  return (
    <div className="relative group/card">
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity flex gap-0.5">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(task) }}
          className="h-6 w-6 flex items-center justify-center rounded bg-background/90 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors shadow-sm"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(task) }}
          className="h-6 w-6 flex items-center justify-center rounded bg-background/90 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors shadow-sm"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <Link href={`/tasks/${task.id}`}>
        <Card
          style={{
            borderTopWidth: "2px",
            borderTopStyle: "solid",
            borderTopColor: isRejected ? "rgb(248 113 113)" : "rgb(203 213 225)",
          }}
          className="group transition-shadow duration-150 cursor-pointer hover:[box-shadow:0_-2px_8px_0_rgb(0_0_0/0.08),0_4px_8px_0_rgb(0_0_0/0.08)]"
        >
          <CardHeader className="p-4 pb-2 pr-10">
            {task.taskNumber && (
              <span className="text-[10px] font-mono text-muted-foreground/70 mb-0.5">#{task.taskNumber}</span>
            )}
            <CardTitle className="text-sm font-bold">{task.name}</CardTitle>
            <CardDescription className="text-xs">{task.project}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs">
            <div className="flex flex-col gap-1">
              {isRejected && (
                <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded px-2 py-1 mb-1">
                  <CircleX className="h-3 w-3 shrink-0" />
                  <span className="text-[11px]">Reprovado: {rejectedPhases.join(", ")}</span>
                </div>
              )}
              <p className="line-clamp-3 text-muted-foreground mb-2">{task.description}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                <PriorityBadge priority={task.priority} />
                <Badge variant="outline" className="gap-1">
                  <User />
                  {task.applicant}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t pt-2">
                <span>Criado em:</span>
                <span>{new Date(task.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}

function priorityRank(priority: string): number {
  const p = priority.toLowerCase()
  if (p === "alta" || p === "high" || p === "urgente" || p === "crítica") return 0
  if (p === "média" || p === "media" || p === "normal" || p === "medium") return 1
  return 2
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const rankDiff = priorityRank(a.priority) - priorityRank(b.priority)
    if (rankDiff !== 0) return rankDiff
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}

function KanbanColumn({
  column,
  tasks,
  onEdit,
  onDelete,
}: {
  column: KanbanColumnConfig
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}) {
  return (
    <div className={`flex flex-col gap-4 bg-muted/50 p-4 rounded-xl min-w-72 w-full border-t-2 ${column.accent}`}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{column.name}</h3>
          {column.externalTeam && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground border-dashed">
              Equipe Dev
            </Badge>
          )}
        </div>
        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
          {tasks.length}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground/70 px-1 -mt-2">{column.description}</p>
      <div className="flex flex-col gap-3 min-h-50">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}

export default function Page() {
  const { mutate } = useSWRConfig()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: tasksData, isLoading: tasksLoading } = useSWR<Task[]>("/api/tasks", fetcher)

  const { data: applicantsData } = useSWR<Option[]>("/api/applicants", fetcher)
  const { data: projectsData } = useSWR<Option[]>("/api/projects", fetcher)
  const { data: flowsData } = useSWR<Option[]>("/api/flows", fetcher)

  const tasks = Array.isArray(tasksData) ? tasksData : []

  const applicants = Array.isArray(applicantsData) ? applicantsData.map(a => ({ ...a, name: a.name.toUpperCase() })).filter((a, i, arr) => arr.findIndex(x => x.name === a.name) === i) : []
  const projects = Array.isArray(projectsData) ? projectsData.map(p => ({ ...p, name: p.name.toUpperCase() })).filter((p, i, arr) => arr.findIndex(x => x.name === p.name) === i) : []
  const flows = Array.isArray(flowsData) ? flowsData.map(f => ({ ...f, name: f.name.toUpperCase() })).filter((f, i, arr) => arr.findIndex(x => x.name === f.name) === i) : []
  const DEFAULT_PHASES = [
    { id: "discovery", name: "Discovery" },
    { id: "design", name: "Design" },
    { id: "diagram", name: "Diagram" },
  ]
  const phases = DEFAULT_PHASES

  const [phaseDates, setPhaseDates] = useState<Record<string, Date | undefined>>({})

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      project: "",
      applicant: "",
      phases: [],
      priority: "Baixa",
      description: "",
      flows: [],
    },
  })

  const editForm = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: "",
      project: "",
      applicant: "",
      priority: "Baixa",
      description: "",
    },
  })

  function handleDialogOpenChange(open: boolean) {
    setIsCreateDialogOpen(open)
    if (!open) {
      form.reset()
      setPhaseDates({})
    }
  }

  function handleEditOpen(task: Task) {
    editForm.reset({
      name: task.name,
      project: task.project,
      applicant: task.applicant,
      priority: task.priority,
      description: task.description ?? "",
    })
    setEditingTask(task)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const missingDates = values.phases.filter((id) => !phaseDates[id])
    if (missingDates.length > 0) {
      form.setError("phases", {
        message: "Todas as fases selecionadas precisam ter uma data de entrega.",
      })
      return
    }

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          phaseDueDates: Object.fromEntries(
            Object.entries(phaseDates)
              .filter(([, date]) => date !== undefined)
              .map(([id, date]) => [id, (date as Date).toISOString()])
          ),
        }),
      })

      setIsCreateDialogOpen(false)

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || body.message || "Erro ao salvar a tarefa")
      }

      form.reset()
      setPhaseDates({})
      toast.success("Tarefa criada com sucesso")
      mutate("/api/tasks")
    } catch (error: any) {
      console.error("Erro no formulário:", error)
      setIsCreateDialogOpen(false)
      toast.error(error.message || "Ocorreu um erro ao criar a tarefa. Tente novamente.")
    }
  }

  async function onEditSubmit(values: z.infer<typeof editSchema>) {
    if (!editingTask) return
    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      setEditingTask(null)

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || body.message || "Erro ao atualizar a tarefa")
      }

      toast.success("Tarefa atualizada")
      mutate("/api/tasks")
    } catch (error: any) {
      toast.error(error.message || "Ocorreu um erro ao atualizar a tarefa.")
    }
  }

  async function handleDelete() {
    if (!deletingTask) return
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/tasks/${deletingTask.id}`, { method: "DELETE" })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || body.message || "Erro ao excluir a tarefa")
      }
      toast.success("Tarefa excluída")
      mutate("/api/tasks")
    } catch (error: any) {
      toast.error(error.message || "Ocorreu um erro ao excluir a tarefa.")
    } finally {
      setIsDeleting(false)
      setDeletingTask(null)
    }
  }

  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "taskNumber",
      header: "Nº",
      cell: ({ row }) => (
        <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
          {row.getValue("taskNumber") ? `#${row.getValue("taskNumber")}` : "—"}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <Link
          href={`/tasks/${row.original.id}`}
          className="font-medium text-sm text-primary hover:underline"
        >
          {row.getValue("name")}
        </Link>
      ),
    },
    {
      accessorKey: "project",
      header: "Projeto",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.getValue("project")}</span>
      ),
    },
    {
      accessorKey: "applicant",
      header: "Solicitante",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm">{row.getValue("applicant")}</span>
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: "Prioridade",
      cell: ({ row }) => <PriorityBadge priority={row.getValue("priority")} />,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "createdAt",
      header: "Criado em",
      cell: ({ row }) => {
        const date = new Date(row.getValue("createdAt"))
        return (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            {date.toLocaleDateString("pt-BR")}
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditOpen(row.original)}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeletingTask(row.original)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tarefas</h1>
          <div className="h-0.5 w-8 bg-primary rounded-full mt-1.5" />
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button size={"lg"} className="px-5 gap-2">
              <Plus className="h-4 w-4" />
              Nova tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Informações Básicas */}
                  <div className="border-b pb-4">
                    <h3 className="text-sm font-semibold mb-4 text-muted-foreground">Informações Básicas</h3>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome da Tarefa *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Digite o nome da tarefa" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="project"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Projeto *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {projects.map((project) => (
                                    <SelectItem key={project.id} value={project.name}>
                                      {project.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="applicant"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Solicitante *</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {applicants.map((applicant) => (
                                    <SelectItem key={applicant.id} value={applicant.name}>
                                      {applicant.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prioridade *</FormLabel>
                              <FormControl>
                                <div className="flex gap-4 pt-1">
                                  <div className="flex items-center space-x-1.5">
                                    <input
                                      type="radio"
                                      id="priority-baixa"
                                      value="Baixa"
                                      checked={field.value === "Baixa"}
                                      onChange={field.onChange}
                                      className="cursor-pointer"
                                    />
                                    <Label htmlFor="priority-baixa" className="font-normal cursor-pointer text-sm">Baixa</Label>
                                  </div>
                                  <div className="flex items-center space-x-1.5">
                                    <input
                                      type="radio"
                                      id="priority-media"
                                      value="Média"
                                      checked={field.value === "Média"}
                                      onChange={field.onChange}
                                      className="cursor-pointer"
                                    />
                                    <Label htmlFor="priority-media" className="font-normal cursor-pointer text-sm">Média</Label>
                                  </div>
                                  <div className="flex items-center space-x-1.5">
                                    <input
                                      type="radio"
                                      id="priority-alta"
                                      value="Alta"
                                      checked={field.value === "Alta"}
                                      onChange={field.onChange}
                                      className="cursor-pointer"
                                    />
                                    <Label htmlFor="priority-alta" className="font-normal cursor-pointer text-sm">Alta</Label>
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="border-b pb-4">
                    <h3 className="text-sm font-semibold mb-4 text-muted-foreground">Detalhes</h3>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição *</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Descreva a tarefa em detalhes..."
                              className="min-h-24"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Configurações */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground">Configurações</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Fases */}
                      <FormField
                        control={form.control}
                        name="phases"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fases da Tarefa</FormLabel>
                            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                              {phases.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhuma fase disponível</p>
                              ) : (
                                phases.map((phase) => {
                                  const isChecked = field.value.includes(phase.id)
                                  return (
                                    <div key={phase.id} className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded transition-colors">
                                      <label className="flex items-center gap-3 text-sm cursor-pointer flex-1">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) => {
                                            const updated = e.target.checked
                                              ? [...field.value, phase.id]
                                              : field.value.filter((id: string) => id !== phase.id)
                                            field.onChange(updated)
                                            if (!e.target.checked) {
                                              setPhaseDates((prev) => {
                                                const next = { ...prev }
                                                delete next[phase.id]
                                                return next
                                              })
                                            }
                                          }}
                                          className="rounded border-gray-300 cursor-pointer"
                                        />
                                        <span className="font-medium">{phase.name}</span>
                                      </label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <button
                                            type="button"
                                            disabled={!isChecked}
                                            className="flex items-center gap-1.5 text-xs border rounded-md px-2 py-1 text-left transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:bg-muted"
                                          >
                                            <CalendarIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                                            <span className={phaseDates[phase.id] ? "text-foreground" : "text-muted-foreground"}>
                                              {phaseDates[phase.id]
                                                ? format(phaseDates[phase.id] as Date, "dd/MM/yyyy", { locale: ptBR })
                                                : "dd/mm/aaaa"}
                                            </span>
                                          </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="end">
                                          <Calendar
                                            mode="single"
                                            selected={phaseDates[phase.id]}
                                            onSelect={(date) =>
                                              setPhaseDates((prev) => ({ ...prev, [phase.id]: date }))
                                            }
                                            locale={ptBR}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                  )
                                })
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Fluxos */}
                      <FormField
                        control={form.control}
                        name="flows"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fluxo Previsto</FormLabel>
                            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                              {flows.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhum fluxo disponível</p>
                              ) : (
                                flows.map((flow) => (
                                  <label key={flow.id} className="flex items-center gap-3 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={field.value?.includes(flow.id) || false}
                                      onChange={(e) => {
                                        const updated = e.target.checked
                                          ? [...(field.value || []), flow.id]
                                          : (field.value || []).filter((id: string) => id !== flow.id)
                                        field.onChange(updated)
                                      }}
                                      className="rounded border-gray-300 cursor-pointer"
                                    />
                                    <span className="font-medium">{flow.name}</span>
                                  </label>
                                ))
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button type="submit" className="flex-1" size="lg">
                      Salvar Tarefa
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDialogOpenChange(false)}
                      className="flex-1"
                      size="lg"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban" className="pt-4">
          <div className="flex gap-4 overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-full">
              {KANBAN_COLUMNS.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={sortTasks(tasks.filter(
                    (t) => t.status.toLowerCase() === column.id.toLowerCase()
                  ))}
                  onEdit={handleEditOpen}
                  onDelete={setDeletingTask}
                />
              ))}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="list" className="pt-4">
          <div className="flex-1">
            {tasksLoading ? (
              <div className="flex h-24 items-center justify-center">Carregando...</div>
            ) : (
              <DataTable columns={columns} data={tasks} />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Tarefa *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nome da tarefa" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="project"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Projeto *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.name}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="applicant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Solicitante *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {applicants.map((applicant) => (
                              <SelectItem key={applicant.id} value={applicant.name}>
                                {applicant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade *</FormLabel>
                      <FormControl>
                        <div className="flex gap-4 pt-1">
                          {["Baixa", "Média", "Alta"].map((p) => (
                            <div key={p} className="flex items-center space-x-1.5">
                              <input
                                type="radio"
                                id={`edit-priority-${p}`}
                                value={p}
                                checked={field.value === p}
                                onChange={field.onChange}
                                className="cursor-pointer"
                              />
                              <Label htmlFor={`edit-priority-${p}`} className="font-normal cursor-pointer text-sm">{p}</Label>
                            </div>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Descrição da tarefa..." className="min-h-24" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-3 pt-4 border-t">
                  <Button type="submit" className="flex-1" size="lg" disabled={editForm.formState.isSubmitting}>
                    {editForm.formState.isSubmitting ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingTask(null)}
                    className="flex-1"
                    size="lg"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTask} onOpenChange={(open) => !open && setDeletingTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              A tarefa <strong>&ldquo;{deletingTask?.name}&rdquo;</strong> será excluída permanentemente.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

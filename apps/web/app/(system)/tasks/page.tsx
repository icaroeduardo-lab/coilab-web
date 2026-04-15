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
  Eye,
} from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import useSWR, { useSWRConfig } from "swr"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import {
  Badge
} from "@workspace/ui/components/badge"
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
})

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

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  if (s.includes("conclu") || s.includes("done") || s.includes("feito") || s.includes("finaliz")) {
    return (
      <Badge className="gap-1 bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
        <CircleCheck />
        {status}
      </Badge>
    )
  }
  if (s.includes("andamento") || s.includes("progress") || s.includes("fazendo") || s.includes("execu")) {
    return (
      <Badge className="gap-1 bg-sky-100 text-sky-700 border border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800">
        <CircleDot />
        {status}
      </Badge>
    )
  }
  if (s.includes("bloqueado") || s.includes("blocked") || s.includes("impedido")) {
    return (
      <Badge variant="destructive" className="gap-1">
        <CircleX />
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

const columns: ColumnDef<Task>[] = [
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
]

function SortableTaskCard({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-30 min-h-30 items-center flex justify-center border-2 border-dashed border-primary/40 rounded-xl bg-primary/5"
      />
    )
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing group relative hover:border-primary/60 hover:shadow-sm transition-all duration-150"
    >
      <Link
        href={`/tasks/${task.id}`}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1.5 hover:bg-primary/10 rounded text-primary shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <Eye className="h-4 w-4" />
      </Link>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-bold">{task.name}</CardTitle>
        <CardDescription className="text-xs">{task.project}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-xs">
        <div className="flex flex-col gap-1">
          <p className="line-clamp-3 text-muted-foreground mb-2">
            {task.description}
          </p>
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
  )
}

function KanbanColumn({
  status,
  tasks,
}: {
  status: Option
  tasks: Task[]
}) {
  const { setNodeRef } = useSortable({
    id: status.id,
    data: {
      type: "Column",
      status,
    },
  })

  return (
    <div className="flex flex-col gap-4 bg-muted/50 p-4 rounded-xl min-w-75 w-full border-t-2 border-t-primary/30">
      <div className="flex items-center justify-between px-2">
        <h3 className="font-semibold text-sm">{status.name}</h3>
        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
          {tasks.length}
        </span>
      </div>
      <div ref={setNodeRef} className="flex flex-col gap-3 min-h-50">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

export default function Page() {
  const { mutate } = useSWRConfig()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | null
    message: string
  } | null>(null)
  
  const { data: tasksData, isLoading: tasksLoading } = useSWR<Task[]>("/api/tasks", fetcher)
  const { data: statusesData } = useSWR<Option[]>("/api/status", fetcher)
  const { data: applicantsData } = useSWR<Option[]>("/api/applicants", fetcher)

  const tasks = Array.isArray(tasksData) ? tasksData : []
  const statuses = Array.isArray(statusesData) ? statusesData : []
  const applicants = Array.isArray(applicantsData) ? applicantsData : []

  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      project: "",
      applicant: "",
      priority: "",
      description: "",
    },
  })

  async function updateTaskStatus(taskId: string, newStatus: string) {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Falha ao atualizar status")
      }

      // Revalidate tasks
      mutate("/api/tasks")
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      mutate("/api/tasks") // Sync on error
    }
  }

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task)
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveATask = active.data.current?.type === "Task"
    const isOverATask = over.data.current?.type === "Task"
    const isOverAColumn = over.data.current?.type === "Column"

    if (!isActiveATask) return

    // Visual reordering in local cache for smoother experience
    if (isActiveATask && (isOverATask || isOverAColumn)) {
        mutate("/api/tasks", (currentTasks: Task[] | undefined) => {
            if (!currentTasks) return []
            const activeIndex = currentTasks.findIndex((t) => t.id === activeId)
            
            if (activeIndex === -1) return currentTasks

            const targetStatus = isOverAColumn 
                ? over.data.current?.status.name 
                : over.data.current?.task.status

            const updatedTasks = [...currentTasks]
            const taskToUpdate = updatedTasks[activeIndex]

            if (taskToUpdate && taskToUpdate.status !== targetStatus) {
                updatedTasks[activeIndex] = { ...taskToUpdate, status: targetStatus }
            }

            if (isOverATask) {
                const overIndex = updatedTasks.findIndex((t) => t.id === overId)
                return arrayMove(updatedTasks, activeIndex, overIndex)
            }
            
            return updatedTasks
        }, false)
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    const currentActiveTask = activeTask || active.data.current?.task

    if (!over || !currentActiveTask) {
      setActiveTask(null)
      return
    }

    const taskId = active.id.toString()
    const overData = over.data.current
    let newStatus = ""

    if (overData?.type === "Column") {
      newStatus = overData.status.name
    } else if (overData?.type === "Task") {
      newStatus = overData.task.status
    }

    if (newStatus && currentActiveTask.status.toLowerCase() !== newStatus.toLowerCase()) {
      updateTaskStatus(taskId, newStatus)
    }

    setActiveTask(null)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      setIsCreateDialogOpen(false)

      if (!response.ok) {
        throw new Error("Erro ao salvar a tarefa")
      }

      form.reset()
      setFeedback({ type: "success", message: "Tarefa criada com sucesso" })
      mutate("/api/tasks")
    } catch (error) {
      console.error("Erro no formulário:", error)
      setIsCreateDialogOpen(false)
      setFeedback({
        type: "error",
        message: "Ocorreu um erro ao criar a tarefa. Tente novamente.",
      })
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tarefas</h1>
          <div className="h-0.5 w-8 bg-primary rounded-full mt-1.5" />
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size={"lg"} className="px-5 gap-2">
              <Plus className="h-4 w-4" />
              Nova tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="project"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Projeto</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="applicant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Solicitante</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um solicitante" />
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
                        <FormLabel>Prioridade</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Salvar
                  </Button>
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
            >
              <div className="flex gap-4 min-w-full">
                {statuses.map((status) => (
                  <KanbanColumn
                    key={status.id}
                    status={status}
                    tasks={tasks.filter(
                      (t) => t.status.toLowerCase() === status.name.toLowerCase()
                    )}
                  />
                ))}
              </div>
              <DragOverlay>
                {activeTask ? <SortableTaskCard task={activeTask} /> : null}
              </DragOverlay>
            </DndContext>
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

      <Dialog open={!!feedback} onOpenChange={(open) => !open && setFeedback(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {feedback?.type === "success" ? "Sucesso" : "Erro"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center">
            {feedback?.type === "success" ? (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            ) : (
              <AlertCircle className="h-12 w-12 text-destructive" />
            )}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">
                {feedback?.type === "success" ? "Sucesso!" : "Erro"}
              </h2>
              <p className="text-muted-foreground">{feedback?.message}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="mt-4"
              onClick={() => setFeedback(null)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

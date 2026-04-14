"use client"

import { useState, useEffect, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Plus, CheckCircle2, AlertCircle, GripVertical } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
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
  defaultDropAnimationSideEffects,
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
import { DataTable } from "@/components/data-table"

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

type StatusOption = {
  id: string
  name: string
}

const columns: ColumnDef<Task>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "project",
    header: "Projeto",
  },
  {
    accessorKey: "applicant",
    header: "Solicitante",
  },
  {
    accessorKey: "priority",
    header: "Prioridade",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "createdAt",
    header: "Criado em",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      return date.toLocaleDateString("pt-BR")
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
        className="opacity-30 h-[120px] min-h-[120px] items-center flex justify-center border-2 border-dashed border-primary rounded-xl"
      />
    )
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-grab active:cursor-grabbing group relative"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1 hover:bg-muted rounded text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-bold">{task.name}</CardTitle>
        <CardDescription className="text-xs">{task.project}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 text-xs">
        <div className="flex flex-col gap-1">
          <p className="line-clamp-2 text-muted-foreground">{task.description}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-[10px]">
              {task.priority}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {task.applicant}
            </span>
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
  status: StatusOption
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
    <div className="flex flex-col gap-4 bg-muted/50 p-4 rounded-xl min-w-[300px] w-full">
      <div className="flex items-center justify-between px-2">
        <h3 className="font-semibold text-sm">{status.name}</h3>
        <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
          {tasks.length}
        </span>
      </div>
      <div ref={setNodeRef} className="flex flex-col gap-3 min-h-[200px]">
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [statuses, setStatuses] = useState<StatusOption[]>([])
  const [loading, setLoading] = useState(true)
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

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/tasks")
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStatuses = useCallback(async () => {
    try {
      const response = await fetch("/api/status")
      if (response.ok) {
        const data = await response.json()
        setStatuses(data)
      }
    } catch (error) {
      console.error("Erro ao buscar status:", error)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchStatuses()
  }, [fetchTasks, fetchStatuses])

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
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      fetchTasks() // Rollback on error
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

    // Dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId)
        const overIndex = tasks.findIndex((t) => t.id === overId)

        if (tasks[activeIndex].status !== tasks[overIndex].status) {
          tasks[activeIndex].status = tasks[overIndex].status
          return arrayMove(tasks, activeIndex, overIndex - 1)
        }

        return arrayMove(tasks, activeIndex, overIndex)
      })
    }

    // Dropping a Task over a Column
    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId)
        tasks[activeIndex].status = overId.toString()
        return arrayMove(tasks, activeIndex, activeIndex)
      })
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) {
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

    if (newStatus && active.data.current?.task.status !== newStatus) {
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
      fetchTasks()
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
        <h1 className="text-3xl font-bold">Tarefas</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size={"lg"} className="px-4">
              <Plus />
              Novo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                            {statuses.map((status) => (
                              <SelectItem key={status.id} value={status.name}>
                                {status.name}
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
                    tasks={tasks.filter((t) => t.status === status.name)}
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
            {loading ? (
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

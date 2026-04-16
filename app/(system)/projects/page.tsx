"use client"

import { useState, useEffect, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Plus, CheckCircle2, AlertCircle } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { DataTable } from "@/components/data-table"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  applicant: z.string().min(2, {
    message: "O departamento que solicitou é obrigatório.",
  }),
  priority: z.string().min(2, {
    message: "A prioridade é obrigatória.",
  }),
  description: z.string().min(2, {
    message: "O projeto deve ter uma descrição obrigatória.",
  }),
})

type Project = {
  id: string
  name: string
  applicant: string
  priority: string
  status: string
  createdAt: string
}

const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: "Nome",
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

export default function Page() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Erro ao buscar projetos:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      applicant: "",
      priority: "",
      description: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      setIsCreateDialogOpen(false)

      if (!response.ok) {
        throw new Error("Erro ao salvar o projeto")
      }

      const data = await response.json()
      console.log("Projeto salvo:", data)
      form.reset()
      setFeedback({ type: "success", message: "Projeto criado com sucesso" })
      fetchProjects()
    } catch (error) {
      console.error("Erro no formulário:", error)
      setIsCreateDialogOpen(false)
      setFeedback({
        type: "error",
        message: "Ocorreu um erro ao criar o projeto. Tente novamente.",
      })
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projetos</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size={"lg"} className="px-4">
              <Plus />
              Novo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Projeto</DialogTitle>
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
                    name="applicant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Solicitante</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
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

      <div className="flex-1">
        {loading ? (
          <div className="flex h-24 items-center justify-center">Carregando...</div>
        ) : (
          <DataTable columns={columns} data={projects} />
        )}
      </div>

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

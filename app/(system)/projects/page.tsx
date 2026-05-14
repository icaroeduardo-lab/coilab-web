"use client"

import { useState, useEffect, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Plus, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  description: z.string().min(2, {
    message: "O projeto deve ter uma descrição.",
  }),
})

type Project = {
  id: string
  projectNumber?: string
  name: string
  description?: string
  status: string
  createdAt: string
}

const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "projectNumber",
    header: "Nº",
    cell: ({ row }) => (
      <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
        {row.getValue("projectNumber") ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => (
      <Link
        href={`/projects/${row.original.id}`}
        className="font-medium text-sm uppercase text-primary hover:underline"
      >
        {row.getValue("name")}
      </Link>
    ),
  },
  {
    accessorKey: "description",
    header: "Descrição",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground line-clamp-2">
        {row.getValue("description") || "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.getValue("status")}</Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Criado em",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      return (
        <span className="text-sm text-muted-foreground">
          {date.toLocaleDateString("pt-BR")}
        </span>
      )
    },
  },
]

export default function Page() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/projects")
      if (response.ok) setProjects(await response.json())
    } catch (error) {
      console.error("Erro ao buscar projetos:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "" },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error("Erro ao salvar o projeto")

      setIsCreateDialogOpen(false)
      form.reset()
      setFeedback({ type: "success", message: "Projeto criado com sucesso" })
      fetchProjects()
    } catch (error: any) {
      setIsCreateDialogOpen(false)
      setFeedback({ type: "error", message: error.message || "Ocorreu um erro ao criar o projeto. Tente novamente." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 h-screen overflow-hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projetos</h1>
        {loading ? <Skeleton className="h-10 w-24 rounded-lg" /> : null}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          {!loading && (
            <DialogTrigger asChild>
              <Button size="lg" className="px-4">
                <Plus />
                Novo
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Projeto</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Projeto *</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite o nome do projeto" {...field} />
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
                        <FormLabel>Descrição *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva o projeto em detalhes..."
                            className="min-h-24 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-3 pt-2">
                    <Button type="submit" className="flex-1" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? "Salvando..." : "Criar Projeto"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
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

      <div className="flex-1 min-h-0 overflow-auto w-full">
        {loading ? (
          <div className="rounded-xl border overflow-hidden">
            <div className="flex items-center gap-4 px-4 py-3 bg-muted/40 border-b">
              <Skeleton className="h-3 w-8 shrink-0" />
              <Skeleton className="h-3 flex-[2]" />
              <Skeleton className="h-3 flex-[3]" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 flex-1" />
            </div>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
                <Skeleton className="h-3 w-8 shrink-0" />
                <Skeleton className="h-3 flex-[2]" />
                <Skeleton className="h-3 flex-[3]" />
                <Skeleton className="h-5 flex-1 rounded-full" />
                <Skeleton className="h-3 flex-1" />
              </div>
            ))}
          </div>
        ) : (
          <DataTable columns={columns} data={projects} />
        )}
      </div>

      <Dialog open={!!feedback} onOpenChange={(open) => !open && setFeedback(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>{feedback?.type === "success" ? "Sucesso" : "Erro"}</DialogTitle>
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
            <Button type="button" variant="secondary" onClick={() => setFeedback(null)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

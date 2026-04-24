"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Plus, CheckCircle2, AlertCircle, FileText, Upload, X } from "lucide-react"
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
  documentPath?: string
  status: string
  createdAt: string
}

const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "projectNumber",
    header: "Nº",
    cell: ({ row }) => (
      <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
        {row.getValue("projectNumber") ? `#${row.getValue("projectNumber")}` : "—"}
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
  const [feedback, setFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      description: "",
    },
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith(".md")) {
      setFeedback({ type: "error", message: "Apenas arquivos .md (Markdown) são aceitos." })
      e.target.value = ""
      return
    }
    setSelectedFile(file)
  }

  function clearFile() {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      // 1. Create project
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!createRes.ok) throw new Error("Erro ao salvar o projeto")
      const created = await createRes.json()

      // 2. Upload document via presigned URL
      if (selectedFile && created.id) {
        const urlRes = await fetch(
          `/api/projects/${created.id}/upload-url?filename=${encodeURIComponent(selectedFile.name)}`,
        )
        if (!urlRes.ok) throw new Error("Falha ao obter URL de upload")
        const { uploadUrl, fileUrl } = await urlRes.json()

        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          body: selectedFile,
          headers: { "Content-Type": "text/markdown" },
        })
        if (!putRes.ok) throw new Error("Falha no upload do documento")

        // 3. Update project with document URL
        await fetch(`/api/projects/${created.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentPath: fileUrl }),
        })
      }

      setIsCreateDialogOpen(false)
      form.reset()
      setSelectedFile(null)
      setFeedback({ type: "success", message: "Projeto criado com sucesso" })
      fetchProjects()
    } catch (error: any) {
      console.error("Erro no formulário:", error)
      setIsCreateDialogOpen(false)
      setFeedback({
        type: "error",
        message: error.message || "Ocorreu um erro ao criar o projeto. Tente novamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projetos</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="px-4">
              <Plus />
              Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Projeto</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                  {/* Informações Básicas */}
                  <div className="border-b pb-4">
                    <h3 className="text-sm font-semibold mb-4 text-muted-foreground">Informações Básicas</h3>
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
                  </div>

                  {/* Detalhes */}
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
                              placeholder="Descreva o projeto em detalhes..."
                              className="min-h-24 resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Documentação */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground">Documentação</h3>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Arquivo de Documentação <span className="text-xs text-muted-foreground">(opcional — apenas .md)</span>
                      </label>
                      {selectedFile ? (
                        <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/40">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm truncate flex-1">{selectedFile.name}</span>
                          <button type="button" onClick={clearFile} className="shrink-0 text-muted-foreground hover:text-destructive">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed rounded-md text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                          <Upload className="h-4 w-4" />
                          Selecionar arquivo .md
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".md"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button type="submit" className="flex-1" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? "Salvando..." : "Salvar Projeto"}
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

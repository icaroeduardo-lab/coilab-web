"use client"

import { useState, useCallback } from "react"
import { Plus, Loader2, AlertCircle, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import DesignGallery from "./design-gallery"
import DesignViewer from "./design-viewer"

export type Design = {
  id: string
  url: string
  title: string
  description: string
}

interface DesignManagerProps {
  taskId: string
  taskNumber?: string
  initialDesigns?: Design[]
  onSave?: (designs: Design[]) => Promise<void>
}

export default function DesignManager({
  taskId,
  taskNumber,
  initialDesigns = [],
  onSave,
}: DesignManagerProps) {
  const [designs, setDesigns] = useState<Design[]>(initialDesigns)
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [importType, setImportType] = useState<"upload" | "figma">("upload")

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadDescription, setUploadDescription] = useState("")

  // Figma state
  const [figmaUrl, setFigmaUrl] = useState("")
  const [figmaToken, setFigmaToken] = useState("")
  const [figmaTitle, setFigmaTitle] = useState("")
  const [figmaDescription, setFigmaDescription] = useState("")
  const [figmaPreview, setFigmaPreview] = useState<string | null>(null)

  // Common state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (file: File | null) => {
    setUploadFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setUploadPreview(null)
    }
  }

  const handleRemoveDesign = useCallback(
    async (id: string) => {
      const updatedDesigns = designs.filter((d) => d.id !== id)
      setDesigns(updatedDesigns)

      if (onSave) {
        setIsLoading(true)
        try {
          await onSave(updatedDesigns)
        } finally {
          setIsLoading(false)
        }
      }
    },
    [designs, onSave]
  )

  const handleUpload = async () => {
    if (!uploadFile) {
      setError("Por favor, selecione uma imagem")
      return
    }

    if (!uploadTitle.trim()) {
      setError("Por favor, adicione um título")
      return
    }

    if (!uploadDescription.trim()) {
      setError("Por favor, adicione uma descrição")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", uploadFile)
      formData.append("title", uploadTitle)
      formData.append("description", uploadDescription)
      if (taskNumber) formData.append("taskNumber", taskNumber)

      const response = await fetch("/api/designs/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erro ao fazer upload")
      }

      const data = await response.json()
      const newDesign: Design = {
        id: data.fileName,
        url: data.url,
        title: uploadTitle,
        description: uploadDescription,
      }

      const updatedDesigns = [...designs, newDesign]
      setDesigns(updatedDesigns)

      if (onSave) {
        await onSave(updatedDesigns)
      }

      setSuccessMessage("Imagem adicionada com sucesso!")
      setShowSuccessDialog(true)
      resetForm()
      setShowDialog(false)

      // Auto-close success dialog after 3 seconds
      setTimeout(() => setShowSuccessDialog(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer upload")
    } finally {
      setIsLoading(false)
    }
  }

  const [isPreviewing, setIsPreviewing] = useState(false)

  const handleFigmaPreview = async () => {
    if (!figmaUrl.trim()) return
    setIsPreviewing(true)
    setFigmaPreview(null)
    try {
      const res = await fetch("/api/designs/figma/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          figmaUrl: figmaUrl.trim(),
          figmaToken: figmaToken.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFigmaPreview(data.previewUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar preview")
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleFigmaImport = async () => {
    if (!figmaUrl.trim()) {
      setError("Por favor, adicione a URL do Figma")
      return
    }

    if (!figmaTitle.trim()) {
      setError("Por favor, adicione um título")
      return
    }

    if (!figmaDescription.trim()) {
      setError("Por favor, adicione uma descrição")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/designs/figma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          figmaUrl,
          title: figmaTitle,
          description: figmaDescription,
          figmaToken: figmaToken.trim() || undefined,
          taskNumber: taskNumber || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error)
      }

      const data = await response.json()
      const newDesign: Design = {
        id: data.fileName,
        url: data.url,
        title: figmaTitle,
        description: figmaDescription,
      }

      const updatedDesigns = [...designs, newDesign]
      setDesigns(updatedDesigns)

      if (onSave) {
        await onSave(updatedDesigns)
      }

      setSuccessMessage("Imagem adicionada com sucesso!")
      setShowSuccessDialog(true)
      resetForm()
      setShowDialog(false)

      // Auto-close success dialog after 3 seconds
      setTimeout(() => setShowSuccessDialog(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar do Figma")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setUploadFile(null)
    setUploadPreview(null)
    setUploadTitle("")
    setUploadDescription("")
    setFigmaUrl("")
    setFigmaToken("")
    setFigmaTitle("")
    setFigmaDescription("")
    setFigmaPreview(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-light tracking-tight">Designs</h2>
        <p className="text-sm text-muted-foreground">
          Adicione imagens e protótipos de design para esta tarefa
        </p>
      </div>

      {/* New Image Button */}
      <Button
        onClick={() => {
          resetForm()
          setShowDialog(true)
        }}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Nova Imagem
      </Button>

      {/* Gallery or Empty State */}
      {designs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/20 p-12 text-center">
          <div className="space-y-2">
            <Plus className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nenhum design adicionado ainda
            </p>
            <p className="text-xs text-muted-foreground/60">
              Clique em "Nova Imagem" para começar
            </p>
          </div>
        </div>
      ) : (
        <DesignGallery
          designs={designs}
          onSelectDesign={setSelectedDesign}
          onRemoveDesign={handleRemoveDesign}
          isLoading={isLoading}
        />
      )}

      {/* Import Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="w-[95vw] !max-w-[1200px] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Adicionar Nova Imagem</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
            {/* Left: Form */}
            <div className="space-y-6 flex flex-col">
              {/* Error Message */}
              {error && (
                <div className="flex gap-3 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Radio Group */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Tipo de Importação</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="upload"
                      name="importType"
                      value="upload"
                      checked={importType === "upload"}
                      onChange={() => setImportType("upload")}
                      className="cursor-pointer"
                    />
                    <Label htmlFor="upload" className="cursor-pointer text-base">
                      Upload Normal
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="figma"
                      name="importType"
                      value="figma"
                      checked={importType === "figma"}
                      onChange={() => setImportType("figma")}
                      className="cursor-pointer"
                    />
                    <Label htmlFor="figma" className="cursor-pointer text-base">
                      Importar do Figma
                    </Label>
                  </div>
                </div>
              </div>

              {/* Upload Option */}
              {importType === "upload" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file" className="text-sm font-medium">
                      Selecionar Imagem *
                    </Label>
                    <Input
                      id="file"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                      disabled={isLoading}
                    />
                    {uploadFile && (
                      <p className="text-xs text-muted-foreground">
                        ✓ {uploadFile.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="upload-title" className="text-sm font-medium">
                      Título *
                    </Label>
                    <Input
                      id="upload-title"
                      placeholder="Ex: Mockup da Homepage"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2 flex-1 flex flex-col">
                    <Label htmlFor="upload-description" className="text-sm font-medium">
                      Descrição *
                    </Label>
                    <Textarea
                      id="upload-description"
                      placeholder="Descreva esta imagem/design"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      disabled={isLoading}
                      rows={8}
                      className="resize-none flex-1"
                    />
                  </div>
                </div>
              )}

              {/* Figma Option */}
              {importType === "figma" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="figma-url" className="text-sm font-medium">
                      URL do Figma *
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="figma-url"
                        placeholder="https://www.figma.com/file/...?node-id=..."
                        value={figmaUrl}
                        onChange={(e) => { setFigmaUrl(e.target.value); setFigmaPreview(null) }}
                        disabled={isLoading}
                        className="font-mono text-xs"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleFigmaPreview}
                        disabled={!figmaUrl.trim() || isPreviewing || isLoading}
                        className="shrink-0 text-xs"
                      >
                        {isPreviewing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Pré-visualizar"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use "Copy link to selection" no Figma para incluir o node-id
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="figma-token" className="text-sm font-medium">
                      Token Figma (opcional)
                    </Label>
                    <Input
                      id="figma-token"
                      type="password"
                      placeholder="Seu token de API do Figma"
                      value={figmaToken}
                      onChange={(e) => setFigmaToken(e.target.value)}
                      disabled={isLoading}
                      className="font-mono text-xs"
                    />
                    <p className="text-xs text-muted-foreground">
                      Gere em:{" "}
                      <a
                        href="https://www.figma.com/developers/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        figma.com/developers
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="figma-title" className="text-sm font-medium">
                      Título *
                    </Label>
                    <Input
                      id="figma-title"
                      placeholder="Ex: Design System - Componentes"
                      value={figmaTitle}
                      onChange={(e) => setFigmaTitle(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2 flex-1 flex flex-col">
                    <Label htmlFor="figma-description" className="text-sm font-medium">
                      Descrição *
                    </Label>
                    <Textarea
                      id="figma-description"
                      placeholder="Descreva este design do Figma"
                      value={figmaDescription}
                      onChange={(e) => setFigmaDescription(e.target.value)}
                      disabled={isLoading}
                      rows={8}
                      className="resize-none flex-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right: Preview */}
            <div className="flex flex-col gap-4">
              <Label className="text-base font-medium">Pré-visualização</Label>

              {uploadPreview && importType === "upload" ? (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted border border-border">
                  <Image
                    src={uploadPreview}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : figmaPreview && importType === "figma" ? (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted border border-border">
                  <Image
                    src={figmaPreview}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="relative aspect-video w-full rounded-lg bg-muted border border-dashed border-muted-foreground/20 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    {importType === "upload"
                      ? "Selecione uma imagem para pré-visualizar"
                      : "A pré-visualização aparecerá aqui"}
                  </p>
                </div>
              )}

              {/* Info Summary */}
              <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Título</p>
                  <p className="text-sm font-medium">
                    {importType === "upload"
                      ? uploadTitle || "—"
                      : figmaTitle || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm line-clamp-2">
                    {importType === "upload"
                      ? uploadDescription || "—"
                      : figmaDescription || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={importType === "upload" ? handleUpload : handleFigmaImport}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {importType === "upload" ? "Enviando..." : "Importando..."}
                </>
              ) : (
                importType === "upload" ? "Enviar" : "Importar"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={(open) => !open && setShowSuccessDialog(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Sucesso</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Sucesso!</h2>
              <p className="text-muted-foreground">{successMessage}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="mt-4"
              onClick={() => setShowSuccessDialog(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Design Viewer Modal */}
      {selectedDesign && (
        <DesignViewer
          design={selectedDesign}
          onClose={() => setSelectedDesign(null)}
        />
      )}
    </div>
  )
}

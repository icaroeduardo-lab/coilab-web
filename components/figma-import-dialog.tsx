"use client"

import { useState } from "react"
import Image from "next/image"
import { Loader2, AlertCircle, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Design } from "./design-manager"

interface FigmaImportDialogProps {
  taskId: string
  onDesignsAdded: (designs: Design[]) => Promise<void>
  onClose: () => void
}

export default function FigmaImportDialog({
  taskId,
  onDesignsAdded,
  onClose,
}: FigmaImportDialogProps) {
  const [figmaUrl, setFigmaUrl] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [figmaToken, setFigmaToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasNodeId = (url: string) => /node-id=/.test(url)

  const handlePreview = async () => {
    const trimmed = figmaUrl.trim()
    if (!trimmed) return

    setIsPreviewing(true)
    setPreviewUrl(null)
    setPreviewError(null)

    try {
      const res = await fetch("/api/designs/figma/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          figmaUrl: trimmed,
          figmaToken: figmaToken.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPreviewUrl(data.previewUrl)
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Erro ao carregar preview")
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleImport = async () => {
    if (!figmaUrl.trim()) {
      setError("URL do Figma é obrigatória")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/designs/figma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          figmaUrl: figmaUrl.trim(),
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          figmaToken: figmaToken.trim() || undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || data.error)

      await onDesignsAdded([
        {
          id: data.fileName,
          url: data.url,
          title: data.title || "",
          description: data.description || "",
        },
      ])

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar do Figma")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full rounded-lg border border-border bg-background shadow-lg flex flex-col lg:flex-row overflow-hidden"
          style={{ maxWidth: previewUrl ? "860px" : "480px", maxHeight: "90vh" }}
        >
          {/* Form side */}
          <div className="flex flex-col w-full lg:w-[440px] shrink-0">
            {/* Header */}
            <div className="border-b border-border/50 px-6 py-4">
              <h2 className="text-lg font-medium">Importar do Figma</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Clique com botão direito no frame → <strong>Copy link to selection</strong>
              </p>
            </div>

            {/* Fields */}
            <div className="space-y-4 px-6 py-4 flex-1 overflow-y-auto">
              {error && (
                <div className="flex gap-3 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Link do Frame *</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://www.figma.com/file/...?node-id=..."
                    value={figmaUrl}
                    onChange={(e) => { setFigmaUrl(e.target.value); setPreviewUrl(null); setPreviewError(null) }}
                    disabled={isLoading}
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePreview}
                    disabled={!figmaUrl.trim() || isPreviewing || isLoading}
                    className="shrink-0"
                  >
                    {isPreviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pré-visualizar"}
                  </Button>
                </div>
                {!hasNodeId(figmaUrl) && figmaUrl.trim() && (
                  <p className="text-xs text-amber-500">
                    Use "Copy link to selection" no Figma para incluir o node-id
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input
                  placeholder="Nome do frame (opcional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  placeholder="Descrição do design (opcional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Token Figma (opcional)</label>
                <Input
                  type="password"
                  placeholder="Necessário para arquivos privados"
                  value={figmaToken}
                  onChange={(e) => setFigmaToken(e.target.value)}
                  disabled={isLoading}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Gere em{" "}
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
            </div>

            {/* Footer */}
            <div className="border-t border-border/50 flex gap-2 px-6 py-4 shrink-0">
              <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={isLoading || !figmaUrl.trim()}
                className="flex-1 gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  "Importar"
                )}
              </Button>
            </div>
          </div>

          {/* Preview side */}
          {(isPreviewing || previewUrl || previewError) && (
            <div className="border-t lg:border-t-0 lg:border-l border-border/50 flex-1 flex flex-col">
              <div className="border-b border-border/50 px-6 py-4">
                <p className="text-sm font-medium">Preview</p>
              </div>

              <div className="flex-1 flex items-center justify-center bg-muted/30 p-4 min-h-[300px]">
                {isPreviewing && (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p className="text-sm">Carregando preview...</p>
                  </div>
                )}

                {!isPreviewing && previewError && (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground text-center px-4">
                    <ImageIcon className="h-8 w-8" />
                    <p className="text-sm">{previewError}</p>
                  </div>
                )}

                {!isPreviewing && previewUrl && (
                  <div className="relative w-full h-full min-h-[300px]">
                    <Image
                      src={previewUrl}
                      alt="Preview do frame"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

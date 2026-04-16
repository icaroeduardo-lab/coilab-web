"use client"

import { useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"
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
  const [description, setDescription] = useState("")
  const [figmaToken, setFigmaToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          figmaUrl,
          description: description.trim() || "Importado do Figma",
          figmaToken: figmaToken.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error)
      }

      const data = await response.json()

      await onDesignsAdded([
        {
          id: data.fileName,
          url: data.url,
          description: data.description,
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-background shadow-lg">
          {/* Header */}
          <div className="border-b border-border/50 px-6 py-4">
            <h2 className="text-lg font-medium">Importar do Figma</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Cole o link do seu projeto Figma ou use um token de API
            </p>
          </div>

          {/* Content */}
          <div className="space-y-4 px-6 py-4">
            {/* Error Message */}
            {error && (
              <div className="flex gap-3 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Figma URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">URL do Figma *</label>
              <Input
                placeholder="https://www.figma.com/file/..."
                value={figmaUrl}
                onChange={(e) => setFigmaUrl(e.target.value)}
                disabled={isLoading}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Copie o link do seu arquivo ou quadro no Figma
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Descrição (opcional)
              </label>
              <Textarea
                placeholder="Descrição do design"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                className="resize-none"
                rows={3}
              />
            </div>

            {/* Figma Token */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Token Figma (opcional)
              </label>
              <Input
                type="password"
                placeholder="Seu token de API do Figma"
                value={figmaToken}
                onChange={(e) => setFigmaToken(e.target.value)}
                disabled={isLoading}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para usar o token padrão. Gere em:{" "}
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
          <div className="border-t border-border/50 flex gap-2 px-6 py-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
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
      </div>
    </>
  )
}

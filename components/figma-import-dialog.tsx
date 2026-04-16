"use client"

import { useState } from "react"
import Image from "next/image"
import { Loader2, AlertCircle, ChevronLeft, Check, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Design } from "./design-manager"

interface Frame {
  id: string
  name: string
  page: string
  thumbnail: string | null
}

interface FigmaImportDialogProps {
  taskId: string
  onDesignsAdded: (designs: Design[]) => Promise<void>
  onClose: () => void
}

type Step = "url" | "frames" | "importing"

export default function FigmaImportDialog({
  taskId,
  onDesignsAdded,
  onClose,
}: FigmaImportDialogProps) {
  const [step, setStep] = useState<Step>("url")
  const [figmaUrl, setFigmaUrl] = useState("")
  const [figmaToken, setFigmaToken] = useState("")
  const [projectName, setProjectName] = useState("")
  const [fileId, setFileId] = useState("")
  const [frames, setFrames] = useState<Frame[]>([])
  const [selectedFrames, setSelectedFrames] = useState<Set<string>>(new Set())
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const handleFetchFrames = async () => {
    if (!figmaUrl.trim()) {
      setError("URL do Figma é obrigatória")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/designs/figma/frames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          figmaUrl: figmaUrl.trim(),
          figmaToken: figmaToken.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar telas")
      }

      setProjectName(data.projectName)
      setFileId(data.fileId)
      setFrames(data.frames)
      setStep("frames")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar telas do Figma")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFrame = (id: string) => {
    setSelectedFrames((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleImport = async () => {
    if (selectedFrames.size === 0) {
      setError("Selecione pelo menos uma tela")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const imported: Design[] = []

      for (const frameId of selectedFrames) {
        const frame = frames.find((f) => f.id === frameId)!
        const frameUrl = `https://www.figma.com/file/${fileId}?node-id=${encodeURIComponent(frameId)}`

        const response = await fetch("/api/designs/figma", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            figmaUrl: frameUrl,
            title: selectedFrames.size === 1 ? (title || frame.name) : frame.name,
            description: description.trim() || "",
            figmaToken: figmaToken.trim() || undefined,
          }),
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Erro ao importar")

        imported.push({
          id: data.fileName,
          url: data.url,
          title: data.title || frame.name,
          description: data.description,
        })
      }

      await onDesignsAdded(imported)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar do Figma")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredFrames = frames.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.page.toLowerCase().includes(search.toLowerCase())
  )

  const groupedFrames = filteredFrames.reduce<Record<string, Frame[]>>((acc, frame) => {
    if (!acc[frame.page]) acc[frame.page] = []
    acc[frame.page].push(frame)
    return acc
  }, {})

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full rounded-lg border border-border bg-background shadow-lg flex flex-col"
          style={{ maxWidth: step === "frames" ? "860px" : "480px", maxHeight: "90vh" }}
        >
          {/* Header */}
          <div className="border-b border-border/50 px-6 py-4 flex items-center gap-3 shrink-0">
            {step === "frames" && (
              <button
                onClick={() => { setStep("url"); setSelectedFrames(new Set()); setError(null) }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-medium">
                {step === "url" ? "Importar do Figma" : projectName}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {step === "url"
                  ? "Cole o link do projeto para ver as telas disponíveis"
                  : `${frames.length} telas encontradas · ${selectedFrames.size} selecionada${selectedFrames.size !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {error && (
              <div className="flex gap-3 mx-6 mt-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Step 1: URL */}
            {step === "url" && (
              <div className="space-y-4 px-6 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL do Projeto Figma *</label>
                  <Input
                    placeholder="https://www.figma.com/file/..."
                    value={figmaUrl}
                    onChange={(e) => setFigmaUrl(e.target.value)}
                    disabled={isLoading}
                    className="font-mono text-xs"
                    onKeyDown={(e) => e.key === "Enter" && handleFetchFrames()}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Token Figma (opcional)</label>
                  <Input
                    type="password"
                    placeholder="Seu token de API do Figma"
                    value={figmaToken}
                    onChange={(e) => setFigmaToken(e.target.value)}
                    disabled={isLoading}
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Necessário para arquivos privados. Gere em{" "}
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
            )}

            {/* Step 2: Frame selection */}
            {step === "frames" && (
              <div className="flex flex-col lg:flex-row gap-0 h-full">
                {/* Frame grid */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Search */}
                  <div className="px-6 pt-4 pb-3 shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar telas..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Frames grouped by page */}
                  <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-5">
                    {Object.entries(groupedFrames).map(([page, pageFrames]) => (
                      <div key={page}>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          {page}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {pageFrames.map((frame) => {
                            const isSelected = selectedFrames.has(frame.id)
                            return (
                              <button
                                key={frame.id}
                                onClick={() => toggleFrame(frame.id)}
                                className={`relative rounded-lg border-2 overflow-hidden text-left transition-all ${
                                  isSelected
                                    ? "border-primary shadow-sm shadow-primary/20"
                                    : "border-border/50 hover:border-border"
                                }`}
                              >
                                {/* Thumbnail */}
                                <div className="aspect-video bg-muted/50 relative">
                                  {frame.thumbnail ? (
                                    <Image
                                      src={frame.thumbnail}
                                      alt={frame.name}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                    />
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                                      Sem preview
                                    </div>
                                  )}
                                </div>

                                {/* Name */}
                                <div className="px-2 py-1.5">
                                  <p className="text-xs font-medium truncate">{frame.name}</p>
                                </div>

                                {/* Selected indicator */}
                                {isSelected && (
                                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="h-3 w-3 text-primary-foreground" />
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}

                    {filteredFrames.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground text-sm">
                        Nenhuma tela encontrada
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar: title + description (only when frames selected) */}
                {selectedFrames.size > 0 && (
                  <div className="lg:w-64 border-t lg:border-t-0 lg:border-l border-border/50 px-6 py-4 space-y-4 shrink-0">
                    <p className="text-sm font-medium text-muted-foreground">
                      {selectedFrames.size === 1 ? "Detalhes" : `${selectedFrames.size} telas`}
                    </p>

                    {selectedFrames.size === 1 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Título</label>
                        <Input
                          placeholder={frames.find((f) => selectedFrames.has(f.id))?.name || ""}
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Descrição (opcional)</label>
                      <Textarea
                        placeholder="Descreva este design..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isLoading}
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border/50 flex gap-2 px-6 py-4 shrink-0">
            <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
              Cancelar
            </Button>

            {step === "url" ? (
              <Button
                onClick={handleFetchFrames}
                disabled={isLoading || !figmaUrl.trim()}
                className="flex-1 gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando telas...
                  </>
                ) : (
                  "Buscar Telas"
                )}
              </Button>
            ) : (
              <Button
                onClick={handleImport}
                disabled={isLoading || selectedFrames.size === 0}
                className="flex-1 gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  `Importar ${selectedFrames.size > 0 ? `(${selectedFrames.size})` : ""}`
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

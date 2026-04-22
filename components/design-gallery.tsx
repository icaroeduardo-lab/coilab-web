"use client"

import { useState } from "react"
import Image from "next/image"
import { Trash2, Maximize2, Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Design } from "./design-manager"

interface DesignGalleryProps {
  designs: Design[]
  onSelectDesign: (design: Design) => void
  onRemoveDesign: (id: string) => Promise<void>
  isLoading?: boolean
}

export default function DesignGallery({
  designs,
  onSelectDesign,
  onRemoveDesign,
  isLoading,
}: DesignGalleryProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDownload = (design: Design) => {
    try {
      const link = document.createElement("a")
      link.href = `/api/designs/download/${design.id}`
      link.download = `${design.title || design.id}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Erro ao fazer download:", error)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return

    setIsDeleting(true)
    try {
      await onRemoveDesign(deleteConfirm)
      setDeleteConfirm(null)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {designs.map((design) => (
          <div
            key={design.id}
            className="group overflow-hidden rounded-lg border border-border/50 bg-muted/30 transition-all duration-200 hover:border-border hover:bg-muted/50"
          >
            {/* Image Container */}
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
              <Image
                src={design.url}
                alt={design.description}
                fill
                className="object-contain"
                priority={false}
              />

              {/* Overlay Actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 transition-colors duration-200 group-hover:bg-black/20">
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  onClick={() => onSelectDesign(design)}
                >
                  <Maximize2 className="h-4 w-4" />
                  Expandir
                </Button>
              </div>
            </div>

            {/* Description Footer */}
            <div className="flex items-start justify-between gap-3 border-t border-border/50 p-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {design.title}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {design.description}
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownload(design)}
                  disabled={isLoading}
                  className="text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                  title="Baixar imagem"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteConfirm(design.id)}
                  disabled={isLoading}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Deletar imagem"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deletar Imagem</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja deletar esta imagem? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Deletar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

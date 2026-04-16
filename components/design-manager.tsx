"use client"

import { useState, useCallback } from "react"
import { Upload, X, Maximize2, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import DesignUploadZone from "./design-upload-zone"
import DesignGallery from "./design-gallery"
import DesignViewer from "./design-viewer"
import FigmaImportDialog from "./figma-import-dialog"

export type Design = {
  id: string
  url: string
  description: string
}

interface DesignManagerProps {
  taskId: string
  initialDesigns?: Design[]
  onSave?: (designs: Design[]) => Promise<void>
}

export default function DesignManager({
  taskId,
  initialDesigns = [],
  onSave,
}: DesignManagerProps) {
  const [designs, setDesigns] = useState<Design[]>(initialDesigns)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null)
  const [showFigmaDialog, setShowFigmaDialog] = useState(false)

  const handleAddDesigns = useCallback(
    async (newDesigns: Design[]) => {
      const updatedDesigns = [...designs, ...newDesigns]
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-light tracking-tight">Designs</h2>
        <p className="text-sm text-muted-foreground">
          Adicione imagens e protótipos de design para esta tarefa
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <DesignUploadZone
          taskId={taskId}
          onDesignsAdded={handleAddDesigns}
        />
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setShowFigmaDialog(true)}
        >
          <Link2 className="h-4 w-4" />
          Importar do Figma
        </Button>
      </div>

      {/* Gallery or Empty State */}
      {designs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-muted-foreground/20 p-12 text-center">
          <div className="space-y-2">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Nenhum design adicionado ainda
            </p>
            <p className="text-xs text-muted-foreground/60">
              Faça upload de imagens ou importe do Figma
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

      {/* Figma Import Dialog */}
      {showFigmaDialog && (
        <FigmaImportDialog
          taskId={taskId}
          onDesignsAdded={handleAddDesigns}
          onClose={() => setShowFigmaDialog(false)}
        />
      )}

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

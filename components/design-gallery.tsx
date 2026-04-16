"use client"

import Image from "next/image"
import { Trash2, Maximize2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  return (
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
              className="object-cover transition-transform duration-300 group-hover:scale-105"
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
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {design.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {design.id}
              </p>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemoveDesign(design.id)}
              disabled={isLoading}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

"use client"

import Image from "next/image"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Design } from "./design-manager"

interface DesignViewerProps {
  design: Design
  onClose: () => void
}

export default function DesignViewer({ design, onClose }: DesignViewerProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4">
        {/* Close Button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Image Container */}
        <div className="relative h-full w-full max-w-5xl max-h-[80vh]">
          {design.url ? (
            <Image
              src={design.url}
              alt={design.description}
              fill
              className="object-contain"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">Sem imagem</div>
          )}
        </div>

        {/* Footer - Description */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="rounded-lg bg-black/40 backdrop-blur-sm px-4 py-3 border border-white/10">
            <p className="text-sm font-medium text-white mb-1">
              {design.title}
            </p>
            <p className="text-sm text-white/80 leading-relaxed">
              {design.description}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

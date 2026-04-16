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
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <div className="space-y-1">
            <h2 className="text-lg font-medium text-white">Design</h2>
            <p className="text-sm text-gray-300">{design.description}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Image Container */}
        <div className="relative h-full w-full max-w-5xl max-h-[80vh]">
          <Image
            src={design.url}
            alt={design.description}
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Footer - Description */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="rounded-lg bg-black/40 backdrop-blur-sm px-4 py-3 border border-white/10">
            <p className="text-sm text-white leading-relaxed">
              {design.description}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {design.id}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

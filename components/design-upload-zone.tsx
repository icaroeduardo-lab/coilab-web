"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Design } from "./design-manager"

interface DesignUploadZoneProps {
  taskId: string
  onDesignsAdded: (designs: Design[]) => Promise<void>
}

export default function DesignUploadZone({
  taskId,
  onDesignsAdded,
}: DesignUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const uploadFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return

      setIsUploading(true)
      setUploadSuccess(false)

      try {
        const designs: Design[] = []

        for (let i = 0; i < files.length; i++) {
          const file = files[i]

          // Validate file type
          if (!file.type.startsWith("image/")) {
            console.warn(`Skipping ${file.name} - not an image`)
            continue
          }

          const formData = new FormData()
          formData.append("file", file)
          formData.append("description", `Design ${i + 1}`)

          const response = await fetch("/api/designs/upload", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            throw new Error(`Failed to upload ${file.name}`)
          }

          const data = await response.json()
          designs.push({
            id: data.fileName,
            url: data.url,
            title: data.title || "",
            description: data.description,
          })
        }

        if (designs.length > 0) {
          await onDesignsAdded(designs)
          setUploadSuccess(true)
          setTimeout(() => setUploadSuccess(false), 2000)

          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }
        }
      } catch (error) {
        console.error("Upload error:", error)
        alert("Erro ao fazer upload dos designs")
      } finally {
        setIsUploading(false)
        setIsDragging(false)
      }
    },
    [onDesignsAdded]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      uploadFiles(e.dataTransfer.files)
    },
    [uploadFiles]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      uploadFiles(e.target.files)
    },
    [uploadFiles]
  )

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-1 items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200 ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/20 hover:border-muted-foreground/40"
      }`}
    >
      <Input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        variant="ghost"
        size="lg"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="w-full gap-3 py-6 text-base font-normal"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Fazendo upload...
          </>
        ) : uploadSuccess ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Enviado com sucesso
          </>
        ) : (
          <>
            <Upload className="h-5 w-5" />
            Enviar imagens
          </>
        )}
      </Button>
    </div>
  )
}

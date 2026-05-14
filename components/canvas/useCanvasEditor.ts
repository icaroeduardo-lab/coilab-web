"use client"

import { useState, useCallback, useRef } from "react"
import { Canvas, EMPTY_CANVAS } from "./types"

export function useCanvasEditor(projectId: string, initial?: Canvas | null) {
  const [canvas, setCanvas] = useState<Canvas>(initial ?? EMPTY_CANVAS)
  const [saving, setSaving] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(async (next: Canvas) => {
    setSaving(true)
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvas: next }),
      })
    } finally {
      setSaving(false)
    }
  }, [projectId])

  const update = useCallback((patch: Partial<Canvas> | ((prev: Canvas) => Canvas)) => {
    setCanvas(prev => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch }
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => save(next), 800)
      return next
    })
  }, [save])

  return { canvas, update, saving }
}

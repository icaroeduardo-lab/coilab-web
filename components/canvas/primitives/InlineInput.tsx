"use client"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"

interface TagInputProps {
  placeholder?: string
  onAdd: (value: string) => void
  autoFocus?: boolean
  onCancel?: () => void
}

export function TagInput({ placeholder = "Adicionar...", onAdd, autoFocus, onCancel }: TagInputProps) {
  const [value, setValue] = useState("")
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { if (autoFocus) ref.current?.focus() }, [autoFocus])

  const commit = () => {
    const v = value.trim()
    if (v) { onAdd(v); setValue("") }
    else onCancel?.()
  }

  return (
    <input
      ref={ref}
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={e => {
        if (e.key === "Enter") { e.preventDefault(); commit() }
        if (e.key === "Escape") { setValue(""); onCancel?.() }
      }}
      onBlur={() => { if (!value.trim()) onCancel?.(); else commit() }}
      placeholder={placeholder}
      className="w-full text-[13px] bg-transparent border-b border-slate-300 focus:border-[var(--canvas-primary)] outline-none pb-0.5 placeholder:text-slate-400"
    />
  )
}

interface RemovableItemProps {
  children: React.ReactNode
  onRemove: () => void
}

export function RemovableItem({ children, onRemove }: RemovableItemProps) {
  return (
    <div className="group flex items-start gap-1.5">
      <div className="flex-1">{children}</div>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 text-slate-400 hover:text-red-500 shrink-0"
        aria-label="Remover"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

interface AddButtonProps {
  onClick: () => void
  label?: string
}

export function AddButton({ onClick, label = "Adicionar" }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-[11.5px] text-slate-400 hover:text-[var(--canvas-primary)] transition-colors mt-2"
    >
      <span className="flex items-center justify-center w-4 h-4 rounded-full border border-current text-[10px] font-bold leading-none">+</span>
      {label}
    </button>
  )
}

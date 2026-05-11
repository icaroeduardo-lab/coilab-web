"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

type Task = { id: string; name: string; taskNumber?: string; status?: string; project?: string }

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data } = useSWR<Task[]>("/api/tasks", fetcher, { revalidateOnFocus: false })
  const tasks = Array.isArray(data) ? data : []

  const q = query.trim().toLowerCase()
  const results = q
    ? tasks
        .filter(t =>
          t.name.toLowerCase().includes(q) ||
          t.taskNumber?.toLowerCase().includes(q)
        )
        .slice(0, 8)
    : []

  const handleSelect = useCallback((task: Task) => {
    setQuery("")
    setOpen(false)
    router.push(`/tasks/${task.id}`)
  }, [router])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (results[activeIndex]) handleSelect(results[activeIndex])
    } else if (e.key === "Escape") {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className="relative w-[54rem]">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none z-10" />
      <Input
        ref={inputRef}
        value={query}
        onChange={e => {
          setQuery(e.target.value)
          setActiveIndex(0)
          setOpen(true)
        }}
        onFocus={() => query && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder="Pesquisar tarefas..."
        className="pl-8 h-8 text-sm bg-muted/40 border-muted-foreground/20 focus:bg-background"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-lg border bg-popover shadow-lg overflow-hidden">
          {results.map((task, i) => (
            <button
              key={task.id}
              type="button"
              onMouseDown={() => handleSelect(task)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`w-full text-left px-3 py-2.5 transition-colors border-b last:border-b-0 ${
                i === activeIndex ? "bg-muted/70" : "hover:bg-muted/40"
              }`}
            >
              {task.taskNumber && (
                <p className="text-[10px] font-mono text-muted-foreground leading-none mb-0.5">
                  {task.taskNumber}
                </p>
              )}
              <p className="text-sm font-medium truncate leading-snug">{task.name}</p>
              {task.project && (
                <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">{task.project}</p>
              )}
            </button>
          ))}
        </div>
      )}
      {open && q && results.length === 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-lg border bg-popover shadow-lg px-3 py-4 text-center text-sm text-muted-foreground">
          Nenhuma tarefa encontrada
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type Task = { id: string; name: string; taskNumber?: string; project?: string }
type Project = { id: string; name: string; projectNumber?: string; description?: string }

type Result =
  | { kind: "task"; id: string; number?: string; title: string; sub?: string }
  | { kind: "project"; id: string; number?: string; title: string; sub?: string }

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: tasksData } = useSWR<Task[]>("/api/tasks", fetcher, { revalidateOnFocus: false })
  const { data: projectsData } = useSWR<{ data: Project[] } | Project[]>("/api/projects", fetcher, { revalidateOnFocus: false })

  const tasks: Task[] = Array.isArray(tasksData) ? tasksData : []
  const projectsRaw = Array.isArray(projectsData) ? projectsData : (projectsData as any)?.data ?? []
  const projects: Project[] = Array.isArray(projectsRaw) ? projectsRaw : []

  const q = query.trim().toLowerCase()

  const results: Result[] = q
    ? [
        ...tasks
          .filter(t => t.name.toLowerCase().includes(q) || t.taskNumber?.toLowerCase().includes(q))
          .slice(0, 5)
          .map(t => ({ kind: "task" as const, id: t.id, number: t.taskNumber, title: t.name, sub: t.project })),
        ...projects
          .filter(p => p.name.toLowerCase().includes(q) || p.projectNumber?.toLowerCase().includes(q))
          .slice(0, 5)
          .map(p => ({ kind: "project" as const, id: p.id, number: p.projectNumber, title: p.name, sub: p.description?.slice(0, 60) })),
      ]
    : []

  const handleSelect = useCallback((r: Result) => {
    setQuery("")
    setOpen(false)
    router.push(r.kind === "task" ? `/tasks/${r.id}` : `/projects/${r.id}`)
  }, [router])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
    else if (e.key === "Enter") { e.preventDefault(); if (results[activeIndex]) handleSelect(results[activeIndex]) }
    else if (e.key === "Escape") { setOpen(false); inputRef.current?.blur() }
  }

  return (
    <div className="relative w-[54rem]">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none z-10" />
      <Input
        ref={inputRef}
        value={query}
        onChange={e => { setQuery(e.target.value); setActiveIndex(0); setOpen(true) }}
        onFocus={() => query && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        placeholder="Pesquisar tarefas e projetos..."
        className="pl-8 h-8 text-sm bg-muted/40 border-muted-foreground/20 focus:bg-background"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-lg border bg-popover shadow-lg overflow-hidden">
          {results.map((r, i) => (
            <button
              key={`${r.kind}-${r.id}`}
              type="button"
              onMouseDown={() => handleSelect(r)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`w-full text-left px-3 py-2.5 transition-colors border-b last:border-b-0 flex items-center justify-between gap-3 ${
                i === activeIndex ? "bg-muted/70" : "hover:bg-muted/40"
              }`}
            >
              <div className="min-w-0">
                {r.number && (
                  <p className="text-[10px] font-mono text-muted-foreground leading-none mb-0.5">{r.number}</p>
                )}
                <p className="text-sm font-medium truncate leading-snug">{r.title}</p>
                {r.sub && (
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">{r.sub}</p>
                )}
              </div>
              <Badge
                variant="secondary"
                className={`shrink-0 text-[10px] h-5 px-1.5 ${
                  r.kind === "project"
                    ? "bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800"
                    : ""
                }`}
              >
                {r.kind === "task" ? "Tarefa" : "Projeto"}
              </Badge>
            </button>
          ))}
        </div>
      )}
      {open && q && results.length === 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 rounded-lg border bg-popover shadow-lg px-3 py-4 text-center text-sm text-muted-foreground">
          Nenhum resultado encontrado
        </div>
      )}
    </div>
  )
}

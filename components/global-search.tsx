"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Search, Paintbrush, GitBranch, Code2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type Phase = { id: string; type: string; status: string; order?: number }
type Task = { id: string; name: string; taskNumber?: string; project?: string; status?: string; phases?: Phase[] }
type Project = { id: string; name: string; projectNumber?: string; description?: string }

type Result =
  | { kind: "task"; id: string; number?: string; title: string; sub?: string; status?: string; phases?: Phase[] }
  | { kind: "project"; id: string; number?: string; title: string; sub?: string }

const fetcher = (url: string) => fetch(url).then(r => r.json())

const PHASE_ICONS: Record<string, React.ElementType> = {
  discovery: Search,
  design: Paintbrush,
  diagram: GitBranch,
  desenvolvimento: Code2,
}

const PHASE_TYPE_STYLE: Record<string, string> = {
  discovery: "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
  design: "bg-pink-100 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400",
  diagram: "bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400",
  desenvolvimento: "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
}


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
          .filter(t => t.name.toLowerCase().includes(q) || t.taskNumber?.toLowerCase().includes(q) || t.status?.toLowerCase().includes(q))
          .slice(0, 5)
          .map(t => ({ kind: "task" as const, id: t.id, number: t.taskNumber, title: t.name, sub: t.project, status: t.status, phases: t.phases })),
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
          {results.map((r, i) => {
            const phaseIndicators = r.kind === "task" && r.phases
              ? Object.values(
                  r.phases.reduce<Record<string, Phase>>((acc, p) => { acc[p.type] = p; return acc }, {})
                ).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              : []

            return (
              <button
                key={`${r.kind}-${r.id}`}
                type="button"
                onMouseDown={() => handleSelect(r)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full text-left px-3 py-2.5 transition-colors border-b last:border-b-0 flex items-center justify-between gap-3 ${
                  i === activeIndex ? "bg-muted/70" : "hover:bg-muted/40"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {r.number && (
                      <span className="text-[10px] font-mono text-muted-foreground leading-none">{r.number}</span>
                    )}
                    {phaseIndicators.length > 0 && (
                      <div className="flex items-center gap-1">
                        {phaseIndicators.map(p => {
                          const Icon = PHASE_ICONS[p.type] ?? Search
                          const style = PHASE_TYPE_STYLE[p.type] ?? "bg-gray-100 text-gray-600"
                          return (
                            <span
                              key={p.type}
                              className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${style}`}
                              title={p.type}
                            >
                              <Icon className="w-2.5 h-2.5" />
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium truncate leading-snug">{r.title}</p>
                  {r.sub && (
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate">{r.sub}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {r.kind === "task" && r.status && (
                    <Badge
                      variant="secondary"
                      className={`text-[10px] h-5 px-1.5 border ${
                        r.status === "Concluído"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                          : r.status === "Em Execução"
                          ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {r.status}
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className={`text-[10px] h-5 px-1.5 border ${
                      r.kind === "project"
                        ? "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800"
                        : "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800"
                    }`}
                  >
                    {r.kind === "task" ? "Tarefa" : "Projeto"}
                  </Badge>
                </div>
              </button>
            )
          })}
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

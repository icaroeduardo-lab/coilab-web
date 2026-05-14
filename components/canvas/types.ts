export type Canvas = {
  problem: string
  target: string[]
  objective: string[]
  impact: { description: string; labels: string[] }
  parts: { name: string; role: string }[]
  resources: { type: string; description: string[] }[]
  risksAndMitigation: { risk: string; mitigation: string }[]
  indicators: string[]
  team: { avatar: string; name: string; role: string; isLead: boolean }[]
  notes: string
}

export type CanvasTheme = "blue" | "green"

export const EMPTY_CANVAS: Canvas = {
  problem: "",
  target: [],
  objective: [],
  impact: { description: "", labels: [] },
  parts: [],
  resources: [],
  risksAndMitigation: [],
  indicators: [],
  team: [],
  notes: "",
}

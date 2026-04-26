import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const { apiClient } = await import("@/lib/api-client")
const { normalizeTask, normalizeSubTask, subTaskStatusToPhaseStatus, denormalizePriority } =
  await import("@/lib/task-normalizer")

const mockGet = apiClient.get as ReturnType<typeof vi.fn>
const mockPost = apiClient.post as ReturnType<typeof vi.fn>
const mockDelete = apiClient.delete as ReturnType<typeof vi.fn>

const backendSubTask = {
  id: "st-uuid-1",
  type: "Discovery",
  status: "Não iniciado",
  expectedDelivery: "2026-06-01T00:00:00.000Z",
  startDate: undefined,
  completionDate: undefined,
}

const backendTask = {
  id: "task-uuid-1",
  taskNumber: "#20260001",
  name: "Redesign checkout",
  description: "Melhorar conversão",
  priority: "alta",
  status: "Backlog",
  project: { id: "proj-1", name: "Portal" },
  applicant: { id: "app-1", name: "Marketing" },
  creator: { id: "user-1", name: "Icaro" },
  flows: [{ id: "f1", name: "Fluxo A" }],
  subTasks: [backendSubTask],
  createdAt: "2026-01-01T00:00:00.000Z",
}

describe("task-normalizer", () => {
  it("maps SubTask status to phase status", () => {
    expect(subTaskStatusToPhaseStatus("Não iniciado")).toBe("not_started")
    expect(subTaskStatusToPhaseStatus("Em progresso")).toBe("in_progress")
    expect(subTaskStatusToPhaseStatus("Aguardando Checkout")).toBe("completed")
    expect(subTaskStatusToPhaseStatus("Aprovado")).toBe("approved")
    expect(subTaskStatusToPhaseStatus("Reprovado")).toBe("rejected")
    expect(subTaskStatusToPhaseStatus("Cancelado")).toBe("rejected")
  })

  it("normalizes subTask to phase shape", () => {
    const phase = normalizeSubTask(backendSubTask)
    expect(phase.id).toBe("st-uuid-1")
    expect(phase.type).toBe("discovery")
    expect(phase.name).toBe("Discovery")
    expect(phase.status).toBe("not_started")
    expect(phase.enabled).toBe(true)
    expect(phase.dueDate).toBe("2026-06-01T00:00:00.000Z")
    expect(phase.checklist).toEqual([])
    expect(phase.notes).toBe("")
  })

  it("normalizes full task", () => {
    const task = normalizeTask(backendTask)
    expect(task.project).toBe("Portal")
    expect(task.applicant).toBe("Marketing")
    expect(task.priority).toBe("Alta")
    expect(task.phases).toHaveLength(1)
    expect(task.hasRejection).toBe(false)
    expect(task.projectId).toBe("proj-1")
    expect(task.applicantId).toBe("app-1")
  })

  it("detects hasRejection from subtasks", () => {
    const withRejection = { ...backendTask, subTasks: [{ ...backendSubTask, status: "Reprovado" }] }
    expect(normalizeTask(withRejection).hasRejection).toBe(true)
  })

  it("denormalizePriority converts capitalized to lowercase", () => {
    expect(denormalizePriority("Baixa")).toBe("baixa")
    expect(denormalizePriority("Alta")).toBe("alta")
  })
})

describe("GET /api/tasks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns normalized task list", async () => {
    const { GET } = await import("@/app/api/tasks/route")
    mockGet.mockResolvedValue({ data: [backendTask] })
    const res = await GET(new Request("http://localhost/api/tasks"))
    const body = await res.json()
    expect(body[0].project).toBe("Portal")
    expect(body[0].phases[0].type).toBe("discovery")
  })

  it("filters by project name via /tasks/project/:id", async () => {
    const { GET } = await import("@/app/api/tasks/route")
    mockGet
      .mockResolvedValueOnce({ data: [{ id: "proj-1", name: "Portal" }] }) // resolve project
      .mockResolvedValueOnce({ data: [backendTask] }) // tasks by project
    const res = await GET(new Request("http://localhost/api/tasks?project=Portal"))
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("/tasks/project/proj-1"))
    const body = await res.json()
    expect(body).toHaveLength(1)
  })
})

describe("DELETE /api/tasks/:id", () => {
  beforeEach(() => vi.clearAllMocks())

  it("calls DELETE on backend", async () => {
    const { DELETE } = await import("@/app/api/tasks/[id]/route")
    mockDelete.mockResolvedValue(undefined)
    const res = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: "task-uuid-1" }),
    })
    expect(mockDelete).toHaveBeenCalledWith("/tasks/task-uuid-1")
    expect((await res.json()).success).toBe(true)
  })
})

describe("GET /api/tasks/project/:projectId", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns normalized tasks for project (array response)", async () => {
    const { GET } = await import("@/app/api/tasks/project/[projectId]/route")
    mockGet.mockResolvedValue([backendTask])
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ projectId: "proj-1" }),
    })
    expect(mockGet).toHaveBeenCalledWith("/tasks/project/proj-1")
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].project).toBe("Portal")
    expect(body[0].phases[0].type).toBe("discovery")
  })

  it("handles paginated response { data: [] }", async () => {
    const { GET } = await import("@/app/api/tasks/project/[projectId]/route")
    mockGet.mockResolvedValue({ data: [backendTask] })
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ projectId: "proj-1" }),
    })
    const body = await res.json()
    expect(body).toHaveLength(1)
  })

  it("returns empty array when backend returns no data", async () => {
    const { GET } = await import("@/app/api/tasks/project/[projectId]/route")
    mockGet.mockResolvedValue({})
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ projectId: "proj-1" }),
    })
    expect(await res.json()).toEqual([])
  })

  it("returns 500 on error", async () => {
    const { GET } = await import("@/app/api/tasks/project/[projectId]/route")
    mockGet.mockRejectedValue(new Error("API 503"))
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ projectId: "proj-1" }),
    })
    expect(res.status).toBe(500)
  })
})

describe("POST /api/tasks", () => {
  beforeEach(() => vi.clearAllMocks())

  it("resolves project and applicant IDs, maps phases to subTasks", async () => {
    const { POST } = await import("@/app/api/tasks/route")
    mockGet
      .mockResolvedValueOnce({ data: [{ id: "proj-1", name: "Portal" }] })
      .mockResolvedValueOnce({ data: [{ id: "app-1", name: "Marketing" }] })
    mockPost.mockResolvedValue(backendTask)

    const req = new Request("http://localhost/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        name: "Nova tarefa",
        project: "Portal",
        applicant: "Marketing",
        priority: "Baixa",
        description: "Desc",
        phases: ["discovery"],
        flows: [],
        phaseDueDates: { discovery: "2026-06-01T00:00:00.000Z" },
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(mockPost).toHaveBeenCalledWith("/tasks", expect.objectContaining({
      projectId: "proj-1",
      applicantId: "app-1",
      priority: "baixa",
      subTasks: [{ type: "Discovery", expectedDelivery: "2026-06-01T00:00:00.000Z" }],
    }))
  })
})

import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

const { apiClient } = await import("@/lib/api-client")
const { GET: getList, POST } = await import("@/app/api/projects/route")

const mockGet = apiClient.get as ReturnType<typeof vi.fn>
const mockPost = apiClient.post as ReturnType<typeof vi.fn>
const mockPatch = apiClient.patch as ReturnType<typeof vi.fn>

const backendProject = {
  id: "uuid-1",
  name: "Portal",
  projectNumber: "#20260001",
  description: "Desc",
  urlDocument: "https://s3.example.com/doc.md",
  status: "backlog",
  createdAt: "2026-01-01T00:00:00.000Z",
}

const normalizedProject = {
  id: "uuid-1",
  name: "Portal",
  projectNumber: "#20260001",
  description: "Desc",
  documentPath: "https://s3.example.com/doc.md",
  status: "backlog",
  createdAt: "2026-01-01T00:00:00.000Z",
}

describe("GET /api/projects", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns normalized project list", async () => {
    mockGet.mockResolvedValue({ data: [backendProject], total: 1, page: 1, limit: 200 })
    const res = await getList()
    expect(await res.json()).toEqual([normalizedProject])
    expect(mockGet).toHaveBeenCalledWith("/projects?limit=200")
  })

  it("maps urlDocument to documentPath", async () => {
    mockGet.mockResolvedValue({ data: [backendProject] })
    const res = await getList()
    const [project] = await res.json()
    expect(project.documentPath).toBe("https://s3.example.com/doc.md")
    expect(project.urlDocument).toBeUndefined()
  })

  it("returns 500 on error", async () => {
    mockGet.mockRejectedValue(new Error("API 500"))
    const res = await getList()
    expect(res.status).toBe(500)
  })
})

describe("POST /api/projects", () => {
  beforeEach(() => vi.clearAllMocks())

  it("creates project and normalizes response", async () => {
    mockPost.mockResolvedValue(backendProject)
    const req = new Request("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify({ name: "Portal", description: "Desc" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.documentPath).toBe("https://s3.example.com/doc.md")
    expect(body.urlDocument).toBeUndefined()
  })

  it("maps documentPath to urlDocument in request body", async () => {
    mockPost.mockResolvedValue(backendProject)
    const req = new Request("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify({ name: "P", description: "D", documentPath: "https://s3.example.com/doc.md" }),
    })
    await POST(req)
    expect(mockPost).toHaveBeenCalledWith("/projects", {
      name: "P",
      description: "D",
      urlDocument: "https://s3.example.com/doc.md",
    })
  })
})

describe("GET/PATCH /api/projects/:id", () => {
  beforeEach(() => vi.clearAllMocks())

  it("GET normalizes single project", async () => {
    const { GET } = await import("@/app/api/projects/[id]/route")
    mockGet.mockResolvedValue(backendProject)
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "uuid-1" }),
    })
    const body = await res.json()
    expect(body.documentPath).toBe("https://s3.example.com/doc.md")
  })

  it("PATCH maps documentPath to urlDocument", async () => {
    const { PATCH } = await import("@/app/api/projects/[id]/route")
    mockPatch.mockResolvedValue(backendProject)
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ documentPath: "https://new.url/doc.md" }),
    })
    await PATCH(req, { params: Promise.resolve({ id: "uuid-1" }) })
    expect(mockPatch).toHaveBeenCalledWith("/projects/uuid-1", {
      urlDocument: "https://new.url/doc.md",
    })
  })
})

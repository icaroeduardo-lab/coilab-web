import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

const { auth } = await import("@/auth")
const { apiClient } = await import("@/lib/api-client")

const mockAuth = auth as ReturnType<typeof vi.fn>

function mockFetch(status: number, body: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  }))
}

describe("apiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.API_URL = "http://localhost:3001"
  })

  it("sends Authorization header when session has accessToken", async () => {
    mockAuth.mockResolvedValue({ accessToken: "tok-123" })
    mockFetch(200, { id: "1" })

    await apiClient.get("/tasks/1")

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(init.headers["Authorization"]).toBe("Bearer tok-123")
  })

  it("omits Authorization header when no session", async () => {
    mockAuth.mockResolvedValue(null)
    mockFetch(200, [])

    await apiClient.get("/tasks")

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(init.headers["Authorization"]).toBeUndefined()
  })

  it("builds correct URL", async () => {
    mockAuth.mockResolvedValue({ accessToken: "tok" })
    mockFetch(200, {})

    await apiClient.get("/projects")

    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(url).toBe("http://localhost:3001/projects")
  })

  it("throws on non-ok response", async () => {
    mockAuth.mockResolvedValue({ accessToken: "tok" })
    mockFetch(404, { message: "Not Found" })

    await expect(apiClient.get("/tasks/999")).rejects.toThrow("Not Found")
  })

  it("POST sends body as JSON", async () => {
    mockAuth.mockResolvedValue({ accessToken: "tok" })
    mockFetch(201, { id: "new" })

    await apiClient.post("/tasks", { title: "Test task" })

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(init.method).toBe("POST")
    expect(init.body).toBe(JSON.stringify({ title: "Test task" }))
  })

  it("returns undefined on 204 response", async () => {
    mockAuth.mockResolvedValue({ accessToken: "tok" })
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 204 }))

    const result = await apiClient.delete("/tasks/1")
    expect(result).toBeUndefined()
  })
})

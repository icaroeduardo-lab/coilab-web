import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn() },
}))

const { apiClient } = await import("@/lib/api-client")
const { GET } = await import("@/app/api/applicants/route")

const mockGet = apiClient.get as ReturnType<typeof vi.fn>

describe("GET /api/applicants", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns data array from backend", async () => {
    const items = [{ id: "1", name: "Marketing" }]
    mockGet.mockResolvedValue({ data: items, total: 1, page: 1, limit: 200 })

    const res = await GET()
    const body = await res.json()

    expect(mockGet).toHaveBeenCalledWith("/applicants?limit=200")
    expect(body).toEqual(items)
  })

  it("returns empty array when data is missing", async () => {
    mockGet.mockResolvedValue({})

    const res = await GET()
    const body = await res.json()

    expect(body).toEqual([])
  })

  it("returns 500 on backend error", async () => {
    mockGet.mockRejectedValue(new Error("API 503: Service unavailable"))

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toContain("503")
  })
})

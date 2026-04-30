import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn() },
}))

const { apiClient } = await import("@/lib/api-client")
const { GET } = await import("@/app/api/flows/route")

const mockGet = apiClient.get as ReturnType<typeof vi.fn>

describe("GET /api/flows", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns data array from backend", async () => {
    const items = [{ id: "f1", name: "Fluxo A" }]
    mockGet.mockResolvedValue({ data: items, total: 1, page: 1, limit: 200 })

    const res = await GET()
    const body = await res.json()

    expect(mockGet).toHaveBeenCalledWith("/flows?limit=200")
    expect(body).toEqual(items)
  })

  it("returns empty array when data is missing", async () => {
    mockGet.mockResolvedValue({})

    const res = await GET()
    const body = await res.json()

    expect(body).toEqual([])
  })

  it("returns 500 on backend error", async () => {
    mockGet.mockRejectedValue(new Error("API 502: Bad Gateway"))

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toContain("502")
  })
})

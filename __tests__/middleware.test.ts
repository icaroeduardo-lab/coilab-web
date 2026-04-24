import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

vi.mock("@/auth", () => ({
  auth: (handler: (req: unknown) => unknown) => handler,
}))

const { default: middleware } = await import("@/middleware")

function makeReq(pathname: string, isLoggedIn: boolean) {
  return {
    auth: isLoggedIn ? { user: { name: "Test" } } : null,
    nextUrl: new URL(`http://localhost${pathname}`),
    url: `http://localhost${pathname}`,
  } as unknown as NextRequest & { auth: unknown }
}

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(NextResponse, "redirect").mockImplementation(
      (url) => ({ type: "redirect", url }) as unknown as NextResponse,
    )
    vi.spyOn(NextResponse, "next").mockReturnValue({
      type: "next",
    } as unknown as NextResponse)
  })

  it("passes /api/auth routes through", () => {
    const req = makeReq("/api/auth/signin", false)
    const res = middleware(req as never)
    expect(NextResponse.next).toHaveBeenCalled()
    expect(NextResponse.redirect).not.toHaveBeenCalled()
  })

  it("redirects unauthenticated user to /login", () => {
    const req = makeReq("/projects", false)
    middleware(req as never)
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ href: expect.stringContaining("/login") }),
    )
  })

  it("allows unauthenticated user on /login", () => {
    const req = makeReq("/login", false)
    middleware(req as never)
    expect(NextResponse.next).toHaveBeenCalled()
    expect(NextResponse.redirect).not.toHaveBeenCalled()
  })

  it("redirects authenticated user away from /login", () => {
    const req = makeReq("/login", true)
    middleware(req as never)
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ href: expect.stringContaining("/") }),
    )
  })

  it("allows authenticated user on protected route", () => {
    const req = makeReq("/tasks", true)
    middleware(req as never)
    expect(NextResponse.next).toHaveBeenCalled()
    expect(NextResponse.redirect).not.toHaveBeenCalled()
  })
})

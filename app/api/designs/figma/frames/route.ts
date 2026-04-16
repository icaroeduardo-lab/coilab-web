import { NextResponse } from "next/server"

interface FigmaNode {
  id: string
  name: string
  type: string
  children?: FigmaNode[]
}

function extractFrames(node: FigmaNode, frames: { id: string; name: string }[] = []) {
  if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "SECTION") {
    frames.push({ id: node.id, name: node.name })
  }
  if (node.children) {
    for (const child of node.children) {
      extractFrames(child, frames)
    }
  }
  return frames
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { figmaUrl, figmaToken } = body

    if (!figmaUrl) {
      return NextResponse.json({ error: "figmaUrl is required" }, { status: 400 })
    }

    const token = figmaToken || process.env.FIGMA_API_TOKEN
    if (!token) {
      return NextResponse.json({ error: "Figma API token is required" }, { status: 400 })
    }

    const fileIdMatch = figmaUrl.match(/\/(file|design)\/([a-zA-Z0-9]+)/)
    if (!fileIdMatch) {
      return NextResponse.json({ error: "Invalid Figma URL" }, { status: 400 })
    }
    const fileId = fileIdMatch[2]

    const response = await fetch(`https://api.figma.com/v1/files/${fileId}?depth=2`, {
      headers: { "X-Figma-Token": token },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch Figma file. Check your URL and token." },
        { status: 400 }
      )
    }

    const data = await response.json()
    const projectName = data.name

    // Top-level frames are on the pages (document.children)
    const allFrames: { id: string; name: string; page: string }[] = []
    for (const page of data.document.children) {
      if (page.children) {
        for (const node of page.children) {
          if (node.type === "FRAME" || node.type === "COMPONENT" || node.type === "SECTION") {
            allFrames.push({ id: node.id, name: node.name, page: page.name })
          }
        }
      }
    }

    // Fetch thumbnails for all frames
    let thumbnails: Record<string, string> = {}
    if (allFrames.length > 0) {
      const ids = allFrames.map((f) => f.id).join(",")
      const thumbResponse = await fetch(
        `https://api.figma.com/v1/images/${fileId}?ids=${ids}&format=png&scale=0.5`,
        { headers: { "X-Figma-Token": token } }
      )
      if (thumbResponse.ok) {
        const thumbData = await thumbResponse.json()
        thumbnails = thumbData.images || {}
      }
    }

    const frames = allFrames.map((f) => ({
      ...f,
      thumbnail: thumbnails[f.id] || null,
    }))

    return NextResponse.json({ projectName, fileId, frames })
  } catch (error: any) {
    console.error("Error fetching Figma frames:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

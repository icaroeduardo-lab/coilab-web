import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { figmaUrl, figmaToken } = body

    if (!figmaUrl) {
      return NextResponse.json({ error: "figmaUrl is required" }, { status: 400 })
    }

    const token = figmaToken || process.env.FIGMA_API_TOKEN
    if (!token) {
      return NextResponse.json({ error: "Figma token required" }, { status: 400 })
    }

    const fileIdMatch = figmaUrl.match(/\/(file|design)\/([a-zA-Z0-9]+)/)
    if (!fileIdMatch) {
      return NextResponse.json({ error: "Invalid Figma URL" }, { status: 400 })
    }
    const fileId = fileIdMatch[2]

    const nodeIdMatch = figmaUrl.match(/[?#&]node-id=([^&]+)/)
    const nodeId = nodeIdMatch ? decodeURIComponent(nodeIdMatch[1]) : null

    if (!nodeId) {
      return NextResponse.json({ error: "URL must contain a node-id (use Copy link to selection in Figma)" }, { status: 400 })
    }

    const exportUrl = `https://api.figma.com/v1/images/${fileId}?ids=${nodeId}&format=png&scale=1`
    const response = await fetch(exportUrl, {
      headers: { "X-Figma-Token": token },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch preview from Figma" }, { status: 400 })
    }

    const data = await response.json()
    const imageUrl = Object.values(data.images)[0] as string

    if (!imageUrl) {
      return NextResponse.json({ error: "No preview available" }, { status: 400 })
    }

    return NextResponse.json({ previewUrl: imageUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

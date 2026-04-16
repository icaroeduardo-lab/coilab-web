import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || "",
  },
  region: process.env.APP_AWS_REGION || "us-east-1",
})

/**
 * Extract Figma file ID from various Figma URL formats
 * Supports: https://www.figma.com/file/{fileId}/... or https://figma.com/file/{fileId}/...
 */
function extractFigmaFileId(url: string): string | null {
  const match = url.match(/\/(file|design)\/([a-zA-Z0-9]+)/)
  return match ? match[2] : null
}

/**
 * Extract Figma node ID from URL fragment
 * Format: ?node-id=123%3A456 or #node-id=123:456
 */
function extractNodeId(url: string): string | null {
  const match = url.match(/[?#&]node-id=([^&]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { figmaUrl, title, description, figmaToken } = body

    if (!figmaUrl) {
      return NextResponse.json(
        { error: "Figma URL is required" },
        { status: 400 }
      )
    }

    const fileId = extractFigmaFileId(figmaUrl)
    if (!fileId) {
      return NextResponse.json(
        { error: "Invalid Figma URL format. Use https://www.figma.com/file/{fileId}/..." },
        { status: 400 }
      )
    }

    const bucketName = process.env.BUCKET_DESIGN
    if (!bucketName) {
      return NextResponse.json(
        { error: "BUCKET_DESIGN environment variable is not set" },
        { status: 500 }
      )
    }

    // Use provided token or fall back to env variable
    const token = figmaToken || process.env.FIGMA_API_TOKEN

    if (!token) {
      return NextResponse.json(
        {
          error: "Figma API token required",
          message: "Please provide figmaToken in request or set FIGMA_API_TOKEN env variable",
        },
        { status: 400 }
      )
    }

    // Fetch file from Figma API
    const figmaResponse = await fetch(
      `https://api.figma.com/v1/files/${fileId}`,
      {
        headers: {
          "X-Figma-Token": token,
        },
      }
    )

    if (!figmaResponse.ok) {
      return NextResponse.json(
        {
          error: "Failed to fetch Figma file",
          status: figmaResponse.status,
          message: "Check your Figma token and file ID",
        },
        { status: 400 }
      )
    }

    const figmaData = await figmaResponse.json()
    const nodeId = extractNodeId(figmaUrl)

    // Export as PNG - use node ID if provided, otherwise export whole file
    const exportUrl = nodeId
      ? `https://api.figma.com/v1/images/${fileId}?ids=${nodeId}&format=png`
      : `https://api.figma.com/v1/images/${fileId}?format=png`

    const exportResponse = await fetch(exportUrl, {
      headers: {
        "X-Figma-Token": token,
      },
    })

    if (!exportResponse.ok) {
      return NextResponse.json(
        { error: "Failed to export design from Figma" },
        { status: 400 }
      )
    }

    const exportData = await exportResponse.json()
    const imageUrl = Object.values(exportData.images)[0] as string

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image URL returned from Figma" },
        { status: 400 }
      )
    }

    // Download image from Figma
    const imageResponse = await fetch(imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()

    // Upload to S3
    const fileName = `${uuidv4()}.png`
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: Buffer.from(imageBuffer),
      ContentType: "image/png",
    })

    await s3Client.send(command)

    const s3Url = `https://${bucketName}.s3.${process.env.APP_AWS_REGION || "us-east-1"}.amazonaws.com/${fileName}`

    console.log(`Successfully uploaded Figma design to S3: ${s3Url}`)

    return NextResponse.json(
      {
        success: true,
        url: s3Url,
        title: title || figmaData.name || "Design from Figma",
        description: description || "",
        fileName: fileName,
        figmaSource: figmaUrl,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error processing Figma design:", error)
    return NextResponse.json(
      {
        error: "Failed to process Figma design",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

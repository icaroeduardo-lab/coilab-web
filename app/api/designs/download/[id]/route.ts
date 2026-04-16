import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bucketName = process.env["BUCKET-DESIGN"]
    const region = process.env.AWS_REGION || "us-east-1"

    if (!bucketName) {
      return NextResponse.json(
        { error: "BUCKET-DESIGN environment variable is not set" },
        { status: 500 }
      )
    }

    // Construct S3 URL
    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${id}`

    // Fetch image from S3
    const response = await fetch(s3Url)

    if (!response.ok) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      )
    }

    // Get image data
    const buffer = await response.arrayBuffer()

    // Return with download headers
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${id}.png"`,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error: any) {
    console.error("Error downloading design:", error)
    return NextResponse.json(
      { error: "Failed to download design" },
      { status: 500 }
    )
  }
}

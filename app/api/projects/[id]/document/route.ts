import { NextResponse } from "next/server"
import { apiClient } from "@/lib/api-client"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

const s3 = new S3Client({ region: process.env.APP_AWS_REGION ?? "us-east-1" })

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const project = await apiClient.get<{ urlDocument?: string }>(`/projects/${id}`)

    if (!project.urlDocument) {
      return NextResponse.json({ error: "No document attached to this project" }, { status: 404 })
    }

    const url = new URL(project.urlDocument)
    const bucket = url.hostname.split(".")[0]
    const key = url.pathname.slice(1)

    const s3Res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
    const content = await s3Res.Body?.transformToString("utf-8")

    return new NextResponse(content ?? "", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

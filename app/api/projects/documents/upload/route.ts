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

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Arquivo é obrigatório" }, { status: 400 })
    }

    if (!file.name.endsWith(".md")) {
      return NextResponse.json(
        { error: "Apenas arquivos .md (Markdown) são aceitos" },
        { status: 400 }
      )
    }

    const bucketName = process.env.BUCKET_PROJECTS_DOCUMENTS
    if (!bucketName) {
      return NextResponse.json(
        { error: "BUCKET_PROJECTS_DOCUMENTS environment variable is not set" },
        { status: 500 }
      )
    }

    const projectNumber = formData.get("projectNumber") as string | null
    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = projectNumber ? `${uuidv4()}-${projectNumber}.md` : `${uuidv4()}.md`

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: "text/markdown",
      })
    )

    const documentPath = `https://${bucketName}.s3.${process.env.APP_AWS_REGION || "us-east-1"}.amazonaws.com/${fileName}`

    return NextResponse.json({ success: true, documentPath, fileName }, { status: 201 })
  } catch (error: any) {
    console.error("Error uploading document:", error)
    return NextResponse.json(
      { error: "Falha ao fazer upload do documento", details: error.message },
      { status: 500 }
    )
  }
}

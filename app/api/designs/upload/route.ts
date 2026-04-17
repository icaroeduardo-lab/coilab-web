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
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const taskNumber = formData.get("taskNumber") as string | null

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
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

    // Generate UUID for the file
    const fileExtension = file.name.split(".").pop()
    const fileName = taskNumber
      ? `${uuidv4()}-${taskNumber}.${fileExtension}`
      : `${uuidv4()}.${fileExtension}`

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    })

    await s3Client.send(command)

    // Construct the S3 URL
    const s3Url = `https://${bucketName}.s3.${process.env.APP_AWS_REGION || "us-east-1"}.amazonaws.com/${fileName}`

    console.log(`Successfully uploaded design to S3: ${s3Url}`)

    return NextResponse.json(
      {
        success: true,
        url: s3Url,
        title: title || "",
        description: description || "",
        fileName: fileName,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Error uploading to S3:", error)
    return NextResponse.json(
      { error: "Failed to upload design", details: error.message },
      { status: 500 }
    )
  }
}

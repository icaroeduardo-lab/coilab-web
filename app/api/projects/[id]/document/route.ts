import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { NextResponse } from "next/server"

const dynamoClient = new DynamoDBClient({
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || "",
  },
  region: process.env.APP_AWS_REGION || "us-east-1",
})
const docClient = DynamoDBDocumentClient.from(dynamoClient)

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || "",
  },
  region: process.env.APP_AWS_REGION || "us-east-1",
})

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tableName = process.env.DYNAMODB_TABLE_PROJECTS

    if (!tableName) {
      return NextResponse.json({ error: "DYNAMODB_TABLE_PROJECTS not set" }, { status: 500 })
    }

    const { Item } = await docClient.send(
      new GetCommand({ TableName: tableName, Key: { id } })
    )

    if (!Item?.documentPath) {
      return NextResponse.json({ error: "No document attached to this project" }, { status: 404 })
    }

    // Extract bucket and key from the S3 URL
    const url = new URL(Item.documentPath)
    const bucket = url.hostname.split(".")[0]
    const key = url.pathname.slice(1) // remove leading "/"

    const s3Res = await s3Client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    )

    const content = await s3Res.Body?.transformToString("utf-8")

    return new NextResponse(content ?? "", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

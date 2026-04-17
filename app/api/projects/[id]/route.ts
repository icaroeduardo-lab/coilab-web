import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import { NextResponse } from "next/server"

const client = new DynamoDBClient({
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || "",
  },
  region: process.env.APP_AWS_REGION || "us-east-1",
})
const docClient = DynamoDBDocumentClient.from(client)

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

    if (!Item) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(Item)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const tableName = process.env.DYNAMODB_TABLE_PROJECTS

    if (!tableName) {
      return NextResponse.json({ error: "DYNAMODB_TABLE_PROJECTS not set" }, { status: 500 })
    }

    const entries = Object.entries(body).filter(([, v]) => v !== undefined)
    const updateExpr = "SET " + entries.map((_, i) => `#k${i} = :v${i}`).join(", ")
    const names = Object.fromEntries(entries.map(([k], i) => [`#k${i}`, k]))
    const values = Object.fromEntries(entries.map(([, v], i) => [`:v${i}`, v]))

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: updateExpr,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      })
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

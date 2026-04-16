import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb"
import { NextResponse } from "next/server"

const client = new DynamoDBClient({
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || "",
  },
  region: process.env.APP_AWS_REGION || "us-east-1",
})
const docClient = DynamoDBDocumentClient.from(client)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId is required" },
        { status: 400 }
      )
    }

    const tableName = process.env.DYNAMODB_TABLE_TASKS

    if (!tableName) {
      return NextResponse.json(
        { error: "DYNAMODB_TABLE_TASKS environment variable is not set" },
        { status: 500 }
      )
    }

    const { Item } = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { id: taskId },
      })
    )

    if (!Item) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(Item.design || [])
  } catch (error: any) {
    console.error("Error fetching designs:", error)
    return NextResponse.json(
      { error: "Failed to fetch designs" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { taskId, designs } = body

    if (!taskId || !Array.isArray(designs)) {
      return NextResponse.json(
        { error: "taskId and designs array are required" },
        { status: 400 }
      )
    }

    const tableName = process.env.DYNAMODB_TABLE_TASKS

    if (!tableName) {
      return NextResponse.json(
        { error: "DYNAMODB_TABLE_TASKS environment variable is not set" },
        { status: 500 }
      )
    }

    // Validate design objects
    const validatedDesigns = designs.map((design) => ({
      id: design.id || Date.now().toString(),
      url: design.url,
      title: design.title || "",
      description: design.description || "",
    }))

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id: taskId },
        UpdateExpression: "SET #design = :designs",
        ExpressionAttributeNames: {
          "#design": "design",
        },
        ExpressionAttributeValues: {
          ":designs": validatedDesigns,
        },
      })
    )

    console.log(`Successfully updated designs for task ${taskId}`)

    return NextResponse.json(
      { success: true, designs: validatedDesigns },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Error updating designs:", error)
    return NextResponse.json(
      { error: "Failed to update designs", details: error.message },
      { status: 500 }
    )
  }
}

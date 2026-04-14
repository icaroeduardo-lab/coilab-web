import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, priority, description } = body;

    const tableName = process.env["DYNAMODB-TABLE-PROJECTS"];

    if (!tableName) {
      return NextResponse.json(
        { error: "DYNAMODB-TABLE-PROJECTS environment variable is not set" },
        { status: 500 }
      );
    }

    const item = {
      id: uuidv4(),
      name,
      priority,
      description,
      createdAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    console.error("Error saving to DynamoDB:", error);
    return NextResponse.json(
      { error: "Failed to save project" },
      { status: 500 }
    );
  }
}

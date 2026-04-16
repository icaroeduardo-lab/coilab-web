import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const docClient = DynamoDBDocumentClient.from(client);

export async function GET() {
  try {
    const tableName = process.env.DYNAMODB_TABLE_PROJECTS;

    if (!tableName) {
      return NextResponse.json(
        { error: "DYNAMODB_TABLE_PROJECTS environment variable is not set" },
        { status: 500 }
      );
    }

    const { Items } = await docClient.send(
      new ScanCommand({
        TableName: tableName,
      })
    );

    return NextResponse.json(Items || []);
  } catch (error: any) {
    console.error("Error fetching projects from DynamoDB:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, applicant, priority, description } = body;

    const tableName = process.env.DYNAMODB_TABLE_PROJECTS;

    if (!tableName) {
      console.error("DYNAMODB_TABLE_PROJECTS environment variable is not set");
      return NextResponse.json(
        { error: "DYNAMODB_TABLE_PROJECTS environment variable is not set" },
        { status: 500 }
      );
    }

    const item = {
      id: uuidv4(),
      name,
      applicant,
      priority,
      description,
      status: "Backlog",
      createdAt: new Date().toISOString(),
    };

    console.log("Attempting to save item to DynamoDB (projects):", { tableName, item });

    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );

    console.log("Successfully saved item to DynamoDB (projects)");
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error("Error saving to DynamoDB (projects) detail:", {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: "Failed to save project", details: error.message },
      { status: 500 }
    );
  }
}

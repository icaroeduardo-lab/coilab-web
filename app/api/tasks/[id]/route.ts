import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const docClient = DynamoDBDocumentClient.from(client);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tableName = process.env.DYNAMODB_TABLE_TASKS;

    if (!tableName) {
      return NextResponse.json(
        { error: "DYNAMODB_TABLE_TASKS environment variable is not set" },
        { status: 500 }
      );
    }

    const { Item } = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { id },
      })
    );

    if (!Item) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(Item);
  } catch (error: any) {
    console.error("Error fetching task from DynamoDB:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, phases } = body;

    const tableName = process.env.DYNAMODB_TABLE_TASKS;

    if (!tableName) {
      return NextResponse.json(
        { error: "DYNAMODB_TABLE_TASKS environment variable is not set" },
        { status: 500 }
      );
    }

    if (!status && !phases) {
      return NextResponse.json(
        { error: "Status or phases is required" },
        { status: 400 }
      );
    }

    let UpdateExpression = "set ";
    const ExpressionAttributeValues: Record<string, any> = {};
    let parts: string[] = [];

    if (status) {
      parts.push("#status = :s");
      ExpressionAttributeValues[":s"] = status;
    }

    if (phases) {
      parts.push("phases = :p");
      ExpressionAttributeValues[":p"] = phases;
    }

    UpdateExpression += parts.join(", ");

    const updateParams: any = {
      TableName: tableName,
      Key: { id },
      UpdateExpression,
      ExpressionAttributeValues,
    };

    // Only include ExpressionAttributeNames if it has content
    if (status) {
      updateParams.ExpressionAttributeNames = { "#status": "status" };
    }

    await docClient.send(new UpdateCommand(updateParams));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating task in DynamoDB:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

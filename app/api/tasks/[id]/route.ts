import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || "",
  },
  region: process.env.APP_AWS_REGION || "us-east-1",
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
    const { status, name, description, project, applicant, priority } = body;

    const tableName = process.env.DYNAMODB_TABLE_TASKS;

    if (!tableName) {
      return NextResponse.json(
        { error: "DYNAMODB_TABLE_TASKS environment variable is not set" },
        { status: 500 }
      );
    }

    const editableFields = { name, description, project, applicant, priority };
    const hasEditField = Object.values(editableFields).some(v => v !== undefined);

    if (!status && !hasEditField) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    // Edit basic task fields
    if (hasEditField && !status) {
      const parts: string[] = [];
      const exprValues: Record<string, any> = {};
      const exprNames: Record<string, string> = {};
      if (name !== undefined) { parts.push("#n = :n"); exprNames["#n"] = "name"; exprValues[":n"] = name; }
      if (description !== undefined) { parts.push("description = :d"); exprValues[":d"] = description; }
      if (project !== undefined) { parts.push("project = :pr"); exprValues[":pr"] = project; }
      if (applicant !== undefined) { parts.push("applicant = :a"); exprValues[":a"] = applicant; }
      if (priority !== undefined) { parts.push("priority = :pi"); exprValues[":pi"] = priority; }

      await docClient.send(new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: `set ${parts.join(", ")}`,
        ExpressionAttributeValues: exprValues,
        ...(Object.keys(exprNames).length > 0 && { ExpressionAttributeNames: exprNames }),
      }));
      return NextResponse.json({ success: true });
    }

    await docClient.send(new UpdateCommand({
      TableName: tableName,
      Key: { id },
      UpdateExpression: "set #status = :s",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":s": status },
    }));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating task in DynamoDB:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await docClient.send(new DeleteCommand({ TableName: tableName, Key: { id } }));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting task from DynamoDB:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}

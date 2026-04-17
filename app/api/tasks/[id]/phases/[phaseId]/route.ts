import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || "",
  },
  region: process.env.APP_AWS_REGION || "us-east-1",
});
const docClient = DynamoDBDocumentClient.from(client);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  try {
    const { id, phaseId } = await params;
    const body = await request.json();
    const { action, notes, checklist } = body as {
      action: "start" | "complete" | "reopen";
      notes?: string;
      checklist?: { id: string; label: string; completed: boolean }[];
    };

    const tableName = process.env.DYNAMODB_TABLE_TASKS;
    if (!tableName) {
      return NextResponse.json(
        { error: "DYNAMODB_TABLE_TASKS environment variable is not set" },
        { status: 500 }
      );
    }

    const { Item } = await docClient.send(
      new GetCommand({ TableName: tableName, Key: { id } })
    );

    if (!Item) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const phases: any[] = Item.phases || [];
    const phaseIndex = phases.findIndex((p: any) => p.id === phaseId);

    if (phaseIndex === -1) {
      return NextResponse.json({ error: "Phase not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const phase = { ...phases[phaseIndex] };

    if (action === "start") {
      phase.status = "in_progress";
      phase.startedAt = now;
    } else if (action === "complete") {
      phase.status = "completed";
      phase.completedAt = now;
      if (notes !== undefined) phase.notes = notes;
      if (checklist !== undefined) phase.checklist = checklist;
    } else if (action === "reopen") {
      phase.status = "in_progress";
      delete phase.completedAt;
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    phases[phaseIndex] = phase;

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: "set phases = :p",
        ExpressionAttributeValues: { ":p": phases },
      })
    );

    return NextResponse.json({ success: true, phase });
  } catch (error: any) {
    console.error("Error updating phase:", error);
    return NextResponse.json({ error: "Failed to update phase" }, { status: 500 });
  }
}

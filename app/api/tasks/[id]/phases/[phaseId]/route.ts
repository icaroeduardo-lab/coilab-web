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

/**
 * For each base type (discovery, design, …) find the phase with the
 * highest order — that is the "latest" version of that subtask.
 * Rules:
 *  → Checkout : every latest-per-type is "completed" or "approved"
 *  → Em Execução (from Checkout): any latest-per-type is "rejected" / "in_progress" / "not_started"
 */
function deriveTaskStatus(phases: any[], currentTaskStatus: string): string | null {
  const enabled = phases.filter((p: any) => p.enabled);
  if (enabled.length === 0) return null;

  // Build a map: baseType → phase with highest order
  const latestByBase = new Map<string, any>();
  for (const phase of enabled) {
    const base = (phase.id as string).split("_")[0];
    const current = latestByBase.get(base);
    if (!current || (phase.order ?? 0) > (current.order ?? 0)) {
      latestByBase.set(base, phase);
    }
  }

  const latestPhases = [...latestByBase.values()];

  const allReadyForCheckout = latestPhases.every((p: any) =>
    ["completed", "approved"].includes(p.status)
  );

  const hasBlocker = latestPhases.some((p: any) =>
    ["rejected", "in_progress", "not_started"].includes(p.status)
  );

  if (allReadyForCheckout && currentTaskStatus === "Em Execução") return "Checkout";
  if (hasBlocker && currentTaskStatus === "Checkout") return "Em Execução";

  return null;
}

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

    if (!Item) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const phases: any[] = Item.phases || [];
    const phaseIndex = phases.findIndex((p: any) => p.id === phaseId);
    if (phaseIndex === -1) return NextResponse.json({ error: "Phase not found" }, { status: 404 });

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

    let newTaskStatus: string | null = null;

    if (action === "start" && (Item.status === "Backlog" || !Item.status)) {
      newTaskStatus = "Em Execução";
    } else if (action === "complete" || action === "reopen") {
      newTaskStatus = deriveTaskStatus(phases, Item.status);
    }

    const updateExpression = newTaskStatus
      ? "set phases = :p, #s = :s"
      : "set phases = :p";
    const expressionAttributeValues: Record<string, any> = { ":p": phases };
    const expressionAttributeNames: Record<string, string> | undefined = newTaskStatus
      ? { "#s": "status" }
      : undefined;
    if (newTaskStatus) expressionAttributeValues[":s"] = newTaskStatus;

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ...(expressionAttributeNames && { ExpressionAttributeNames: expressionAttributeNames }),
      })
    );

    const taskStatus = newTaskStatus ?? Item.status;
    return NextResponse.json({ success: true, phase, taskStatus });
  } catch (error: any) {
    console.error("Error updating phase:", error);
    return NextResponse.json({ error: "Failed to update phase" }, { status: 500 });
  }
}

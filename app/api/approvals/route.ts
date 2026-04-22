import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth";

const client = new DynamoDBClient({
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || "",
  },
  region: process.env.APP_AWS_REGION || "us-east-1",
});
const docClient = DynamoDBDocumentClient.from(client);

const APPROVALS_TABLE = "coilab-approvals";

/**
 * For each base type, find the latest version (highest order).
 * → Checkout : all latest are "completed" or "approved"
 * → Em Execução : any latest is "rejected" / "in_progress" / "not_started"
 */
function deriveKanbanStatus(phases: any[], currentStatus: string, wasRejected: boolean): string | null {
  const enabled = phases.filter((p: any) => p.enabled);
  if (enabled.length === 0) return null;

  const latestByBase = new Map<string, any>();
  for (const phase of enabled) {
    const base = (phase.id as string).split("_")[0];
    const cur = latestByBase.get(base);
    if (!cur || (phase.order ?? 0) > (cur.order ?? 0)) latestByBase.set(base, phase);
  }

  const latestPhases = [...latestByBase.values()];
  const allReadyForCheckout = latestPhases.every((p: any) =>
    ["completed", "approved"].includes(p.status)
  );
  const hasBlocker = latestPhases.some((p: any) =>
    ["rejected", "in_progress", "not_started"].includes(p.status)
  );

  if (allReadyForCheckout && (currentStatus === "Em Execução" || currentStatus === "Checkout")) return "Checkout";
  if (hasBlocker && (currentStatus === "Checkout" || wasRejected)) return "Em Execução";
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const phaseId = searchParams.get("phaseId");

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const { Items } = await docClient.send(
      new QueryCommand({
        TableName: APPROVALS_TABLE,
        IndexName: "taskId-index",
        KeyConditionExpression: "taskId = :taskId",
        ExpressionAttributeValues: { ":taskId": taskId },
      })
    );

    let results = (Items || []) as any[];
    if (phaseId) {
      results = results.filter((item) => item.phaseId === phaseId);
    }

    results.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching approvals:", error);
    return NextResponse.json({ error: "Failed to fetch approvals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const { taskId, phaseId, status, comment } = body as {
      taskId: string;
      phaseId: string;
      status: "approved" | "rejected";
      comment?: string;
    };

    if (!taskId || !phaseId || !status) {
      return NextResponse.json({ error: "taskId, phaseId and status are required" }, { status: 400 });
    }

    if (status === "rejected" && !comment?.trim()) {
      return NextResponse.json({ error: "Justificativa é obrigatória ao reprovar" }, { status: 400 });
    }

    // Block if an approval already exists for this phase
    const { Items: existing } = await docClient.send(
      new QueryCommand({
        TableName: APPROVALS_TABLE,
        IndexName: "taskId-index",
        KeyConditionExpression: "taskId = :taskId",
        ExpressionAttributeValues: { ":taskId": taskId },
      })
    );
    const alreadyDecided = (existing || []).some((a: any) => a.phaseId === phaseId);
    if (alreadyDecided) {
      return NextResponse.json({ error: "Esta fase já foi aprovada ou reprovada" }, { status: 409 });
    }

    const approval = {
      id: uuidv4(),
      taskId,
      phaseId,
      status,
      comment: comment?.trim() || "",
      approvedBy: session?.user?.name || "Usuário",
      createdAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({ TableName: APPROVALS_TABLE, Item: approval }));

    // Update phase status and derive new task kanban status
    const tasksTable = process.env.DYNAMODB_TABLE_TASKS;
    if (tasksTable) {
      const { Item } = await docClient.send(
        new GetCommand({ TableName: tasksTable, Key: { id: taskId } })
      );
      if (Item) {
        const phases: any[] = Item.phases || [];

        // Lock current phase as approved or rejected
        let updatedPhases = phases.map((p: any) =>
          p.id === phaseId ? { ...p, status } : p
        );

        // On rejection: create a new phase of the same type
        if (status === "rejected") {
          const baseType = phaseId.split("_")[0];
          const roundCount = phases.filter(
            (p: any) => p.id === baseType || p.id.startsWith(baseType + "_")
          ).length;
          const newPhaseId = `${baseType}_${roundCount + 1}`;
          const baseName = baseType.charAt(0).toUpperCase() + baseType.slice(1);
          const maxOrder = phases.reduce((max: number, p: any) => Math.max(max, p.order || 0), 0);
          updatedPhases = [
            ...updatedPhases,
            {
              id: newPhaseId,
              name: `${baseName} ${roundCount + 1}`,
              order: maxOrder + 1,
              enabled: true,
              status: "not_started",
              checklist: [],
            },
          ];
        }

        // Derive kanban status using latest-per-type rule
        const newTaskStatus = deriveKanbanStatus(updatedPhases, Item.status, status === "rejected");

        const updateExpr = newTaskStatus
          ? "set phases = :p, #s = :s, hasRejection = :r"
          : "set phases = :p, hasRejection = :r";
        const exprNames: Record<string, string> = newTaskStatus ? { "#s": "status" } : {};
        const exprValues: Record<string, any> = {
          ":p": updatedPhases,
          ":r": status === "rejected",
        };
        if (newTaskStatus) exprValues[":s"] = newTaskStatus;

        await docClient.send(
          new UpdateCommand({
            TableName: tasksTable,
            Key: { id: taskId },
            UpdateExpression: updateExpr,
            ExpressionAttributeValues: exprValues,
            ...(Object.keys(exprNames).length > 0 && { ExpressionAttributeNames: exprNames }),
          })
        );
      }
    }

    return NextResponse.json(approval);
  } catch (error) {
    console.error("Error creating approval:", error);
    return NextResponse.json({ error: "Failed to create approval" }, { status: 500 });
  }
}

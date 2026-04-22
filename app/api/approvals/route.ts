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
const SUBTASKS_TABLE = process.env.DYNAMODB_TABLE_SUBTASKS || "coilab-subtasks";

function deriveKanbanStatus(subtasks: any[], currentStatus: string, wasRejected: boolean): string | null {
  if (subtasks.length === 0) return null;

  const latestByBase = new Map<string, any>();
  for (const s of subtasks) {
    const base = s.baseType;
    const cur = latestByBase.get(base);
    if (!cur || (s.order ?? 0) > (cur.order ?? 0)) latestByBase.set(base, s);
  }
  const latest = [...latestByBase.values()];

  const allReady = latest.every(s => ["completed", "approved"].includes(s.status));
  const hasBlocker = latest.some(s => ["rejected", "in_progress", "not_started"].includes(s.status));

  if (allReady && (currentStatus === "Em Execução" || currentStatus === "Checkout")) return "Checkout";
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
      results = results.filter(item => item.phaseId === phaseId);
    }

    results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
      return NextResponse.json(
        { error: "taskId, phaseId and status are required" },
        { status: 400 }
      );
    }

    if (status === "rejected" && !comment?.trim()) {
      return NextResponse.json(
        { error: "Justificativa é obrigatória ao reprovar" },
        { status: 400 }
      );
    }

    // Block if already decided for this phase
    const { Items: existing } = await docClient.send(
      new QueryCommand({
        TableName: APPROVALS_TABLE,
        IndexName: "taskId-index",
        KeyConditionExpression: "taskId = :taskId",
        ExpressionAttributeValues: { ":taskId": taskId },
      })
    );
    if ((existing || []).some((a: any) => a.phaseId === phaseId)) {
      return NextResponse.json(
        { error: "Esta fase já foi aprovada ou reprovada" },
        { status: 409 }
      );
    }

    // Save approval record
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

    // Update subtask status
    const { Item: subtask } = await docClient.send(
      new GetCommand({ TableName: SUBTASKS_TABLE, Key: { id: phaseId } })
    );

    let newSubtask: any = null;

    if (subtask) {
      await docClient.send(
        new UpdateCommand({
          TableName: SUBTASKS_TABLE,
          Key: { id: phaseId },
          UpdateExpression: "set #s = :s",
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: { ":s": status },
        })
      );

      if (status === "rejected") {
        // Fetch all subtasks for this task to compute round count and max order
        const { Items: taskSubtasks } = await docClient.send(
          new QueryCommand({
            TableName: SUBTASKS_TABLE,
            IndexName: "taskId-index",
            KeyConditionExpression: "taskId = :tid",
            ExpressionAttributeValues: { ":tid": taskId },
          })
        );
        const all = taskSubtasks || [];
        const sameBase = all.filter(s => s.baseType === subtask.baseType);
        const maxOrder = all.reduce((m: number, s: any) => Math.max(m, s.order ?? 0), 0);
        const baseName = subtask.baseType.charAt(0).toUpperCase() + subtask.baseType.slice(1);

        newSubtask = {
          id: uuidv4(),
          taskId,
          name: `${baseName} ${sameBase.length + 1}`,
          baseType: subtask.baseType,
          order: maxOrder + 1,
          status: "not_started",
          notes: "",
          checklist: [],
          createdAt: new Date().toISOString(),
        };
        await docClient.send(new PutCommand({ TableName: SUBTASKS_TABLE, Item: newSubtask }));
      }
    }

    // Derive new task kanban status
    const tasksTable = process.env.DYNAMODB_TABLE_TASKS;
    if (tasksTable) {
      const { Item: task } = await docClient.send(
        new GetCommand({ TableName: tasksTable, Key: { id: taskId } })
      );
      if (task) {
        const { Items: allSubtasks } = await docClient.send(
          new QueryCommand({
            TableName: SUBTASKS_TABLE,
            IndexName: "taskId-index",
            KeyConditionExpression: "taskId = :tid",
            ExpressionAttributeValues: { ":tid": taskId },
          })
        );
        const updatedList = (allSubtasks || []).map(s =>
          s.id === phaseId ? { ...s, status } : s
        );
        if (newSubtask) updatedList.push(newSubtask);

        const newTaskStatus = deriveKanbanStatus(updatedList, task.status, status === "rejected");

        const updateExpr = newTaskStatus
          ? "set #s = :s, hasRejection = :r"
          : "set hasRejection = :r";
        const exprValues: Record<string, any> = { ":r": status === "rejected" };
        const exprNames: Record<string, string> = newTaskStatus ? { "#s": "status" } : {};
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

    return NextResponse.json({ ...approval, newSubtask });
  } catch (error) {
    console.error("Error creating approval:", error);
    return NextResponse.json({ error: "Failed to create approval" }, { status: 500 });
  }
}

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || "",
  },
  region: process.env.APP_AWS_REGION || "us-east-1",
});
const docClient = DynamoDBDocumentClient.from(client);

const SUBTASKS_TABLE = process.env.DYNAMODB_TABLE_SUBTASKS || "coilab-subtasks";

function deriveKanbanStatus(subtasks: any[], currentStatus: string, wasRejected = false): string | null {
  if (subtasks.length === 0) return null;

  const latestByBase = new Map<string, any>();
  for (const s of subtasks) {
    const base = s.baseType;
    const cur = latestByBase.get(base);
    if (!cur || (s.order ?? 0) > (cur.order ?? 0)) latestByBase.set(base, s);
  }
  const latest = [...latestByBase.values()];

  const hasAnyStarted = latest.some(s =>
    ["in_progress", "completed", "approved", "rejected"].includes(s.status)
  );
  const allReady = latest.every(s => ["completed", "approved"].includes(s.status));
  const hasBlocker = latest.some(s =>
    ["rejected", "in_progress", "not_started"].includes(s.status)
  );

  if (currentStatus === "Backlog" && hasAnyStarted) return "Em Execução";
  if (currentStatus === "Em Execução" && allReady) return "Checkout";
  if ((currentStatus === "Checkout" || wasRejected) && hasBlocker) return "Em Execução";
  return null;
}

async function getTaskSubtasks(taskId: string): Promise<any[]> {
  const { Items } = await docClient.send(
    new QueryCommand({
      TableName: SUBTASKS_TABLE,
      IndexName: "taskId-index",
      KeyConditionExpression: "taskId = :tid",
      ExpressionAttributeValues: { ":tid": taskId },
    })
  );
  return Items || [];
}

async function syncTaskKanbanStatus(taskId: string, subtasks: any[], wasRejected = false): Promise<string | null> {
  const tasksTable = process.env.DYNAMODB_TABLE_TASKS;
  if (!tasksTable) return null;

  const { Item: task } = await docClient.send(
    new GetCommand({ TableName: tasksTable, Key: { id: taskId } })
  );
  if (!task) return null;

  const newStatus = deriveKanbanStatus(subtasks, task.status, wasRejected);
  if (!newStatus) return null;

  await docClient.send(
    new UpdateCommand({
      TableName: tasksTable,
      Key: { id: taskId },
      UpdateExpression: "set #s = :s",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":s": newStatus },
    })
  );
  return newStatus;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { Item } = await docClient.send(
      new GetCommand({ TableName: SUBTASKS_TABLE, Key: { id } })
    );
    if (!Item) return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    return NextResponse.json(Item);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch subtask" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, notes, checklist, discoveryData } = body;

    const { Item: subtask } = await docClient.send(
      new GetCommand({ TableName: SUBTASKS_TABLE, Key: { id } })
    );
    if (!subtask) return NextResponse.json({ error: "Subtask not found" }, { status: 404 });

    const now = new Date().toISOString();
    const setFields: Record<string, any> = {};
    const removeFields: string[] = [];

    if (action === "start") {
      setFields.status = "in_progress";
      setFields.startedAt = now;
    } else if (action === "complete") {
      setFields.status = "completed";
      setFields.completedAt = now;
      if (notes !== undefined) setFields.notes = notes;
      if (checklist !== undefined) setFields.checklist = checklist;
    } else if (action === "reopen") {
      setFields.status = "in_progress";
      removeFields.push("completedAt");
    } else {
      if (notes !== undefined) setFields.notes = notes;
      if (checklist !== undefined) setFields.checklist = checklist;
      if (discoveryData !== undefined) setFields.discoveryData = discoveryData;
    }

    if (Object.keys(setFields).length === 0 && removeFields.length === 0) {
      return NextResponse.json({ success: true, subtask });
    }

    const exprNames: Record<string, string> = {};
    const exprValues: Record<string, any> = {};
    const setParts = Object.keys(setFields).map((k, i) => {
      exprNames[`#f${i}`] = k;
      exprValues[`:v${i}`] = setFields[k];
      return `#f${i} = :v${i}`;
    });
    const removeParts = removeFields.map((k, i) => {
      exprNames[`#r${i}`] = k;
      return `#r${i}`;
    });

    let updateExpr = "";
    if (setParts.length > 0) updateExpr += `SET ${setParts.join(", ")}`;
    if (removeParts.length > 0) updateExpr += ` REMOVE ${removeParts.join(", ")}`;

    await docClient.send(
      new UpdateCommand({
        TableName: SUBTASKS_TABLE,
        Key: { id },
        UpdateExpression: updateExpr.trim(),
        ExpressionAttributeNames: exprNames,
        ...(Object.keys(exprValues).length > 0 && { ExpressionAttributeValues: exprValues }),
      })
    );

    const updatedSubtask = { ...subtask, ...setFields };
    const allSubtasks = await getTaskSubtasks(subtask.taskId);
    const updatedList = allSubtasks.map(s => (s.id === id ? updatedSubtask : s));
    const taskStatus = await syncTaskKanbanStatus(subtask.taskId, updatedList);

    return NextResponse.json({ success: true, subtask: updatedSubtask, taskStatus });
  } catch (error: any) {
    console.error("Error updating subtask:", error);
    return NextResponse.json({ error: "Failed to update subtask" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { Item: subtask } = await docClient.send(
      new GetCommand({ TableName: SUBTASKS_TABLE, Key: { id } })
    );
    if (!subtask) return NextResponse.json({ error: "Subtask not found" }, { status: 404 });

    await docClient.send(new DeleteCommand({ TableName: SUBTASKS_TABLE, Key: { id } }));

    const remaining = await getTaskSubtasks(subtask.taskId);
    await syncTaskKanbanStatus(subtask.taskId, remaining);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting subtask:", error);
    return NextResponse.json({ error: "Failed to delete subtask" }, { status: 500 });
  }
}

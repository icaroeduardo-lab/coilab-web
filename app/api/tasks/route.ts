import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY || "",
  },
  region: process.env.APP_AWS_REGION || "us-east-1",
});
const docClient = DynamoDBDocumentClient.from(client);

function deriveKanbanStatus(subtasks: any[], currentStatus: string): string | null {
  if (subtasks.length === 0) return null;

  const latestByBase = new Map<string, any>();
  for (const s of subtasks) {
    const base = s.baseType || (s.id as string).split("_")[0];
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
  if (currentStatus === "Checkout" && hasBlocker) return "Em Execução";
  return null;
}

export async function GET(request: Request) {
  try {
    const tableName = process.env.DYNAMODB_TABLE_TASKS;
    const subtasksTable = process.env.DYNAMODB_TABLE_SUBTASKS || "coilab-subtasks";
    const { searchParams } = new URL(request.url);
    const projectFilter = searchParams.get("project");

    if (!tableName) {
      return NextResponse.json(
        { error: "DYNAMODB_TABLE_TASKS environment variable is not set" },
        { status: 500 }
      );
    }

    const { Items } = await docClient.send(new ScanCommand({ TableName: tableName }));
    let tasks = (Items || []).filter(
      (item: any) => !String(item.id).startsWith("COUNTER#")
    );

    if (projectFilter) {
      tasks = tasks.filter(
        (item: any) =>
          String(item.project || "").toLowerCase() === projectFilter.toLowerCase()
      );
    }

    // Build subtasks map for kanban status auto-correction
    const subtasksByTask = new Map<string, any[]>();
    try {
      const { Items: allSubtasks } = await docClient.send(
        new ScanCommand({ TableName: subtasksTable })
      );
      for (const s of allSubtasks || []) {
        const list = subtasksByTask.get(s.taskId) || [];
        list.push(s);
        subtasksByTask.set(s.taskId, list);
      }
    } catch {
      // subtasks table may not exist yet — skip auto-correction
    }

    const updates: { id: string; status: string }[] = [];

    tasks = tasks.map((task: any) => {
      const taskSubtasks = subtasksByTask.get(task.id);

      // If we have subtasks in the new table, use those for auto-correction
      if (taskSubtasks && taskSubtasks.length > 0) {
        const corrected = deriveKanbanStatus(taskSubtasks, task.status);
        if (corrected && corrected !== task.status) {
          updates.push({ id: task.id, status: corrected });
          return { ...task, status: corrected };
        }
        return task;
      }

      // Fallback: use embedded phases (legacy data)
      const enabled = ((task.phases || []) as any[]).filter((p: any) => p.enabled);
      if (enabled.length === 0) return task;

      const corrected = deriveKanbanStatus(enabled, task.status);
      if (corrected && corrected !== task.status) {
        updates.push({ id: task.id, status: corrected });
        return { ...task, status: corrected };
      }
      return task;
    });

    if (updates.length > 0) {
      await Promise.all(
        updates.map(({ id, status }) =>
          docClient.send(
            new UpdateCommand({
              TableName: tableName,
              Key: { id },
              UpdateExpression: "set #s = :s",
              ExpressionAttributeNames: { "#s": "status" },
              ExpressionAttributeValues: { ":s": status },
            })
          )
        )
      );
    }

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error("Error fetching tasks from DynamoDB:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

async function getNextTaskNumber(tableName: string, year: number): Promise<string> {
  const result = await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { id: `COUNTER#${year}` },
      UpdateExpression: "ADD #seq :inc",
      ExpressionAttributeNames: { "#seq": "seq" },
      ExpressionAttributeValues: { ":inc": 1 },
      ReturnValues: "UPDATED_NEW",
    })
  );
  const seq = result.Attributes?.seq as number;
  return `${year}${String(seq).padStart(4, "0")}`;
}

const DEFAULT_PHASES = [
  { id: "discovery", name: "Discovery", order: 0 },
  { id: "design", name: "Design", order: 1 },
  { id: "development", name: "Development", order: 2 },
  { id: "testes", name: "Testes", order: 3 },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name, project, priority, description, applicant,
      phases: selectedPhases = [],
      flows: selectedFlows = [],
      phaseDueDates = {},
    } = body;

    const tableName = process.env.DYNAMODB_TABLE_TASKS;
    const subtasksTable = process.env.DYNAMODB_TABLE_SUBTASKS || "coilab-subtasks";
    const flowsTableName = process.env.DYNAMODB_TABLE_FLOWS || "coilab-flow";

    if (!tableName) {
      return NextResponse.json(
        { error: "DYNAMODB_TABLE_TASKS environment variable is not set" },
        { status: 500 }
      );
    }

    // Fetch flow data
    let flowsData: any[] = [];
    if (selectedFlows.length > 0) {
      try {
        const { Items } = await docClient.send(new ScanCommand({ TableName: flowsTableName }));
        flowsData = (Items || []).filter((item: any) => selectedFlows.includes(item.id));
      } catch {
        flowsData = selectedFlows.map((id: string) => ({ id, name: id }));
      }
    }

    const year = new Date().getFullYear();
    const taskNumber = await getNextTaskNumber(tableName, year);
    const taskId = uuidv4();

    const item = {
      id: taskId,
      taskNumber,
      name,
      project,
      applicant,
      priority,
      description,
      status: "Backlog",
      createdAt: new Date().toISOString(),
      flows: flowsData,
    };

    await docClient.send(new PutCommand({ TableName: tableName, Item: item }));

    // Create subtasks in the dedicated table
    const selectedDefs = DEFAULT_PHASES.filter(p => selectedPhases.includes(p.id));
    if (selectedDefs.length > 0) {
      await Promise.all(
        selectedDefs.map(p =>
          docClient.send(
            new PutCommand({
              TableName: subtasksTable,
              Item: {
                id: uuidv4(),
                taskId,
                name: p.name,
                baseType: p.id,
                order: p.order,
                status: "not_started",
                notes: "",
                checklist: [],
                createdAt: new Date().toISOString(),
                ...(phaseDueDates[p.id] ? { dueDate: phaseDueDates[p.id] } : {}),
              },
            })
          )
        )
      );
    }

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error("Error saving task:", error);
    return NextResponse.json(
      { error: "Failed to save task", details: error.message },
      { status: 500 }
    );
  }
}

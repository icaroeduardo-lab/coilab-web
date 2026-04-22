import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
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

const SUBTASKS_TABLE = process.env.DYNAMODB_TABLE_SUBTASKS || "coilab-subtasks";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const { Items } = await docClient.send(
      new QueryCommand({
        TableName: SUBTASKS_TABLE,
        IndexName: "taskId-index",
        KeyConditionExpression: "taskId = :tid",
        ExpressionAttributeValues: { ":tid": taskId },
      })
    );

    let subtasks = ((Items || []) as any[]).sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );

    // Auto-migrate: if no subtasks found, check task's embedded phases (legacy data)
    if (subtasks.length === 0) {
      const tasksTable = process.env.DYNAMODB_TABLE_TASKS;
      if (tasksTable) {
        const { Item: task } = await docClient.send(
          new GetCommand({ TableName: tasksTable, Key: { id: taskId } })
        );
        const phases = ((task?.phases || []) as any[]).filter((p: any) => p.enabled);
        if (phases.length > 0) {
          const migrated = await Promise.all(
            phases.map(async (phase: any) => {
              const subtask = {
                id: uuidv4(),
                taskId,
                name: phase.name,
                baseType: (phase.id as string).split("_")[0],
                order: phase.order ?? 0,
                status: phase.status || "not_started",
                notes: phase.notes || "",
                checklist: phase.checklist || [],
                ...(phase.dueDate ? { dueDate: phase.dueDate } : {}),
                ...(phase.startedAt ? { startedAt: phase.startedAt } : {}),
                ...(phase.completedAt ? { completedAt: phase.completedAt } : {}),
                ...(phase.discoveryData ? { discoveryData: phase.discoveryData } : {}),
              };
              await docClient.send(new PutCommand({ TableName: SUBTASKS_TABLE, Item: subtask }));
              return subtask;
            })
          );
          subtasks = migrated.sort((a, b) => a.order - b.order);
        }
      }
    }

    return NextResponse.json(subtasks);
  } catch (error: any) {
    console.error("Error fetching subtasks:", error);
    return NextResponse.json({ error: "Failed to fetch subtasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId, name, baseType, order, dueDate } = body;

    if (!taskId || !name || !baseType) {
      return NextResponse.json(
        { error: "taskId, name and baseType are required" },
        { status: 400 }
      );
    }

    const subtask = {
      id: uuidv4(),
      taskId,
      name,
      baseType,
      order: order ?? 0,
      status: "not_started",
      notes: "",
      checklist: [],
      createdAt: new Date().toISOString(),
      ...(dueDate ? { dueDate } : {}),
    };

    await docClient.send(new PutCommand({ TableName: SUBTASKS_TABLE, Item: subtask }));
    return NextResponse.json(subtask, { status: 201 });
  } catch (error: any) {
    console.error("Error creating subtask:", error);
    return NextResponse.json({ error: "Failed to create subtask" }, { status: 500 });
  }
}

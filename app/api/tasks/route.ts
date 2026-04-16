import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({
  region: process.env.APP_AWS_REGION || "us-east-1",
});
const docClient = DynamoDBDocumentClient.from(client);

export async function GET() {
  try {
    const tableName = process.env["DYNAMODB-TABLE-TASKS"];

    if (!tableName) {
      return NextResponse.json(
        { error: "DYNAMODB-TABLE-TASKS environment variable is not set" },
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
    console.error("Error fetching tasks from DynamoDB:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
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
    const { name, project, priority, description, applicant, phases: selectedPhases = [], flows: selectedFlows = [] } = body;

    const tableName = process.env.DYNAMODB_TABLE_TASKS;
    const flowsTableName = process.env.DYNAMODB_TABLE_FLOWS || "coilab-flow";

    if (!tableName) {
      console.error("DYNAMODB-TABLE-TASKS environment variable is not set");
      return NextResponse.json(
        { error: "DYNAMODB-TABLE-TASKS environment variable is not set" },
        { status: 500 }
      );
    }

    const phases = DEFAULT_PHASES.map(p => ({
      ...p,
      enabled: selectedPhases.includes(p.id),
      status: "not_started",
      notes: "",
      checklist: [],
    }));

    // Fetch flow data from coilab-flow table
    let flowsData: any[] = [];
    if (selectedFlows.length > 0) {
      try {
        const { Items } = await docClient.send(
          new ScanCommand({
            TableName: flowsTableName,
          })
        );

        flowsData = (Items || []).filter((item: any) => selectedFlows.includes(item.id));
      } catch (error) {
        console.warn("Could not fetch flows data:", error);
        // Still create the task even if flows fetch fails
        flowsData = selectedFlows.map((id: string) => ({ id, name: id }));
      }
    }

    const item = {
      id: uuidv4(),
      name,
      project,
      applicant,
      priority,
      description,
      status: "Backlog",
      createdAt: new Date().toISOString(),
      phases,
      flows: flowsData,
    };

    console.log("Attempting to save item to DynamoDB:", { tableName, item });

    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );

    console.log("Successfully saved item to DynamoDB");
    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error("Error saving to DynamoDB detail:", {
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

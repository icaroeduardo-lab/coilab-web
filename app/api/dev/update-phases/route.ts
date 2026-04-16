import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({
  region: process.env.APP_AWS_REGION || "us-east-1",
});
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const DEFAULT_PHASES = [
  { id: "discovery", name: "Discovery", order: 0 },
  { id: "design", name: "Design", order: 1 },
  { id: "development", name: "Development", order: 2 },
  { id: "testes", name: "Testes", order: 3 },
];

const NOTES_SAMPLES = [
  "Análise inicial realizada com sucesso",
  "Identificados os requisitos principais",
  "Documentação completa e atualizada",
  "Testes unitários passando",
  "Código revisado e aprovado",
  "Performance otimizada",
  "Bug fixes aplicados",
  "Implementação concluída conforme especificação",
];

const CHECKLIST_ITEMS = [
  "Requisitos definidos",
  "Design finalizado",
  "Código implementado",
  "Testes executados",
  "Documentação atualizada",
  "Code review realizado",
  "Deploy em produção",
  "Validação com cliente",
  "Bugs corrigidos",
  "Performance validada",
];

function getRandomItem(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomBoolean() {
  return Math.random() > 0.5;
}

function getRandomDate() {
  const start = new Date(2024, 0, 1);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

function generatePhases() {
  return DEFAULT_PHASES.map(phase => {
    const enabled = getRandomBoolean();
    const status = enabled ? getRandomItem(["not_started", "in_progress", "completed"]) : "not_started";
    
    const numChecklistItems = Math.floor(Math.random() * 5) + 2;
    const checklist: any[] = [];
    for (let i = 0; i < numChecklistItems; i++) {
      checklist.push({
        id: `${Date.now()}-${i}`,
        label: getRandomItem(CHECKLIST_ITEMS),
        completed: status === "completed" ? true : getRandomBoolean(),
      });
    }

    const phaseData: any = {
      ...phase,
      enabled,
      status,
      notes: getRandomItem(NOTES_SAMPLES),
      checklist,
    };

    if (status === "completed") {
      phaseData.completedAt = getRandomDate();
    }

    return phaseData;
  });
}

export async function POST() {
  try {
    const tableName = process.env.DYNAMODB_TABLE_TASKS;

    if (!tableName) {
      return NextResponse.json(
        { error: "DYNAMODB_TABLE_TASKS not set" },
        { status: 500 }
      );
    }

    const { Items } = await docClient.send(
      new ScanCommand({
        TableName: tableName,
      })
    );

    let updated = 0;

    for (const task of Items || []) {
      const phases = generatePhases();
      
      await docClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { id: task.id },
          UpdateExpression: "set phases = :p",
          ExpressionAttributeValues: {
            ":p": phases,
          },
        })
      );

      updated++;
    }

    return NextResponse.json({
      success: true,
      message: `${updated} tarefas atualizadas com dados aleatórios de fases`,
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

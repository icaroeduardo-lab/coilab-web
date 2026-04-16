import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({
  region: process.env.APP_AWS_REGION || "us-east-1",
});
const docClient = DynamoDBDocumentClient.from(client);

export async function POST() {
  try {
    // Check if table exists
    const listTablesResult = await client.send(new ListTablesCommand({}));
    const tableExists = listTablesResult.TableNames?.includes("coilab-flow");

    if (!tableExists) {
      // Create table
      await client.send(
        new CreateTableCommand({
          TableName: "coilab-flow",
          KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
          AttributeDefinitions: [
            { AttributeName: "id", AttributeType: "S" },
          ],
          BillingMode: "PAY_PER_REQUEST",
        })
      );
      console.log("✓ Tabela coilab-flow criada");
    }

    // Add flows
    const flows = [
      { id: "coppe", name: "COPPE" },
      { id: "aws", name: "AWS" },
    ];

    for (const flow of flows) {
      await docClient.send(
        new PutCommand({
          TableName: "coilab-flow",
          Item: flow,
        })
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tabela coilab-flow configurada e populada com sucesso",
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

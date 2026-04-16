import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const docClient = DynamoDBDocumentClient.from(client);

export async function GET() {
  try {
    const tableName = process.env["DYNAMODB-TABLE-FLOWS"] || "coilab-flow";

    if (!tableName) {
      return NextResponse.json(
        { error: "DYNAMODB-TABLE-FLOWS environment variable is not set" },
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
    console.error("Error fetching flows from DynamoDB:", error);
    return NextResponse.json(
      { error: "Failed to fetch flows" },
      { status: 500 }
    );
  }
}

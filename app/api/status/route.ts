import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const docClient = DynamoDBDocumentClient.from(client);

export async function GET() {
  try {
    const tableName = process.env.DYNAMODB_TABLE_STATUS;

    if (!tableName) {
      console.error("DYNAMODB_TABLE_STATUS environment variable is not set");
      return NextResponse.json(
        { error: "DYNAMODB_TABLE_STATUS environment variable is not set" },
        { status: 500 }
      );
    }

    const { Items } = await docClient.send(
      new ScanCommand({
        TableName: tableName,
      })
    );

    const sorted = (Items || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    return NextResponse.json(sorted);
  } catch (error: any) {
    console.error("Error fetching status from DynamoDB:", error);
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}

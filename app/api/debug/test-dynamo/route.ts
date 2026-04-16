import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = new DynamoDBClient({
      region: process.env.APP_AWS_REGION || "us-east-1",
    });
    const docClient = DynamoDBDocumentClient.from(client);

    const tableName = process.env.DYNAMODB_TABLE_TASKS;

    if (!tableName) {
      return NextResponse.json({
        error: "DYNAMODB_TABLE_TASKS not set",
        tableName,
      });
    }

    const { Items } = await docClient.send(
      new ScanCommand({
        TableName: tableName,
      })
    );

    return NextResponse.json({
      success: true,
      itemCount: Items?.length || 0,
      items: Items?.slice(0, 2) || [],
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack?.split("\n").slice(0, 5),
    });
  }
}

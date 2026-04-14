import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const docClient = DynamoDBDocumentClient.from(client);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const tableName = process.env["DYNAMODB-TABLE-TASKS"];

    if (!tableName) {
      return NextResponse.json(
        { error: "DYNAMODB-TABLE-TASKS environment variable is not set" },
        { status: 500 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id },
        UpdateExpression: "set #status = :s",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":s": status,
        },
      })
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating task status in DynamoDB:", error);
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}

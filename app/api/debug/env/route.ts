import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    APP_AWS_REGION: process.env.APP_AWS_REGION || "NOT SET",
    DYNAMODB_TABLE_TASKS: process.env.DYNAMODB_TABLE_TASKS || "NOT SET",
    DYNAMODB_TABLE_APPLICANT: process.env.DYNAMODB_TABLE_APPLICANT || "NOT SET",
    DYNAMODB_TABLE_PROJECTS: process.env.DYNAMODB_TABLE_PROJECTS || "NOT SET",
    DYNAMODB_TABLE_STATUS: process.env.DYNAMODB_TABLE_STATUS || "NOT SET",
    DYNAMODB_TABLE_FLOWS: process.env.DYNAMODB_TABLE_FLOWS || "NOT SET",
    BUCKET_DESIGN: process.env.BUCKET_DESIGN || "NOT SET",
  });
}

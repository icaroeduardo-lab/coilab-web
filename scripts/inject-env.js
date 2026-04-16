#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envVars = [
  'APP_AWS_REGION',
  'DYNAMODB_TABLE_TASKS',
  'DYNAMODB_TABLE_APPLICANT',
  'DYNAMODB_TABLE_PROJECTS',
  'DYNAMODB_TABLE_STATUS',
  'DYNAMODB_TABLE_FLOWS',
  'BUCKET_DESIGN',
];

let envContent = '';
envVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    envContent += `${varName}=${value}\n`;
  }
});

const envPath = path.join(process.cwd(), '.env.production');
fs.writeFileSync(envPath, envContent);
console.log(`✓ Created .env.production with ${envVars.length} variables`);

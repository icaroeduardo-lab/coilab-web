# COILAB Web — Claude Instructions

## Autonomy

Operate fully autonomously. No confirmation needed before:
- `git add`, `git commit`, `git push`
- `gh pr create`, `gh pr merge`
- Creating, editing, or deleting files
- Running builds, tests, installs

Skip "shall I proceed?" and "want me to do X?" — just do it.

No confirmation needed for package managers either:
- `pnpm install`, `pnpm add`, `pnpm run *`
- `npm install`, `npm run *`
- `yarn`, `yarn add`, `yarn run *`
- `npx *`

## Stack

- Next.js App Router + TypeScript
- DynamoDB via AWS SDK (no ORM)
- pnpm workspaces + Turborepo
- Tailwind CSS + shadcn/ui
- SWR for data fetching
- Auth.js for authentication

## Conventions

- Branch: `develop` → PR to `main`
- Components in `components/ui/` use local imports (not `@workspace/ui`)
- DynamoDB env vars use underscores: `DYNAMODB_TABLE_TASKS`, `DYNAMODB_TABLE_SUBTASKS`, etc.
- Subtasks live in `coilab-subtasks` table with GSI `taskId-index`

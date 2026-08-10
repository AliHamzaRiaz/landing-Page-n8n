# Ennitant API

NestJS backend for Ennitant WhatsApp Order Automation.

## Stack

- NestJS + TypeScript
- Prisma + PostgreSQL
- JWT auth (passport-jwt) + argon2
- Meta WhatsApp Cloud API + n8n webhooks

## Setup

From the monorepo root (preferred) or this package:

```bash
# install deps at repo root
npm install

cd apps/api
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

API base: `http://localhost:3001/api`

Demo login (after seed): `demo@ennitant.com` / `Demo123!`

## Scripts

- `npm run start:dev` — watch mode
- `npm run prisma:generate` — generate Prisma client
- `npm run prisma:migrate` — run migrations
- `npm run prisma:seed` — seed demo data
- `npm run test` — unit tests

## Security notes

- WhatsApp access tokens are stored encrypted (`accessTokenEncrypted`) and never returned to clients.
- All business-scoped queries filter by `businessId` from the JWT.
- n8n callbacks require `x-n8n-secret`.
- Meta webhook verification uses `META_VERIFY_TOKEN`.

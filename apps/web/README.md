# Ennitant Web

Vite + React + TypeScript frontend for the Ennitant WhatsApp Order Automation SaaS.

## Setup

From the monorepo root:

```bash
npm install
cp apps/web/.env.example apps/web/.env
npm run dev:web
```

Default API base URL: `http://localhost:3001/api`

## Scripts

- `npm run dev` — start Vite
- `npm run build` — typecheck + production build
- `npm run test` — run Vitest once
- `npm run test:watch` — Vitest watch mode

## Features

- Public landing page and auth flows
- Protected dashboard with Recharts analytics
- Orders, products, customers, WhatsApp connection, settings
- Onboarding wizard and JWT-authenticated API client

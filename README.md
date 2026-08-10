# Ennitant

Ennitant is a simple WhatsApp order management SaaS for business owners. Owners receive orders, share a customer WhatsApp link, share a vendor dispatch link, and track order status from one dashboard. Automation runs behind the scenes — **n8n is an internal engine and is never exposed to end users**.

## Architecture

```
Frontend (React + Vite)
        │
        ▼
NestJS API (JWT, tenant isolation)
        │
        ├── PostgreSQL (Prisma)
        ├── Meta WhatsApp Cloud API
        └── n8n (internal webhooks only)
```

| App | Path | Stack |
|-----|------|-------|
| Web | `apps/web` | React, TypeScript, Vite, Tailwind, TanStack Query, RHF, Zod, Recharts |
| API | `apps/api` | NestJS, Prisma, PostgreSQL, JWT, argon2 |
| DB | `docker/` | PostgreSQL 16 |

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 16+ (Docker is optional and **not required**)

### Database without Docker (recommended on constrained Windows PCs)

**Option A — Local PostgreSQL (winget)**

```bash
winget install --id PostgreSQL.PostgreSQL.16 -e
```

Then create the app database (PowerShell, adjust password if needed):

```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE USER ennitant WITH PASSWORD 'ennitant';"
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE ennitant OWNER ennitant;"
```

Set in `apps/api/.env`:

```env
DATABASE_URL=postgresql://ennitant:ennitant@localhost:5432/ennitant?schema=public
```

If your `postgres` superuser uses a different password, use that when `psql` prompts, or put it in the URL for setup only.

**Option B — Free hosted Postgres (Neon / Supabase)**

1. Create a free project at [Neon](https://neon.tech) or [Supabase](https://supabase.com)
2. Copy the connection string into `apps/api/.env` as `DATABASE_URL`
3. Skip local DB install entirely

Docker (`npm run db:up`) remains available only if your machine supports it.

## Quick start

```bash
# 1) Install dependencies
npm install

# 2) Copy environment files (already present as .env.example)
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3) Ensure PostgreSQL is running (local install or hosted URL in .env)
#    No Docker needed.

# 4) Generate Prisma client, migrate, seed
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 5) Run API + web
npm run dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:3001/api/health  

### Demo account (seed)

- Phone: `+923001234567`
- Password: `Demo1234!`
- Customer order page: `/order/demo-fashion`
- Vendor portal: `/vendor/demo-vendor-token-ennitant`

### User flow

Landing → Signup (phone + password) → OTP verify → Business info → WhatsApp confirm → Dashboard

See [docs/user-flow.md](docs/user-flow.md).

OTP codes are printed in the API console when `OTP_DEV_MODE=true`.

## Useful scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start API + web via Turborepo |
| `npm run dev:api` | API only |
| `npm run dev:web` | Web only |
| `npm run build` | Build all apps |
| `npm run test` | Run tests |
| `npm run db:up` / `db:down` | Start/stop Postgres |
| `npm run prisma:migrate` | Run migrations |
| `npm run prisma:seed` | Seed demo data |
| `npm run prisma:studio` | Prisma Studio |

## Environment variables

See `.env.example` and `apps/api/.env.example`.

Critical secrets (never commit real values, never expose to the frontend):

- `DATABASE_URL`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `N8N_API_KEY` / `N8N_WEBHOOK_SECRET`
- Meta / WhatsApp tokens (`META_*`, `WHATSAPP_*`)

Frontend only needs:

```env
VITE_API_URL=http://localhost:3001/api
```

## WhatsApp (Meta Cloud API)

Business owners only enter a **WhatsApp phone number** during onboarding. Meta IDs and tokens stay in server env / encrypted DB.

1. Create a Meta app with WhatsApp product.
2. Put `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `META_VERIFY_TOKEN`, `META_APP_SECRET` in `apps/api/.env`.
3. Expose the API over HTTPS and set Meta webhook to:  
   `https://<your-api-host>/api/webhooks/whatsapp`
4. Onboarding auto-attaches platform credentials to the business.

Full checklist: [docs/human-configuration.md](docs/human-configuration.md).

## n8n (internal only)

Ennitant talks to n8n only from the NestJS API:

1. Set `N8N_BASE_URL`, `N8N_WEBHOOK_SECRET`, `N8N_ORDER_WEBHOOK_PATH`.
2. Workflow receives inbound message context, extracts items, then calls  
   `POST /api/n8n/callback` with header `x-n8n-secret: <N8N_WEBHOOK_SECRET>`.
3. If n8n is offline, the API local catalog parser creates the order when possible.

See [docs/n8n-order-workflow.md](docs/n8n-order-workflow.md). Users never see n8n.

## Multi-tenant security

Every business-scoped query filters by the authenticated user’s `businessId` from the JWT. Cross-tenant access is rejected.

## Product flow

1. Landing → Signup → Onboarding  
2. Connect WhatsApp → Add products  
3. Customer messages WhatsApp  
4. Meta webhook → Ennitant API → n8n processing  
5. Order saved → customer confirmation → owner notification  
6. Owner manages the order in the dashboard  

## Testing

```bash
npm run test --workspace=apps/api
npm run test --workspace=apps/web
```

## License

Private / UNLICENSED

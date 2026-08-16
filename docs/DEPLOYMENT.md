# Deployment

## Web (existing)

Vercel project root: `apps/web`. SPA rewrites in `apps/web/vercel.json`. Env: `VITE_API_URL`.

Production example: `https://landing-page-n8n-web.vercel.app`

## API (existing)

Render: `npm run build:render` then `npm run start:render` (`prisma migrate deploy`). Env from `apps/api/.env.example`.

Production example: `https://landing-page-n8n.onrender.com`

After adding campaigns, run migrations:

```bash
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
```

Set `PUBLIC_API_URL` to the public API origin + `/api` so OAuth callbacks can return.

Add `/uploads` on the Render disk **or** use S3 (`STORAGE_*`). Ephemeral Render disks lose local files on restart.

## Do not

- Point WhatsApp webhooks at a campaign route
- Put `META_APP_SECRET` on Vercel or in Expo
- Treat unpublished social jobs as published

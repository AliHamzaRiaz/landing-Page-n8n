# Environment variables

Copy `apps/api/.env.example` → `apps/api/.env`. Never commit real secrets.

## Existing (required to run today’s WhatsApp product)

`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `ENCRYPTION_KEY` (production), `CORS_ORIGIN`, `FRONTEND_URL`, Meta WhatsApp vars (`META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN`, `META_EMBEDDED_SIGNUP_CONFIG_ID`), n8n vars.

## Campaign / media

| Name | Purpose |
|------|---------|
| `PUBLIC_API_URL` | OAuth callback origin, e.g. `https://landing-page-n8n.onrender.com/api` |
| `LOCAL_UPLOAD_DIR` | Dev disk folder (`uploads/`, gitignored) |
| `MEDIA_MAX_BYTES` | Default 100MB |
| `STORAGE_BUCKET` / `STORAGE_ACCESS_KEY` / `STORAGE_SECRET_KEY` | S3-compatible bucket |
| `STORAGE_PUBLIC_BASE_URL` | Public HTTPS prefix platforms can fetch |

Without a public media URL, Facebook/Instagram publish jobs **fail honestly**.

## AI captions

| Name | Purpose |
|------|---------|
| `AI_API_KEY` | Enables HTTP LLM provider |
| `AI_BASE_URL` | Default OpenAI-compatible `/v1` |
| `AI_MODEL` | e.g. `gpt-4o-mini` |

If `AI_API_KEY` is empty, the API still returns captions from the **heuristic** provider (`provider: "heuristic"`). That is not fake “AI success”; the UI shows the source.

## Social OAuth

Facebook/Instagram reuse `META_APP_ID` + `META_APP_SECRET` and need the **Facebook Login** product plus Page/IG scopes on the Meta app. This is **not** WhatsApp Embedded Signup.

`TIKTOK_CLIENT_*`, `GOOGLE_CLIENT_*`, `LINKEDIN_CLIENT_*` are reserved. Connect returns a clear error until those apps exist.

## Redis

`REDIS_URL` is reserved. Publishing currently uses PostgreSQL jobs (no Redis required).

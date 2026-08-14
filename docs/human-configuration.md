# Human configuration required (cannot be invented)

Ennitant code is implemented end-to-end. Live WhatsApp delivery and production OTP need **your** credentials.

## 1) Meta WhatsApp Cloud API + Embedded Signup

| What | Where to get it | Env var (`apps/api/.env`) |
|------|-----------------|---------------------------|
| App ID | Meta Developer → Your App → Settings → Basic | `META_APP_ID` |
| App Secret | Meta Developer → Your App → Settings → Basic | `META_APP_SECRET` |
| Verify Token | You invent a long random string; paste the **same** value in Meta webhook settings and `.env` | `META_VERIFY_TOKEN` |
| Embedded Signup Config ID | Meta Developer → WhatsApp → Embedded Signup → Configuration ID | `META_EMBEDDED_SIGNUP_CONFIG_ID` |
| Encryption key | Generate 32-byte hex (64 chars) | `ENCRYPTION_KEY` |

**Production:** Do **not** set `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, or `WHATSAPP_BUSINESS_ACCOUNT_ID`. Each business connects via Embedded Signup in the dashboard/onboarding.

**Local dev only:** Set `WHATSAPP_PLATFORM_FALLBACK=true` plus the legacy `WHATSAPP_*` vars if you need single-tenant testing without Meta OAuth.

### Webhook URL (Meta dashboard)

1. Deploy or tunnel your API with **HTTPS**.
2. In Meta → WhatsApp → Configuration → Webhook:
   - Callback URL: `https://YOUR_PUBLIC_API/api/webhooks/whatsapp`
   - Verify token: same as `META_VERIFY_TOKEN`
3. Subscribe to `messages` and `account_update`.

Business owners connect WhatsApp via **Connect WhatsApp** (Embedded Signup) — no manual token entry.

## 2) Public HTTPS for the API

Local only is fine for signup/dashboard. For real WhatsApp:

```bash
# example
ngrok http 3001
```

Then set Meta webhook to the ngrok HTTPS URL + `/api/webhooks/whatsapp`.

## 3) n8n (optional but recommended)

| What | Env var |
|------|---------|
| n8n base URL | `N8N_BASE_URL` (e.g. `http://localhost:5678`) |
| Shared secret | `N8N_WEBHOOK_SECRET` |
| Inbound path | `N8N_ORDER_WEBHOOK_PATH` (default `/webhook/ennitant-order`) |

Workflow must:

1. Receive NestJS trigger payload (see `docs/n8n-order-workflow.md`)
2. Parse product + quantity
3. `POST https://YOUR_API/api/n8n/callback` with header `x-n8n-secret`

If n8n is down, Ennitant uses a **local catalog parser** fallback.

## 4) OTP / SMS (production)

| What | Env var |
|------|---------|
| Provider name | `OTP_PROVIDER=console` (dev) or `sms` / `whatsapp` |
| Provider API key | `OTP_API_KEY` |
| Dev codes in API | `OTP_DEV_MODE=true` |

Until a real SMS/WhatsApp OTP provider is wired, keep `OTP_PROVIDER=console` and `OTP_DEV_MODE=true`. Codes appear in API logs and (in dev) in the verify UI.

## 5) App secrets

| What | Env var |
|------|---------|
| JWT signing | `JWT_SECRET` (long random) |
| Token encryption | `ENCRYPTION_KEY` (optional; 64 hex chars recommended) |
| Frontend URL (share links) | `FRONTEND_URL=http://localhost:5173` |

## Developer health check

```http
GET /api/health/setup
```

Logs on API boot also print Database / WhatsApp / n8n / OTP status.

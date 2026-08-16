# Ennitant architecture (current system)

Ennitant is a **multi-tenant WhatsApp order-automation SaaS**. The web app and NestJS API are production code. This document describes **what exists today**. Planned marketing/campaign additions are listed only in the gap section so they are not confused with current behavior.

## High-level

```
React + Vite (apps/web)  ──JWT──►  NestJS (apps/api)
                                      │
                         PostgreSQL (Prisma / Neon)
                                      │
                    Meta WhatsApp Cloud API + Embedded Signup
                                      │
                         n8n (internal order extraction only)
```

Deploy today: **web → Vercel** (`apps/web/vercel.json` SPA rewrites), **API → Render** (`build:render` / `start:render`).

There is **no** `apps/mobile` in the original product. Shared npm workspace `packages/` is empty. Keep **`apps/web` + `apps/api`**; add mobile as **`apps/mobile`** rather than renaming folders to `web/` / `backend/`.

## Tenancy

The tenant root is **`Business`**, not a standalone User org.

- Signup creates one `Business` + one `User` (`OWNER`).
- JWT payload: `sub` (user id), `businessId`, `phoneNumber`, `role`.
- Dashboard APIs filter by `@CurrentBusiness()` (`businessId` from JWT). **Never trust a client-supplied tenant id.**
- WhatsApp inbound routes to a business via `Business.metaPhoneNumberId` / `WhatsAppAccount.phoneNumberId`.

`ADMIN` / `STAFF` exist on the enum but are not used in route guards.

## Frontend (`apps/web`)

- React 19, Vite 8, Tailwind 4, React Router 7, TanStack Query, Axios, Zod, Recharts.
- Auth: phone + password → OTP verify → JWT in `localStorage`.
- Protected app: dashboard, orders, products, customers, WhatsApp setup, settings.
- Public: landing, customer order link, vendor portal, `/privacy-policy`, `/terms-of-service`, `/data-deletion`.
- WhatsApp page: Meta Embedded Signup + coexistence + customer chat QR. Tokens are **never** shown.
- No file/video upload. Product images are URL strings.
- Forgot/reset **pages exist**; matching API routes were not wired.

## Backend (`apps/api`)

NestJS 11, Prisma 6, PostgreSQL, Passport JWT, argon2, Helmet, Throttler.

Global prefix: `/api`. Almost all routes use `JwtAuthGuard` except `@Public()` auth, health, Meta webhooks, n8n S2S, public order/vendor.

### Existing modules

Auth, Users, Businesses, Products, Orders, Customers, Dashboard, WhatsApp, Webhooks, n8n, Notifications, Integrations, Public, OTP.

### WhatsApp / Meta (must not break)

- Embedded Signup: `GET /whatsapp/embedded-signup/config`, `POST /whatsapp/embedded-signup/complete`.
- Connect / status / test / disconnect.
- Access tokens: AES-256-GCM (`ENCRYPTION_KEY`).
- Webhooks: `GET|POST /webhooks/whatsapp` (verify token + HMAC).
- One Cloud `phoneNumberId` per platform (unique).
- Production forbids shared env `WHATSAPP_ACCESS_TOKEN` fallback.

**Not implemented:** Facebook Page OAuth, Instagram Content Publishing, TikTok, YouTube, or LinkedIn posting. The Meta app is used for **WhatsApp Cloud API**, not as a marketing publisher.

### “AI” today

n8n extracts order details from WhatsApp text. There is **no** caption/hashtag LLM in Nest.

### Queue / scheduler / media

None. Webhooks and n8n calls are in-process. No Bull/Redis. No object storage. No `@nestjs/schedule`.

## Data model (existing)

Business → Users, Products, Orders, Customers, WhatsAppAccount, Messages, Notifications, Integrations, WorkflowExecution, AuditLog, Vendors.

Secrets in DB: `User.passwordHash` / OTP hashes, `WhatsAppAccount.accessTokenEncrypted`, vendor token ciphertext.

## Auth gaps (relevant to mobile)

- Access JWT only (default 7d). Web stores a `refreshToken` key but the API **does not issue refresh tokens**.
- Logout is client-side (no denylist).
- CORS allows missing `Origin` (needed for native apps).

## Conflicts if adding campaigns / social / mobile

1. **Do not reuse `WhatsAppAccount` tokens** for Instagram/Facebook Page posting. Wrong scopes; would break WhatsApp.
2. **Do not overload unstructured `Integration.config` JSON** for OAuth tokens. New `SocialAccount` rows with encryption, same AES helper.
3. **Webhook path** `/webhooks/whatsapp` ignores non-WhatsApp objects. Social callbacks must be separate routes.
4. Tenant key is **`businessId`**, not generic `userId`. Campaigns belong to the business; `createdByUserId` is audit only.
5. Public media URLs are required for most official publish APIs. Local disk uploads cannot be fetched by Meta/TikTok unless S3 (or similar) is configured.
6. Publishing must not report success without an official API response.

## Gap list (to add, without replacing WhatsApp)

| Area | Status |
|------|--------|
| Campaigns / posts / schedule | Added (`apps/api` campaigns + posts) |
| Object storage for video/images | Local disk + public URL prefix; S3 env reserved |
| Social OAuth (FB/IG/TikTok/YouTube/LinkedIn) | FB/IG OAuth implemented; others documented until app approval |
| Caption AI abstraction | `AiContentService` (heuristic fallback if no `AI_API_KEY`) |
| Publishing queue + retries | DB jobs + 15s worker, backoff, idempotency keys |
| Campaign analytics from **our** DB | `GET /analytics` |
| React Native app | `apps/mobile` (same `/api` JWT) |
| Refresh tokens | Still access JWT only |
| Privacy/ToS/data-deletion web pages | **Present** |
| Forgot/reset password API | Wired (`POST /auth/forgot-password`, `POST /auth/reset-password`) |

## Implementation rule

Keep `apps/web` and `apps/api` WhatsApp order flows working. Add new Nest modules, Prisma models, web routes, and `apps/mobile` that call the **same** `/api` with the existing JWT.

## Added marketing layer (same API, same JWT, same Business tenant)

New Prisma models: `Campaign`, `CampaignMedia` (metadata only), `SocialAccount` (encrypted tokens), `CampaignPost`, `PublishingJob`. WhatsApp tables are unchanged.

New Nest modules: `AiModule`, `MediaModule`, `CampaignsModule`, `SocialAccountsModule`, `PublishingModule`, `AnalyticsModule`.

Web routes added: `/campaigns`, `/campaigns/new`, `/campaigns/:id`, `/media`, `/scheduled`, `/social-accounts`, `/analytics`. Existing orders/WhatsApp/legal routes stay.

Mobile: `apps/mobile` Expo client using `EXPO_PUBLIC_API_URL` only.

Publishing uses a PostgreSQL job table + 15s worker (not BullMQ). Facebook/Instagram Graph publishing runs only with a **public** media URL. TikTok/YouTube/LinkedIn return documented connect/publish errors until those apps are approved. Analytics counts **Ennitant** rows only.


# Campaign / marketing API

All routes sit under `/api` and reuse the existing JWT (`Authorization: Bearer`). Tenant is always `businessId` from the token.

## Auth (existing)

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/verify`
- `POST /auth/resend-otp`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`

## Campaigns

- `GET /campaigns`
- `POST /campaigns`
- `GET /campaigns/:id`
- `PATCH /campaigns/:id` (also `PUT`)
- `DELETE /campaigns/:id`
- `POST /campaigns/:id/media` (multipart field `file`)
- `POST /campaigns/:id/generate-content`
- `POST /campaigns/:id/confirm` `{ postingType: NOW|SCHEDULE|DRAFT, platforms, scheduledAt?, captions? }`

## Media

- `GET /media`
- `POST /media`
- `GET /media/:id`
- `GET /media/:id/file` (owner only)
- `DELETE /media/:id`

Blobs are never stored in Postgres.

## Social accounts

- `GET /social-accounts` (no tokens)
- `POST /social-accounts/:platform/connect` → `{ authorizationUrl }`
- `GET /social-accounts/:platform/callback` public OAuth redirect
- `POST /social-accounts/:id/test`
- `POST /social-accounts/:id/reconnect`
- `DELETE /social-accounts/:id`

Platforms: `facebook`, `instagram`, `tiktok`, `youtube`, `linkedin`.

## Posts / publishing

- `GET /posts`
- `POST /posts/:id/publish`
- `POST /posts/:id/schedule`

Jobs are rows in `PublishingJob`, processed every 15s with retries. Success requires an official API id. Failures stay `FAILED` with `errorMessage`.

## Analytics

- `GET /analytics`

Counts of campaigns/posts **in Ennitant**. No fake impressions.

## WhatsApp (unchanged)

Embedded Signup, status, webhooks, n8n callbacks remain as before.

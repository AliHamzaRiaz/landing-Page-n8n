# WhatsApp onboarding — Meta requirements and E2E

Code cannot bypass Meta App Review, Embedded Signup configuration, or WhatsApp verification.

## Two official paths

### Path A — Standard Embedded Signup

`FB.login` with `config_id` and `extras.setup`. Meta verifies the phone (OTP/call) inside its own UI.

### Path B — WhatsApp Coexistence (Business app)

`FB.login` extras include `featureType: "whatsapp_business_app_onboarding"`.

If the number is eligible, **Meta’s popup** shows the official QR. The owner opens **WhatsApp Business app** and scans **that** QR. Ennitant never generates this QR.

If Coexistence is unavailable, Ennitant falls back to Path A.

### Customer chat QR (separate)

After `CONNECTED`, the dashboard shows a **customer** `https://wa.me/<digits>` QR so shoppers can message the business. This is not Meta onboarding.

## Manual Meta Developer Console

1. Business-type Meta app with WhatsApp product.
2. Facebook Login for Business → Embedded Signup configuration → `META_EMBEDDED_SIGNUP_CONFIG_ID`.
3. Permissions (Advanced Access in Live mode, via App Review):
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
4. App domains + OAuth redirect domains: Vercel production host + localhost for dev.
5. Webhook: `https://landing-page-n8n.onrender.com/api/webhooks/whatsapp`
6. Verify token = `META_VERIFY_TOKEN`
7. Subscribe `messages` and `account_update`. For Coexistence, also subscribe required history sync fields per current Meta docs.
8. Tech Provider / Solution Partner status is required for customer Embedded Signup in production (Live mode).

Development-mode Embedded Signup only works for Meta app roles (admin/developer/tester).

## Manual E2E — Business A

1. Sign up and log in.
2. Open **WhatsApp** → **Connect your WhatsApp**.
3. Complete Meta Embedded Signup (or Coexistence QR inside Meta’s UI).
4. Status is `CONNECTED`. Customer chat QR appears.
5. Confirm WABA ID / phone_number_id exist in the database (`WhatsAppAccount`) and token is encrypted (`accessTokenEncrypted` is not plaintext).
6. Scan the **customer** QR from another phone. Send `Hi`.
7. Render logs show webhook + `businessId` resolution.
8. n8n receives `{ businessId, phoneNumberId, messageBody, waMessageId }`.
9. Order is created; confirm button id is `confirm_<prisma order.id>`.
10. Confirm → order `CONFIRMED`. Cancel on another order → `CANCELLED`.

## Manual E2E — Business B

Repeat. Business B cannot see Business A orders.

## n8n

One workflow for all tenants. Look up business by `phone_number_id`. PATCH status with `{ orderId, status, phoneNumberId }`.

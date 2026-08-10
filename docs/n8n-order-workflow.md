# n8n Order Extraction Workflow (Internal)

This workflow is **internal infrastructure**. Ennitant users never see n8n.

## Flow

1. NestJS receives a WhatsApp inbound message.
2. NestJS calls n8n webhook: `POST {N8N_BASE_URL}{N8N_ORDER_WEBHOOK_PATH}`
3. n8n extracts order fields from the message text.
4. n8n calls back Ennitant: `POST /api/n8n/callback`
5. Header required: `x-n8n-secret: {N8N_WEBHOOK_SECRET}`

## Inbound payload (NestJS → n8n)

```json
{
  "businessId": "clx...",
  "customerPhone": "15551234567",
  "customerName": "Ayesha",
  "messageBody": "Assalamualaikum, mujhe 2 black kurtas chahiye.",
  "waMessageId": "wamid....",
  "products": [
    { "id": "...", "name": "Black Kurta", "sku": "KUR-BLK", "price": 45 }
  ],
  "executionId": "clx..."
}
```

## Callback payload (n8n → NestJS)

`POST /api/n8n/callback`  
Header: `x-n8n-secret: {N8N_WEBHOOK_SECRET}`

```json
{
  "businessId": "clx...",
  "workflowExecutionId": "clx...",
  "customerPhone": "15551234567",
  "customerName": "Ayesha",
  "waMessageId": "wamid....",
  "notes": "Optional",
  "items": [
    {
      "productId": "optional-catalog-id",
      "name": "Black Kurta",
      "quantity": 2,
      "unitPrice": 2000
    }
  ]
}
```

If n8n is unavailable, the API falls back to a local catalog parser and still creates the order when a product name match is found.

## Server-to-server order APIs (n8n → NestJS)

All routes require header `x-n8n-secret: {N8N_WEBHOOK_SECRET}` (no owner JWT).

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/n8n/callback` | Create order from parsed WhatsApp message |
| `GET` | `/api/n8n/orders/:orderId` | Get one order |
| `PATCH` | `/api/n8n/orders/:orderId/status` | Update status (`{ "status": "CONFIRMED" }`) |
| `GET` | `/api/n8n/businesses/:businessId/orders` | List orders (`status`, `orderNumber`, `customerPhone` query filters) |

Create still identifies the business via `businessId` in the callback body (provided by Nest when it originally triggered n8n after Meta `phone_number_id` lookup).

## Suggested n8n nodes

1. **Webhook** — receive NestJS trigger
2. **AI / Code** — extract product, quantity, address from `messageBody` using the provided `products` catalog
3. **HTTP Request** — POST to Ennitant callback URL with secret header
4. **Respond to Webhook** — acknowledge NestJS (optional)

## Security

- Do not expose n8n publicly to customers.
- Prefer private network / VPN between NestJS and n8n.
- Rotate `N8N_WEBHOOK_SECRET` regularly.
- Never put n8n URLs or API keys in the frontend.

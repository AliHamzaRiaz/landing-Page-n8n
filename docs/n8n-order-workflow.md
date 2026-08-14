# n8n Order Extraction + Confirm/Cancel Flow

This workflow is **internal infrastructure**. Ennitant users never see n8n.

## Critical rule: use the database `order.id`

After **Create Order in Backend**, the API returns the real Prisma order id, for example:

```json
{
  "success": true,
  "message": "Order created from n8n callback",
  "data": { "id": "cmsowpb11000bhw1y5tfa17i2", "orderNumber": "ORD-00010", ... },
  "order": { "id": "cmsowpb11000bhw1y5tfa17i2", "orderNumber": "ORD-00010", ... }
}
```

**Always carry `order.id` (cuid) through the workflow.**

Never generate fake ids such as:

- `confirm_ORD-1786461415260`
- `ORD-${Date.now()}`

Those are not database ids and `PATCH /api/n8n/callback` will return **404 Order not found**.

---

## End-to-end confirm flow

1. Create order via `POST /api/n8n/callback` → read `order.id`
2. Send WhatsApp confirm/cancel buttons with that **same** `order.id` inside each button `id`
3. Customer taps Confirm → WhatsApp returns the button `id`
4. Parse node extracts `OrderId` = database id
5. `PATCH /api/n8n/callback` with `{ "orderId": "<db id>", "status": "CONFIRMED" }` → **200**

---

## Node setup (exact)

### 1) Create Order in Backend (HTTP Request)

- Method: `POST`
- URL: `https://landing-page-n8n.onrender.com/api/n8n/callback`
- Header: `x-n8n-secret` = `N8N_WEBHOOK_SECRET`
- Body: create-order JSON (`businessId`, `customerPhone`, `items`, ...)

After this node runs, the real id is available as:

```text
$('Create Order in Backend').item.json.order.id
```

(also at `.data.id` — both are the same value)

### 2) Build Order Data / Set (optional but recommended)

Add a **Set** node right after Create Order:

| Name | Value (expression) |
|------|--------------------|
| `DbOrderId` | `={{ $('Create Order in Backend').item.json.order.id }}` |
| `OrderNumber` | `={{ $('Create Order in Backend').item.json.order.orderNumber }}` |
| `WaFrom` | `={{ /* customer WhatsApp from earlier node */ }}` |

Use **`DbOrderId` only** for buttons and status updates.

### 3) Send Confirm Buttons (WhatsApp interactive)

Button reply **ids** must embed the database id (Meta allows up to 256 chars):

| Button title | Button id (expression) |
|--------------|------------------------|
| Confirm Order | `={{ 'confirm_' + $('Create Order in Backend').item.json.order.id }}` |
| Cancel Order | `={{ 'cancel_' + $('Create Order in Backend').item.json.order.id }}` |

Example resulting ids:

- `confirm_cmsowpb11000bhw1y5tfa17i2`
- `cancel_cmsowpb11000bhw1y5tfa17i2`

**Wrong (do not do this):**

- `confirm_ORD-{{Date.now()}}`
- `confirm_{{ $now }}`
- any newly invented `ORD-...` timestamp

### 4) Confirm or Cancel? (Code / Switch after button webhook)

When the customer clicks a button, WhatsApp returns something like:

```json
{
  "interactive": {
    "button_reply": {
      "id": "confirm_cmsowpb11000bhw1y5tfa17i2",
      "title": "Confirm Order"
    }
  }
}
```

**Code node** example (adjust path to your WhatsApp Trigger payload):

```javascript
const reply =
  $json.messages?.[0]?.interactive?.button_reply ||
  $json.interactive?.button_reply ||
  $json.button_reply ||
  {};

const rawId = String(reply.id || '');
const title = String(reply.title || '');

let action = '';
let orderId = rawId;

if (rawId.startsWith('confirm_')) {
  action = 'CONFIRMED';
  orderId = rawId.slice('confirm_'.length);
} else if (rawId.startsWith('cancel_')) {
  action = 'CANCELLED';
  orderId = rawId.slice('cancel_'.length);
}

if (!orderId || orderId.startsWith('ORD-') && !orderId.includes('cm')) {
  // Optional guard: still allow pure cuid / cm* ids
}

return [
  {
    json: {
      OrderId: orderId,
      ButtonTitle: title,
      Action: action,
      WaFrom: $json.messages?.[0]?.from || $json.from || '',
    },
  },
];
```

Output must look like:

```json
{
  "OrderId": "cmsowpb11000bhw1y5tfa17i2",
  "ButtonTitle": "Confirm Order",
  "Action": "CONFIRMED",
  "WaFrom": "923134996633"
}
```

### 5) Confirm Order in Backend (HTTP Request)

- Method: `PATCH`
- URL: `https://landing-page-n8n.onrender.com/api/n8n/callback`
- Header: `x-n8n-secret` = `N8N_WEBHOOK_SECRET`
- Body (JSON):

```json
{
  "orderId": "={{ $json.OrderId }}",
  "status": "CONFIRMED",
  "phoneNumberId": "={{ $('WhatsApp Trigger').item.json.metadata.phone_number_id }}"
}
```

Include `phoneNumberId` from the **current** WhatsApp Trigger payload so the backend can verify tenant scope. Do not reuse a stale `phone_number_id` from the original Create Order execution.

For cancel, use `"status": "CANCELLED"` with the same `orderId` and `phoneNumberId`.

Do **not** use `$('Create Order in Backend').item.json.order.id` here unless that node is in the **same execution**. Button clicks start a **new** webhook execution — only the button payload carries the id.

### 6) Cancel Order in Backend

Same URL/method/header, body:

```json
{
  "orderId": "={{ $json.OrderId }}",
  "status": "CANCELLED"
}
```

---

## APIs (n8n → NestJS)

All require header `x-n8n-secret`.

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/n8n/callback` | Create order |
| `PATCH` | `/api/n8n/callback` | Update status `{ orderId, status }` |
| `GET` | `/api/n8n/orders/:orderId` | Get one order |
| `PATCH` | `/api/n8n/orders/:orderId/status` | Update status (path param) |
| `GET` | `/api/n8n/businesses/by-whatsapp-phone-id/:phoneNumberId` | Resolve business |
| `GET` | `/api/n8n/businesses/:businessId/orders` | List orders |

`orderId` for PATCH may be:

- Prisma `id` (preferred) — e.g. `cmsowpb11000bhw1y5tfa17i2`
- `orderNumber` — e.g. `ORD-00010`
- Prefixed form — e.g. `confirm_cmsowpb11000bhw1y5tfa17i2` (backend strips and resolves)

It will **not** find invented ids like `confirm_ORD-1786461415260`.

---

## Security

- Do not expose n8n to customers.
- Rotate `N8N_WEBHOOK_SECRET` regularly.
- Never put n8n URLs or secrets in the frontend.

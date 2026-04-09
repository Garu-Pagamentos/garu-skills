---
name: garu-sdk
description: >
  Integrate the Garu payment gateway (PIX, credit card, boleto) into any application. Use when adding Brazilian payments, building checkout flows, or creating charges.
license: MIT
metadata:
  author: garu
  version: "0.1.0"
  homepage: https://garu.com.br
  source: https://github.com/Garu-Pagamentos/garu-skills
inputs:
  - name: GARU_API_KEY
    description: >
      Garu API key. Format: sk_live_... (production) or sk_test_... (sandbox).
      Get yours at garu.com.br → Dashboard → API Keys.
    required: true
  - name: GARU_WEBHOOK_SECRET
    description: Webhook hash for verifying event payloads. Found in the Garu dashboard.
    required: false
references:
  - pix-charges.md
  - card-charges.md
  - boleto-charges.md
  - webhooks.md
  - idempotency.md
  - installation.md
---

# Garu

Garu is a Brazilian payment gateway. Use the sub-skill that matches the user's task.

## Quick Charge — PIX (Node.js)

```typescript
import Garu from "@garuhq/node";

const garu = new Garu({ apiKey: process.env.GARU_API_KEY });

const charge = await garu.charges.create({
  productId: "your-product-uuid",
  paymentMethod: "pix",
  customer: {
    name: "Maria Silva",
    email: "maria@example.com",
    document: "12345678900", // CPF (11 digits) or CNPJ (14 digits)
    phone: "11999998888",
  },
});

// charge.code contains the PIX copy-paste code
// Display this to the user or generate a QR from it
console.log("PIX code:", charge.code);
console.log("Charge ID:", charge.id);
```

**Key gotcha:** The Garu API accepts amounts in **BRL decimal** (e.g., `49.99`), not centavos. The product's price is set on the product itself — you don't pass an amount when creating a charge.

## Quick Charge — cURL

```bash
curl -X POST https://garu.com.br/api/transactions \
  -H "Authorization: Bearer sk_live_..." \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: pix-charge/order-123" \
  -d '{
    "productId": "your-product-uuid",
    "paymentMethodId": "pix",
    "customer": {
      "name": "Maria Silva",
      "email": "maria@example.com",
      "document": "12345678900",
      "phone": "11999998888"
    }
  }'
```

## Sub-Skills

| Feature            | Reference                                                    | Use when                                      |
| ------------------ | ------------------------------------------------------------ | --------------------------------------------- |
| **PIX charges**    | [references/pix-charges.md](references/pix-charges.md)       | QR code, instant payment, PIX copy-paste      |
| **Card charges**   | [references/card-charges.md](references/card-charges.md)     | Credit/debit card, installments, tokenization |
| **Boleto charges** | [references/boleto-charges.md](references/boleto-charges.md) | Boleto bancário, barcode, due date            |
| **Webhooks**       | [references/webhooks.md](references/webhooks.md)             | Verifying signatures, handling payment events |
| **Idempotency**    | [references/idempotency.md](references/idempotency.md)       | Preventing duplicate charges on retry         |
| **Installation**   | [references/installation.md](references/installation.md)     | SDK setup, language detection, cURL fallback  |

## Never do this

- **Never log full card PANs or CVV.** PCI-DSS violation. Use charge IDs in logs.
- **Never build PIX QR codes manually** — always use the response `code` field.
- **Never skip idempotency keys on charge creation** — retries without keys cause duplicate charges.
- **Never store CVV after authorization** — PCI-DSS prohibits it.
- **Never send card data from the browser** — the API does not support CORS. Always call from server-side.
- **Never use floating-point arithmetic for amounts** — use integer centavos internally, BRL decimal only at the API boundary.
- **Never hardcode API keys** — use environment variables.

## Always do this

- **Authenticate** with `Authorization: Bearer sk_live_...` (production) or `sk_test_...` (sandbox).
- **Include idempotency keys** on every `POST /api/transactions` call: `X-Idempotency-Key: <type>/<entity-id>`.
- **Include customer document** (CPF for individuals, CNPJ for businesses) — required for all Brazilian payment methods.
- **Verify webhook signatures** before processing events — use the `confirmHash` against your webhook secret.
- **Handle async payment methods**: PIX and boleto are not instant. Listen for webhooks to confirm payment.
- **Use the SDK** (`@garuhq/node`) when possible — it handles auth, retries, and type safety.

## Common Mistakes

| #   | Mistake                                | Fix                                                                                                                                  |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Missing customer document**          | CPF (11 digits) or CNPJ (14 digits) is required for all Brazilian payments. Validate format before sending.                          |
| 2   | **Retrying without idempotency key**   | Always include `X-Idempotency-Key` header. Format: `<payment-type>/<entity-id>` (e.g., `pix-charge/order-123`).                      |
| 3   | **Treating PIX/boleto as synchronous** | These are async — charge creation returns a pending status. Listen for `transaction.updateStatus` webhook to confirm payment.        |
| 4   | **Sending card data from browser**     | API does not support CORS. Call from server-side only (API routes, serverless functions).                                            |
| 5   | **Wrong payment method enum**          | Use exact values: `pix`, `creditcard`, `boleto`. Not `credit_card`, `PIX`, or `bank_slip`.                                           |
| 6   | **Logging card numbers**               | PCI violation. Log only charge ID, status, and amount. Never log PAN, CVV, or full card data.                                        |
| 7   | **Ignoring webhook verification**      | Always verify `confirmHash` matches your `GARU_WEBHOOK_SECRET` before processing. Unverified events cannot be trusted.               |
| 8   | **Using `amount` in charge creation**  | Amounts come from the product. Pass `productId`, not an amount field. To charge a custom amount, create or update the product first. |
| 9   | **Missing address for boleto**         | Boleto requires customer address fields (zipCode, street, number, neighborhood, city, state). PIX and card do not.                   |
| 10  | **Using test keys in production**      | `sk_test_...` keys only work in sandbox. Use `sk_live_...` for production.                                                           |

## API Key

Store in environment variable — never hardcode:

```bash
export GARU_API_KEY=sk_live_...
```

Keys come in two flavors:

- `sk_test_...` — sandbox (no real charges)
- `sk_live_...` — production (real money)

## Detect Project Language

Check for: `package.json` (Node.js), `requirements.txt`/`pyproject.toml` (Python), `composer.json` (PHP), `Gemfile` (Ruby). Only Node.js SDK is available today — use cURL for other languages.

## Error Handling Quick Reference

| Code | Meaning                                            | Action                                       |
| ---- | -------------------------------------------------- | -------------------------------------------- |
| 400  | Validation error (bad document, missing field)     | Fix request parameters, don't retry          |
| 401  | Invalid or missing API key                         | Check `GARU_API_KEY` env var                 |
| 403  | Permission denied / wrong seller                   | Verify API key has correct permissions       |
| 404  | Transaction, customer, or product not found        | Check ID exists and belongs to your seller   |
| 409  | Idempotency conflict (same key, different payload) | Use a new idempotency key or fix the payload |
| 429  | Rate limited                                       | Retry with exponential backoff               |
| 500  | Server error                                       | Retry with exponential backoff               |

## Transaction Statuses

| Status           | Payment method | Meaning                            |
| ---------------- | -------------- | ---------------------------------- |
| `pendingPix`     | PIX            | Waiting for customer to pay        |
| `payedPix`       | PIX            | Payment confirmed                  |
| `unavailablePix` | PIX            | QR code expired                    |
| `pendingBoleto`  | Boleto         | Boleto issued, waiting for payment |
| `payedBoleto`    | Boleto         | Boleto paid and compensated        |
| `notCompensated` | Boleto         | Boleto expired unpaid              |
| `authorized`     | Card           | Card authorized, pending capture   |
| `captured`       | Card           | Payment captured successfully      |
| `denied`         | Card           | Card declined                      |
| `reversed`       | Card           | Refunded                           |
| `cancel`         | Any            | Cancelled                          |

## Resources

- [Garu Dashboard](https://garu.com.br)
- [API Swagger](https://garu.com.br/api/swagger)
- [Node SDK](https://www.npmjs.com/package/@garuhq/node)
- [MCP Server](https://www.npmjs.com/package/@garuhq/mcp)
- [CLI](https://www.npmjs.com/package/@garuhq/cli)

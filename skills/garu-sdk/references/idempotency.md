# Idempotency

Prevent duplicate charges when retrying failed requests. Critical for payment systems where a network timeout doesn't mean the charge failed — it may have succeeded on the server side.

## Why Idempotency Matters for Payments

```
Client → POST /api/transactions → Server creates charge → Response lost (timeout)
Client → Retry same POST       → Without idempotency: DUPLICATE CHARGE
Client → Retry same POST       → With idempotency: Returns original charge
```

A customer getting charged twice is worse than a failed payment. Always use idempotency keys.

## How to Use

Pass the `X-Idempotency-Key` header on `POST /api/transactions`:

### Node.js SDK

```typescript
const charge = await garu.charges.create(
  {
    productId: "your-product-uuid",
    paymentMethod: "pix",
    customer: {
      /* ... */
    },
  },
  {
    idempotencyKey: "pix-charge/order-12345",
  },
);
```

### cURL

```bash
curl -X POST https://garu.com.br/api/transactions \
  -H "Authorization: Bearer sk_live_..." \
  -H "X-Idempotency-Key: pix-charge/order-12345" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

## Key Format

Use semantic keys that tie the charge to your business entity:

```
<payment-type>/<entity-id>

Examples:
  pix-charge/order-12345
  card-charge/checkout-session-abc
  boleto-charge/invoice-2026-001
  subscription/user-789/month-04
```

## Behavior

| Scenario                               | Result                                           |
| -------------------------------------- | ------------------------------------------------ |
| First request with key `K`             | Charge created, response cached for 24 hours     |
| Retry with same key `K` + same payload | Returns cached original response (no new charge) |
| Same key `K` + different payload       | Returns `409 Conflict` error                     |
| Key `K` after 24 hours                 | Key expired, treated as new request              |
| No key provided                        | Charge always created (no dedup protection)      |

## Constraints

| Property              | Value                                                       |
| --------------------- | ----------------------------------------------------------- |
| Header names accepted | `X-Idempotency-Key`, `x-idempotency-key`, `Idempotency-Key` |
| Max length            | 255 characters                                              |
| Expiration            | 24 hours                                                    |
| Scope                 | Per seller (different sellers can use the same key)         |
| Case-sensitive        | Yes                                                         |

## Common Mistakes

| #   | Mistake                                | Fix                                                                                                                                                                               |
| --- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Using UUID/random keys**             | Random keys provide no dedup value — each retry gets a new key. Use deterministic keys tied to your business entity.                                                              |
| 2   | **Omitting keys on retry logic**       | If your queue or job system retries, it MUST pass the same idempotency key.                                                                                                       |
| 3   | **Reusing keys for different charges** | Each distinct charge needs a unique key. `order-123` for a PIX charge and then `order-123` for a card retry will conflict. Use `pix-charge/order-123` vs `card-charge/order-123`. |
| 4   | **Changing payload on retry**          | Same key + different payload = `409`. If you need to change the charge, use a new key.                                                                                            |
| 5   | **Assuming keys never expire**         | Keys expire after 24 hours. If you retry after 24h, the charge will be created again.                                                                                             |

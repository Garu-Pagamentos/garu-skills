# Webhooks

Receive real-time notifications when payment statuses change. Essential for PIX and boleto (which are asynchronous) and useful for card charges (refunds, chargebacks).

## Webhook Events

| Event                         | Trigger                                                   | Common use                               |
| ----------------------------- | --------------------------------------------------------- | ---------------------------------------- |
| `transaction.updateStatus`    | Transaction status changes (paid, denied, refunded, etc.) | Fulfill orders, update UI, send receipts |
| `subscription.addTransaction` | New recurring charge created                              | Track subscription billing cycles        |

## Webhook Request Format

Garu sends a `POST` request to your configured endpoint:

```typescript
{
  event: 'transaction.updateStatus',
  webhookId: 12345,           // Unique — use for idempotency
  confirmHash: 'abc123...',   // Verify this against your webhook secret
  Transaction: {
    galaxPayId: 67890,
    status: 'payedPix',       // New status
    value: 4999,              // Amount in centavos (integer)
    payday: '2026-04-09',     // Payment date
    fee: 15,                  // Gateway fee in centavos (PIX only)
    Pix: {                    // Present for PIX payments
      qrCode: '...',
      endToEndId: '...',      // BACEN end-to-end ID
    },
    Boleto: {                 // Present for boleto payments
      bankLine: '...',
      barCode: '...',
    },
  }
}
```

## Setting Up a Webhook Endpoint

### Node.js (Express)

```typescript
import express from "express";
import { verifyGaruWebhook } from "./verify_webhook";

const app = express();
app.use(express.json());

app.post("/api/webhooks/garu", (req, res) => {
  // Step 1: Verify the webhook signature (constant-time comparison)
  const result = verifyGaruWebhook(req.body, process.env.GARU_WEBHOOK_SECRET);
  if (!result.verified) {
    return res.status(401).json({ success: false, reason: result.reason });
  }

  // Step 2: Check for duplicate delivery (idempotency)
  // Use a durable store (Redis, DB) — NOT an in-memory Set
  const { webhookId, event } = req.body;
  // if (await isDuplicate(webhookId)) return res.json({ success: true });

  // Step 3: Handle the event
  if (event === "transaction.updateStatus") {
    const { galaxPayId, status } = req.body.Transaction;

    switch (status) {
      case "payedPix":
      case "payedBoleto":
      case "captured":
        // Payment confirmed — fulfill the order
        break;
      case "denied":
        // Card declined
        break;
      case "reversed":
        // Refund processed
        break;
    }
  }

  // Step 4: Mark as processed AFTER successful handling
  // await markProcessed(webhookId);

  return res.json({ success: true });
});
```

### Node.js (NestJS)

```typescript
import { verifyGaruWebhook } from './verify_webhook';

@Post('webhooks/garu')
handleWebhook(@Body() body: WebhookPayload) {
  const result = verifyGaruWebhook(body, process.env.GARU_WEBHOOK_SECRET);
  if (!result.verified) {
    throw new UnauthorizedException(`Webhook verification failed: ${result.reason}`);
  }

  // Process event...
  return { success: true };
}
```

## Webhook Security

1. **Verify `confirmHash`** — compare against your `GARU_WEBHOOK_SECRET` environment variable using constant-time comparison (`crypto.timingSafeEqual`). See `scripts/verify_webhook.ts` for a copy-paste-ready implementation.
2. **Check `webhookId` for duplicates** — webhooks may be retried; store `webhookId` in a durable store (Redis, database) after successful processing. In-memory sets do not survive restarts or work across PM2 cluster processes.
3. **IP allowlist** (optional, defense-in-depth):
   - Production: `54.232.59.251`, `54.232.204.133`
   - Sandbox: `54.207.173.93`
   - **Note:** These IPs may change over time. Always check the [Garu documentation](https://docs.garu.com.br) for the latest list. Never rely on IP filtering as your sole authentication — `confirmHash` signature verification must remain the primary mechanism.

**About `GARU_WEBHOOK_SECRET`:** This is the env var name for YOUR server (the webhook consumer). Set its value to the webhook hash from your Garu dashboard. The Garu backend internally stores this as `GALAXPAY_WEBHOOK_HASH` — you do not need that internal name unless you are working on the Garu backend itself.

## Webhook Retry Behavior

If your endpoint returns a non-2xx status or times out, the webhook is retried with exponential backoff. Always return `200 OK` promptly, then process the event asynchronously if needed.

## Paid Statuses (use for fulfillment)

```typescript
const PAID_STATUSES = ["captured", "payedBoleto", "payedPix"];

function isPaid(status: string): boolean {
  return PAID_STATUSES.includes(status);
}
```

## Common Mistakes

| #   | Mistake                               | Fix                                                                                                  |
| --- | ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | **Not verifying `confirmHash`**       | Always verify before processing. Without verification, anyone can send fake events to your endpoint. |
| 2   | **Not handling duplicate deliveries** | Store processed `webhookId` values. Webhooks may be retried on timeout.                              |
| 3   | **Parsing JSON before verification**  | Parse the body, then verify `confirmHash` before acting on the data.                                 |
| 4   | **Blocking the response**             | Return `200 OK` immediately. Process the event async. Long-running handlers cause retries.           |
| 5   | **Ignoring `webhookId`**              | This is your idempotency key. Without it, retry storms can cause duplicate fulfillment.              |
| 6   | **Hardcoding IP allowlist only**      | IP allowlist is defense-in-depth, not primary auth. Always verify `confirmHash`.                     |

# PIX Charges

Create instant payment charges using PIX — Brazil's real-time payment system. The customer scans a QR code or copies a PIX code to pay.

## Create a PIX Charge — Node.js

```typescript
import Garu from "@garuhq/node";

const garu = new Garu({ apiKey: process.env.GARU_API_KEY });

const charge = await garu.charges.create(
  {
    productId: "your-product-uuid",
    paymentMethod: "pix",
    customer: {
      name: "Maria Silva",
      email: "maria@example.com",
      document: "12345678900", // CPF (11 digits)
      phone: "11999998888",
    },
    additionalInfo: "Order #12345", // optional metadata
  },
  {
    idempotencyKey: "pix-charge/order-12345",
  },
);

// Display QR code or copy-paste code to the user
console.log("PIX code:", charge.code);
console.log("Status:", charge.status); // 'pendingPix'
```

## Create a PIX Charge — cURL

```bash
curl -X POST https://garu.com.br/api/transactions \
  -H "Authorization: Bearer sk_live_..." \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: pix-charge/order-12345" \
  -d '{
    "productId": "your-product-uuid",
    "paymentMethodId": "pix",
    "customer": {
      "name": "Maria Silva",
      "email": "maria@example.com",
      "document": "12345678900",
      "phone": "11999998888"
    },
    "additionalInfo": "Order #12345"
  }'
```

## Response Fields

| Field        | Type   | Description                                                   |
| ------------ | ------ | ------------------------------------------------------------- |
| `id`         | number | Garu transaction ID                                           |
| `galaxPayId` | number | Gateway transaction ID (used in webhooks)                     |
| `code`       | string | PIX copy-paste code (copia e cola) — display this to the user |
| `status`     | string | Initial status: `pendingPix`                                  |
| `value`      | number | Amount in BRL (e.g., 49.99)                                   |
| `date`       | string | Creation timestamp                                            |

## PIX Payment Flow

```
1. Create charge → status: pendingPix
2. Display QR code / copy-paste code to customer
3. Customer pays via their bank app
4. Webhook fires → status: payedPix
5. Confirm payment in your system
```

## PIX Statuses

| Status           | Meaning                                | Action              |
| ---------------- | -------------------------------------- | ------------------- |
| `pendingPix`     | QR code generated, waiting for payment | Show QR to customer |
| `payedPix`       | Payment confirmed by BACEN             | Fulfill order       |
| `unavailablePix` | QR code expired                        | Create a new charge |
| `cancel`         | Cancelled before payment               | No action needed    |

## Displaying the QR Code

The `code` field contains the PIX "copia e cola" (copy-paste) string. To show a QR code:

```typescript
// Option 1: Use a QR library (recommended)
import QRCode from "qrcode";
const qrDataUrl = await QRCode.toDataURL(charge.code);

// Option 2: Display the copy-paste code as text
// Let the user copy it and paste into their banking app
```

**Never generate PIX codes manually.** Always use the `code` field from the charge response.

## Common Mistakes

| #   | Mistake                           | Fix                                                                                                    |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1   | **Building QR code from scratch** | Use the `code` field from the response. Never construct PIX codes manually — they contain signed data. |
| 2   | **Assuming instant confirmation** | PIX is near-instant but async. Wait for the `transaction.updateStatus` webhook with `payedPix` status. |
| 3   | **Not handling expiration**       | PIX QR codes expire. Check for `unavailablePix` status and offer to create a new charge.               |
| 4   | **Missing customer document**     | CPF (11 digits for individuals) or CNPJ (14 digits for businesses) is required.                        |
| 5   | **Polling instead of webhooks**   | Use webhooks for payment confirmation. Polling wastes resources and adds latency.                      |

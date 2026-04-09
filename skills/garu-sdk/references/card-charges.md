# Card Charges

Create credit and debit card charges. Supports installments (parcelas), which are standard in Brazilian e-commerce.

## Create a Card Charge — Node.js

```typescript
import Garu from "@garuhq/node";

const garu = new Garu({ apiKey: process.env.GARU_API_KEY });

const charge = await garu.charges.create(
  {
    productId: "your-product-uuid",
    paymentMethod: "creditcard",
    customer: {
      name: "João Santos",
      email: "joao@example.com",
      document: "12345678900",
      phone: "11999998888",
    },
    CardInfo: {
      cardNumber: "4111111111111111",
      cvv: "123",
      expirationDate: "2028-12", // YYYY-MM format
      holderName: "JOAO SANTOS",
      installments: 3, // 1-12
    },
  },
  {
    idempotencyKey: "card-charge/order-12345",
  },
);

console.log("Status:", charge.status); // 'authorized' or 'captured'
```

## Create a Card Charge — cURL

```bash
curl -X POST https://garu.com.br/api/transactions \
  -H "Authorization: Bearer sk_live_..." \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: card-charge/order-12345" \
  -d '{
    "productId": "your-product-uuid",
    "paymentMethodId": "creditcard",
    "customer": {
      "name": "João Santos",
      "email": "joao@example.com",
      "document": "12345678900",
      "phone": "11999998888"
    },
    "CardInfo": {
      "cardNumber": "4111111111111111",
      "cvv": "123",
      "expirationDate": "2028-12",
      "holderName": "JOAO SANTOS",
      "installments": 3
    }
  }'
```

## Card-Specific Fields

| Field            | Type   | Required | Description                           |
| ---------------- | ------ | -------- | ------------------------------------- |
| `cardNumber`     | string | Yes      | 13-19 digits, no spaces or dashes     |
| `cvv`            | string | Yes      | 3-4 digits                            |
| `expirationDate` | string | Yes      | `YYYY-MM` format                      |
| `holderName`     | string | Yes      | Name as printed on card (3-255 chars) |
| `installments`   | number | Yes      | 1-12 (1 = single payment)             |

## Installments (Parcelas)

Installments are standard in Brazilian e-commerce. The total amount is split across monthly payments.

```typescript
// Single payment (à vista)
{
  installments: 1;
}

// 3x installments
{
  installments: 3;
} // Customer pays 1/3 each month

// Up to 12x
{
  installments: 12;
}
```

The maximum number of installments may vary by product configuration and seller agreement.

## Card Statuses

| Status       | Meaning                          | Action                                             |
| ------------ | -------------------------------- | -------------------------------------------------- |
| `authorized` | Card authorized, pending capture | Payment will be captured automatically             |
| `captured`   | Payment captured successfully    | Fulfill order                                      |
| `denied`     | Card declined                    | Show error, suggest another card or payment method |
| `reversed`   | Refunded                         | Refund processed                                   |
| `chargeback` | Customer disputed the charge     | Handle dispute process                             |

## PCI-DSS Requirements

**Critical:** Card data handling must comply with PCI-DSS.

- **Never store** card numbers, CVV, or full track data after authorization
- **Never log** card numbers or CVV — log only charge ID and status
- **Always use TLS 1.2+** for transmission
- **Always call from server-side** — never send card data from the browser
- Use the charge `id` as a reference token for future operations (refunds, lookups)

## Common Mistakes

| #   | Mistake                                 | Fix                                                                                                                                                                                                                           |
| --- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Storing card data**                   | Never store PAN or CVV. Use charge IDs as references. PCI-DSS violation.                                                                                                                                                      |
| 2   | **Sending from browser**                | Card data must be sent from server-side only. The API blocks CORS.                                                                                                                                                            |
| 3   | **Wrong expiration format**             | Use `YYYY-MM` (e.g., `2028-12`), not `MM/YY` or `12/28`.                                                                                                                                                                      |
| 4   | **Missing installments**                | `installments` is required for card charges. Use `1` for single payment (à vista).                                                                                                                                            |
| 5   | **Not handling `denied`**               | Card declines are common. Always offer alternative payment methods (PIX, boleto).                                                                                                                                             |
| 6   | **Logging card data in error handlers** | Error handlers often serialize the full request. Sanitize card fields before logging.                                                                                                                                         |
| 7   | **Wrong `CardInfo` casing**             | The REST API uses PascalCase `CardInfo`, not `cardInfo`. Frontend code may use camelCase `creditCard` for the payment method while the API field `paymentMethodId` expects lowercase `creditcard` — normalize before sending. |

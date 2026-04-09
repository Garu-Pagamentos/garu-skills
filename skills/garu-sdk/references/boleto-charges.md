# Boleto Charges

Create boleto bancário charges — a Brazilian payment slip with a barcode. The customer pays at any bank, lottery house, or via internet banking.

## Create a Boleto Charge — Node.js

```typescript
import Garu from "@garuhq/node";

const garu = new Garu({ apiKey: process.env.GARU_API_KEY });

const charge = await garu.charges.create(
  {
    productId: "your-product-uuid",
    paymentMethod: "boleto",
    customer: {
      name: "Ana Costa",
      email: "ana@example.com",
      document: "12345678900",
      phone: "11999998888",
      // Address is REQUIRED for boleto
      zipCode: "01310100",
      street: "Av. Paulista",
      number: "1000",
      complement: "Sala 501",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
    },
  },
  {
    idempotencyKey: "boleto-charge/order-12345",
  },
);

// charge.code contains the boleto bank line (linha digitável)
console.log("Bank line:", charge.code);
console.log("Status:", charge.status); // 'pendingBoleto'
```

## Create a Boleto Charge — cURL

```bash
curl -X POST https://garu.com.br/api/transactions \
  -H "Authorization: Bearer sk_live_..." \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: boleto-charge/order-12345" \
  -d '{
    "productId": "your-product-uuid",
    "paymentMethodId": "boleto",
    "customer": {
      "name": "Ana Costa",
      "email": "ana@example.com",
      "document": "12345678900",
      "phone": "11999998888",
      "zipCode": "01310100",
      "street": "Av. Paulista",
      "number": "1000",
      "complement": "Sala 501",
      "neighborhood": "Bela Vista",
      "city": "São Paulo",
      "state": "SP"
    }
  }'
```

## Boleto-Specific Requirements

**Customer address is mandatory for boleto.** Unlike PIX and card, boleto charges require the customer's full address:

| Field          | Type   | Required | Description                                  |
| -------------- | ------ | -------- | -------------------------------------------- |
| `zipCode`      | string | Yes      | CEP, 8 digits (e.g., `01310100`)             |
| `street`       | string | Yes      | Street name                                  |
| `number`       | string | Yes      | House/building number                        |
| `complement`   | string | No       | Apartment, suite, etc.                       |
| `neighborhood` | string | Yes      | Bairro                                       |
| `city`         | string | Yes      | City name                                    |
| `state`        | string | Yes      | 2-letter state code (e.g., `SP`, `RJ`, `MG`) |

## Boleto Payment Flow

```
1. Create charge → status: pendingBoleto
2. Customer receives boleto (email or page)
3. Customer pays at bank/lottery/online banking
4. Bank compensates (1-3 business days)
5. Webhook fires → status: payedBoleto
6. Confirm payment in your system
```

## Boleto Statuses

| Status           | Meaning                            | Action                                 |
| ---------------- | ---------------------------------- | -------------------------------------- |
| `pendingBoleto`  | Boleto issued, waiting for payment | Show boleto to customer                |
| `payedBoleto`    | Payment compensated                | Fulfill order                          |
| `notCompensated` | Boleto expired unpaid              | Offer new boleto or alternative method |
| `cancel`         | Cancelled                          | No action needed                       |

## Boleto Compensation Time

Boleto payments are **not instant**. After the customer pays:

- **Same-bank:** Usually compensated same day or next business day
- **Cross-bank:** 1-3 business days via CIP/COMPE

Always use webhooks to confirm payment — do not assume payment based on the customer saying they paid.

## Common Mistakes

| #   | Mistake                       | Fix                                                                                                    |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1   | **Missing customer address**  | Boleto requires full address (zipCode, street, number, neighborhood, city, state). PIX and card don't. |
| 2   | **Assuming instant payment**  | Boleto compensation takes 1-3 business days. Use webhooks for confirmation.                            |
| 3   | **Not offering alternatives** | Many customers abandon boleto. Offer PIX as a faster alternative alongside boleto.                     |
| 4   | **Wrong state code**          | Use 2-letter uppercase codes: `SP`, `RJ`, `MG`, `BA`, etc. Not full state names.                       |
| 5   | **Missing CEP format**        | 8 digits, no dash. Use `01310100`, not `01310-100`.                                                    |

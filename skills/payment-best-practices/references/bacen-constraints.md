# BACEN Constraints

Rules and limits imposed by the Banco Central do Brasil (BACEN) that affect payment integrations, especially PIX.

## PIX Transaction Limits

| Period                 | Default limit                | Configurable?                                     |
| ---------------------- | ---------------------------- | ------------------------------------------------- |
| Daytime (6:00–20:00)   | No default cap (set by bank) | Yes, per bank                                     |
| Nocturnal (20:00–6:00) | R$1,000.00                   | Yes, customer can request increase (takes 24-48h) |
| Per transaction        | Varies by bank               | Yes                                               |
| Daily aggregate        | Varies by bank               | Yes                                               |

**Important:** These limits are on the **payer's** side (the customer), not on the receiver (your business). If a customer hits their limit, the PIX payment will fail — your system should handle this gracefully and suggest alternatives.

## PIX Operational Rules

### Settlement

- PIX settles via **SPI (Sistema de Pagamentos Instantâneos)**
- Settlement is **real-time**, 24/7/365 — including weekends and holidays
- Funds are available in the receiver's account within seconds
- Your Garu webhook fires when BACEN confirms the credit

### QR Code Expiration

- PIX QR codes have a configurable expiration time
- Expired QR codes return `unavailablePix` status
- Always handle expiration gracefully — offer to generate a new charge

### PIX Refund (Devolução)

- PIX refunds must be initiated within 90 days of the original transaction
- Partial refunds are supported
- Refunds settle in real-time (same as payments)
- BACEN tracks all refunds via the original `endToEndId`

## Card Payment Rules

### Settlement Timeline

| Type           | Standard             | Anticipated                    |
| -------------- | -------------------- | ------------------------------ |
| Credit (1x)    | D+30                 | D+2 (with fee)                 |
| Credit (2-12x) | D+30 per installment | D+2 (with fee per installment) |
| Debit          | D+1                  | N/A                            |

### Chargeback Window

- Customers can dispute card charges up to **180 days** after purchase
- Chargebacks reverse the full amount + potential chargeback fee
- Maintain evidence (delivery proof, signed terms, IP logs) for dispute defense

## Boleto Rules

### Compensation

- Boleto compensation happens via **CIP (Câmara Interbancária de Pagamentos)** or **COMPE**
- Same-bank: usually same day or next business day
- Cross-bank: 1-3 business days
- Only processes on business days (no weekends, no holidays)

### Expiration

- Boleto has a configurable due date
- Customers can pay after the due date (with or without late fees, depending on configuration)
- Expired boletos that are never paid are written off after the compensation window

## Brazilian Business Days

Brazilian payment processing follows **BACEN's business day calendar**:

- No processing on weekends (Saturday, Sunday)
- No processing on national holidays
- No processing on some regional banking holidays
- Card and boleto settlement only on business days; PIX settles 24/7

Plan for this when setting expectations with customers (e.g., "your boleto payment will be confirmed within 1-3 business days").

## Common Mistakes

| #   | Mistake                                         | Fix                                                                                                 |
| --- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | **Ignoring nocturnal PIX limits**               | R$1,000 default at night. If your product costs more, warn the customer or suggest daytime payment. |
| 2   | **Assuming instant settlement for boleto**      | Boleto takes 1-3 business days. Only PIX is truly instant.                                          |
| 3   | **Not handling PIX expiration**                 | QR codes expire. Detect `unavailablePix` status and offer a new charge.                             |
| 4   | **Forgetting business day calendar**            | Card and boleto settlement skip weekends and holidays. Don't promise "next day" without checking.   |
| 5   | **Not keeping chargeback evidence**             | Card disputes can happen up to 180 days later. Log IP, delivery proof, customer consent.            |
| 6   | **Assuming PIX refund is instant on your side** | PIX refunds settle instantly for the customer, but your reconciliation needs to track the debit.    |

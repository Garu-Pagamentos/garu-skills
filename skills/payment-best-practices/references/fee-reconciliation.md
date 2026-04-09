# Fee Reconciliation

Understand how fees work across PIX, card, and boleto so you can reconcile what you charged vs what you received.

## Fee Structure by Payment Method

| Method          | Typical fee                                | Settlement time                 | Fee deducted from |
| --------------- | ------------------------------------------ | ------------------------------- | ----------------- |
| **PIX**         | 0% – 1.5% (varies by volume)               | Same day (D+0)                  | Settlement amount |
| **Credit card** | 2% – 5% MDR (varies by brand/installments) | D+30 (or D+2 with anticipation) | Settlement amount |
| **Debit card**  | 1% – 2% MDR                                | D+1                             | Settlement amount |
| **Boleto**      | R$1.50 – R$5.00 fixed per boleto           | D+1 to D+3 (compensation)       | Settlement amount |

**MDR** = Merchant Discount Rate (the percentage the acquirer/gateway takes).

## Key Concept: Charge Amount vs Settlement Amount

```
Charge amount (what customer pays)
  - Gateway fee (Garu/Celcoin)
  - Interchange fee (card brand, for card payments)
  = Settlement amount (what you receive)
```

Example for a R$100 credit card charge with 3.5% MDR:

```
R$100.00 (charge)
 - R$3.50 (MDR)
 = R$96.50 (settlement)
```

Example for a R$100 PIX charge with 0.5% fee:

```
R$100.00 (charge)
 - R$0.50 (fee)
 = R$99.50 (settlement)
```

## Reconciliation Pattern

```typescript
// For each transaction, compare expected vs actual
interface ReconciliationRecord {
  transactionId: number;
  chargeAmount: number; // What the customer paid
  expectedFee: number; // Calculated from rate table
  actualFee: number; // From webhook or settlement report
  settlementAmount: number; // What arrived in your account
  discrepancy: number; // expectedFee - actualFee
  paymentMethod: string;
  settledAt: Date | null;
}

// Flag discrepancies above threshold
const DISCREPANCY_THRESHOLD = 0.01; // R$0.01
```

## PIX Fee Details

- PIX fees come in the webhook as `Transaction.fee` (in centavos)
- Settlement is typically same-day (D+0)
- Some sellers have negotiated 0% PIX fees
- BACEN mandates free PIX for individuals; fees apply to businesses (PJ)

## Card Fee Details

- MDR varies by: card brand (Visa, Mastercard, Elo, etc.), card type (credit vs debit), number of installments
- More installments = higher MDR (the acquirer advances the money)
- Settlement: D+30 for standard, D+2 for anticipated receivables
- Chargebacks reverse the full charge amount + may incur additional chargeback fee

## Boleto Fee Details

- Fixed fee per boleto (not percentage-based)
- Fee charged regardless of whether the customer pays
- Compensation: 1-3 business days after customer pays
- Expired boletos: fee already charged, no refund

## Common Mistakes

| #   | Mistake                                         | Fix                                                                                      |
| --- | ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | **Assuming PIX is always free**                 | PIX has fees for businesses (PJ). Check your Garu contract for your rate.                |
| 2   | **Ignoring installment impact on fees**         | 12x installments have significantly higher MDR than 1x. Factor this into pricing.        |
| 3   | **Not tracking boleto fees for unpaid boletos** | You pay the boleto generation fee even if the customer never pays. Track this as a cost. |
| 4   | **Assuming settlement = charge amount**         | Always subtract fees. Use webhook fee data for actual reconciliation.                    |
| 5   | **Not reconciling periodically**                | Run daily reconciliation jobs comparing expected vs actual settlement.                   |

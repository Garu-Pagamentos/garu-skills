# Amount Handling

How to correctly handle monetary amounts in Brazilian payment integrations. Getting this wrong causes off-by-one centavo errors, rounding bugs, and reconciliation nightmares.

## The Rule

**Use integer centavos internally. Use BRL decimal only at the API boundary.**

```typescript
// INTERNAL (your code): centavos as integers
const priceInCentavos = 4999; // R$49.99

// API BOUNDARY (Garu API): BRL as decimal
const apiAmount = 49.99; // What the API expects/returns
```

## Why Not Floats?

```typescript
// This is broken:
0.1 + 0.2 === 0.3; // false (0.30000000000000004)

// In money terms:
// R$0.10 + R$0.20 = R$0.30000000000000004
// That extra fraction causes reconciliation mismatches
```

**Never use floating-point arithmetic for money.** JavaScript's `number` type is IEEE 754 double-precision — it cannot represent all decimal fractions exactly.

## Conversion Functions

```typescript
// Centavos → BRL (for API calls)
function centavosToBrl(centavos: number): number {
  return centavos / 100;
}

// BRL → Centavos (from API responses)
function brlToCentavos(brl: number): number {
  return Math.round(brl * 100);
}

// Format for display (Brazilian locale)
function formatBrl(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centavos / 100);
}

// Examples:
formatBrl(4999); // "R$ 49,99"
formatBrl(100); // "R$ 1,00"
formatBrl(1000000); // "R$ 10.000,00"
```

## Garu API Amount Format

| Context                        | Format               | Example |
| ------------------------------ | -------------------- | ------- |
| API request/response (`value`) | BRL decimal          | `49.99` |
| Webhook `Transaction.value`    | Centavos (integer)   | `4999`  |
| Webhook `Transaction.fee`      | Centavos (integer)   | `150`   |
| Database storage               | DECIMAL(10,2) in BRL | `49.99` |

**Note the inconsistency:** The REST API uses BRL decimal, but webhooks deliver amounts in centavos. Always check which format you're receiving.

## Brazilian Currency Format

| Format              | Example     | Use                      |
| ------------------- | ----------- | ------------------------ |
| Code                | `BRL`       | API, database, headers   |
| Symbol              | `R$`        | Display to users         |
| Decimal separator   | `,` (comma) | Brazilian locale display |
| Thousands separator | `.` (dot)   | Brazilian locale display |

Display example: `R$ 1.234,56` (one thousand, two hundred thirty-four reais and fifty-six centavos)

## Minimum and Maximum Amounts

| Payment method | Minimum                               | Maximum                                        |
| -------------- | ------------------------------------- | ---------------------------------------------- |
| PIX            | R$0.01                                | No hard cap (subject to customer's bank limit) |
| Credit card    | Varies by acquirer (typically R$1.00) | No hard cap                                    |
| Boleto         | Varies by bank (typically R$2.00)     | No hard cap                                    |

## Installment Amount Calculation

When splitting a card charge into installments, the total must divide evenly:

```typescript
// R$100.00 in 3 installments
// 100.00 / 3 = 33.333...
// Solution: first installment absorbs the remainder

function calculateInstallments(totalCentavos: number, count: number) {
  const base = Math.floor(totalCentavos / count);
  const remainder = totalCentavos - base * count;

  return Array.from({ length: count }, (_, i) =>
    i === 0 ? base + remainder : base,
  );
}

calculateInstallments(10000, 3);
// [3334, 3333, 3333] → R$33.34 + R$33.33 + R$33.33 = R$100.00
```

## Common Mistakes

| #   | Mistake                                          | Fix                                                                                                  |
| --- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 1   | **Using `amount: 10.50` thinking it's centavos** | The Garu API uses BRL decimal. `10.50` means R$10.50, not R$0.10.                                    |
| 2   | **Float arithmetic for money**                   | `0.1 + 0.2 !== 0.3` in JavaScript. Use integer centavos and convert at boundaries.                   |
| 3   | **Wrong decimal separator in display**           | Brazil uses comma (`,`) not dot (`.`). Use `Intl.NumberFormat('pt-BR', ...)`.                        |
| 4   | **Not rounding when converting**                 | Always `Math.round()` when converting BRL to centavos. `49.99 * 100 = 4998.999...` without rounding. |
| 5   | **Mixing API and webhook formats**               | API returns BRL decimal; webhooks send centavos. Check the source before processing.                 |

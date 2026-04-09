---
name: payment-best-practices
description: >
  Brazilian payment compliance and best practices — LGPD, PCI-DSS, BACEN regulations, fee reconciliation, amount handling. Use when building payment features for Brazil.
metadata:
  author: garu
  version: "0.1.0"
  homepage: https://garu.com.br
  source: https://github.com/Garu-Pagamentos/garu-skills
references:
  - lgpd-pci.md
  - fee-reconciliation.md
  - bacen-constraints.md
  - amount-handling.md
---

# Payment Best Practices (Brazil)

Guidance for building compliant, reliable payment integrations for the Brazilian market.

## Architecture Overview

```
[Customer] → [Checkout UI] → [Your Server] → [Garu API]
                                                  ↓
                                            [Celcoin / BACEN]
                                                  ↓
                                          [Payment Processed]
                                                  ↓
                                            [Webhook Event]
                                                  ↓
                    ┌────────────┬──────────┬─────────────┐
                    ↓            ↓          ↓             ↓
               PIX Paid    Card Captured  Boleto Paid  Denied/Failed
                    ↓            ↓          ↓             ↓
              [Fulfill]    [Fulfill]   [Fulfill]     [Retry/Alert]
                    ↓            ↓          ↓
              [Settlement: same day] [D+30]  [D+1 to D+3]
                    ↓            ↓          ↓
              [Reconcile: actual vs expected fees]
```

## Quick Reference

| Need to...                                       | See                                                    |
| ------------------------------------------------ | ------------------------------------------------------ |
| Handle LGPD for payment data, PCI-DSS compliance | [LGPD & PCI-DSS](references/lgpd-pci.md)               |
| Understand fees across PIX, card, boleto         | [Fee Reconciliation](references/fee-reconciliation.md) |
| PIX limits, BACEN rules, settlement timing       | [BACEN Constraints](references/bacen-constraints.md)   |
| Amount formatting, centavos vs BRL, rounding     | [Amount Handling](references/amount-handling.md)       |

## Never do this

- **Never store CVV, PIN, or full track data** after authorization — PCI-DSS violation, subject to fines.
- **Never log card numbers** — not even masked. Log only charge IDs.
- **Never collect more personal data than needed** — LGPD data minimization principle.
- **Never hardcode API keys or credentials** in source code or config files committed to git.
- **Never use floating-point arithmetic** for money — use integer centavos internally.
- **Never assume instant settlement** — each payment method has different settlement timelines.
- **Never ignore webhooks** — async payment methods (PIX, boleto) require webhook confirmation.

## Always do this

- **Use TLS 1.2+** for all API communication — PCI-DSS requirement.
- **Verify webhook signatures** before processing any event.
- **Include idempotency keys** on every charge creation — prevents duplicate charges.
- **Validate CPF/CNPJ** before sending to the API — saves an API call and improves UX.
- **Offer multiple payment methods** — PIX + card + boleto covers 95%+ of Brazilian consumers.
- **Handle chargebacks** — implement dispute handling, especially for card payments.
- **Log with Sentry** — use `Sentry.captureException` in `.catch()` blocks, never silent log-only.

## Payment Method Selection Guide

| Scenario                    | Recommended | Why                                       |
| --------------------------- | ----------- | ----------------------------------------- |
| Low-value purchase (< R$50) | PIX         | Lowest fees (~0%), instant confirmation   |
| High-value purchase         | PIX or Card | PIX for lower fees; Card for installments |
| Customer wants installments | Card        | Only payment method with parcelas         |
| B2B / invoice payment       | Boleto      | Standard for business invoicing in Brazil |
| Subscription / recurring    | Card        | Auto-debit on billing cycle               |
| Customer without bank app   | Boleto      | Payable at lottery houses, bank branches  |

## Common Mistakes

| #   | Mistake                                 | Fix                                                                                                                                 |
| --- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Using floats for money**              | Use integer centavos internally. Convert to BRL decimal only at API boundary. See [Amount Handling](references/amount-handling.md). |
| 2   | **Storing card data "just in case"**    | PCI-DSS prohibits storing CVV after auth. Store only charge IDs. See [LGPD & PCI](references/lgpd-pci.md).                          |
| 3   | **Ignoring nocturnal PIX limits**       | BACEN limits PIX to R$1,000 at night by default. See [BACEN Constraints](references/bacen-constraints.md).                          |
| 4   | **Not reconciling fees**                | Actual settlement differs from charge amount. Track fees per method. See [Fee Reconciliation](references/fee-reconciliation.md).    |
| 5   | **Treating all methods as synchronous** | Only card is near-synchronous. PIX and boleto are async — use webhooks.                                                             |
| 6   | **Missing LGPD consent**                | Collect explicit consent before storing personal data. Provide deletion mechanism.                                                  |
| 7   | **Not validating CPF/CNPJ format**      | 11 digits = CPF (individual), 14 digits = CNPJ (business). Validate check digits.                                                   |
| 8   | **Silently catching payment errors**    | Use `Sentry.captureException(err)` with contextual tags. Never swallow errors in payment flows.                                     |

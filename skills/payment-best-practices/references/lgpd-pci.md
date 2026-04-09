# LGPD & PCI-DSS Compliance

Brazilian payment integrations must comply with both LGPD (Lei Geral de Proteção de Dados) and PCI-DSS (Payment Card Industry Data Security Standard).

## PCI-DSS Essentials

### What You Must Never Store

| Data                         | After Auth?       | Ever?                       |
| ---------------------------- | ----------------- | --------------------------- |
| Full card number (PAN)       | Mask or tokenize  | Store only first 6 / last 4 |
| CVV / CVC                    | **Never**         | **Never**                   |
| PIN                          | **Never**         | **Never**                   |
| Track data (magnetic stripe) | **Never**         | **Never**                   |
| Card expiration date         | Only if encrypted | Prefer tokens               |

### What You Must Always Do

1. **Use TLS 1.2+** for all data transmission — no exceptions
2. **Never log card data** — not even masked PANs in debug logs
3. **Use charge IDs as references** — Garu returns an `id` for every transaction; use this instead of card data
4. **Restrict access** — only people who need card-adjacent systems should have access (RBAC, deny-all default)
5. **Audit trails** — log all access to payment systems, retain for 1 year minimum
6. **Unique credentials** — no shared accounts, enforce MFA for admin access
7. **Regular dependency audits** — run `npm audit` regularly, pin exact versions

### Practical Checklist

```
[ ] Card data sent over TLS 1.2+ only
[ ] CVV never stored after authorization
[ ] PAN masked or tokenized in storage
[ ] No card data in logs (including error serialization)
[ ] Charge IDs used as references (not card data)
[ ] RBAC with deny-all default
[ ] MFA on admin/dashboard access
[ ] Audit logs for payment system access
[ ] Dependencies pinned to exact versions
[ ] npm audit runs in CI pipeline
```

## LGPD Essentials

LGPD is Brazil's data protection law (similar to GDPR). It applies to all personal data collected from Brazilian residents.

### Core Principles for Payment Data

| Principle               | What it means for payments                                                         |
| ----------------------- | ---------------------------------------------------------------------------------- |
| **Consent**             | Collect explicit consent before storing personal data beyond the transaction       |
| **Data minimization**   | Only collect data required for the payment — no extras                             |
| **Purpose limitation**  | Data collected for payments cannot be used for marketing without separate consent  |
| **Right to deletion**   | Customers can request deletion of their data (with exceptions for legal retention) |
| **Data portability**    | Customers can request their data in a machine-readable format                      |
| **Breach notification** | Report data breaches to ANPD within "reasonable time"                              |

### What Payment Data Falls Under LGPD

- Customer name, email, phone, CPF/CNPJ → personal data
- Transaction history → personal data (tied to individual)
- IP address, device fingerprint → personal data
- Card tokens → personal data (can be linked to individual)

### Retention Exceptions

You **cannot delete** certain data even if the customer requests it:

| Data                | Mandatory retention | Reason                                |
| ------------------- | ------------------- | ------------------------------------- |
| Transaction records | 5 years minimum     | Tax/fiscal obligations (CTN Art. 174) |
| Invoice data        | 5 years             | Código de Defesa do Consumidor        |
| Anti-fraud records  | Up to 5 years       | Legitimate interest                   |

### Practical Checklist

```
[ ] Privacy policy explains what payment data is collected and why
[ ] Explicit consent mechanism before storing data beyond transaction
[ ] Data deletion endpoint (respecting mandatory retention periods)
[ ] Data export endpoint (machine-readable format)
[ ] Breach notification process documented
[ ] Data processing records maintained
[ ] DPO (Data Protection Officer) designated
[ ] Third-party processors (Celcoin, etc.) have DPA agreements
```

## LGPD + PCI Intersection

| Scenario                   | LGPD says        | PCI says           | Do this                                                   |
| -------------------------- | ---------------- | ------------------ | --------------------------------------------------------- |
| Store card number          | Minimize data    | Mask or tokenize   | Store only first 6 / last 4, use tokens                   |
| Customer requests deletion | Must delete      | Retain audit logs  | Delete personal data, keep anonymized transaction records |
| Breach detected            | Notify ANPD      | Notify card brands | Notify both, follow incident response plan                |
| Log payment requests       | Minimize logging | Audit all access   | Log access events, never log card data                    |

## Common Mistakes

| #   | Mistake                                | Fix                                                                                      |
| --- | -------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | **Storing CVV "for recurring"**        | PCI absolutely prohibits CVV storage after auth. Use Garu's subscription system instead. |
| 2   | **Logging full request bodies**        | Error handlers often serialize entire requests. Sanitize card fields before logging.     |
| 3   | **No deletion mechanism**              | LGPD requires you to delete data on request. Build the endpoint before you need it.      |
| 4   | **Using `^` versions in package.json** | Supply chain attacks can compromise payment flows. Pin exact versions.                   |
| 5   | **Shared admin credentials**           | PCI requires unique IDs and MFA. No shared passwords, no generic accounts.               |

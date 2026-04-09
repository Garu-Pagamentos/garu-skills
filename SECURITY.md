# Security Policy

## About This Project

This repository contains **documentation and agent skills** for the Garu payment gateway. It does not run as a service or process payments directly. However, it guides developers through payment integrations where security is critical.

## Reporting a Vulnerability

If you discover a security issue in this project (e.g., a leaked credential, insecure code example, or misleading security guidance), please report it privately:

- **Email:** suporte@garu.com.br
- **Subject line:** `[SECURITY] garu-skills — <brief description>`

We will acknowledge your report within 3 business days and provide a fix or mitigation plan within 10 business days.

**Please do not** open a public GitHub issue for security vulnerabilities.

## Scope

Security concerns relevant to this project include:

- Hardcoded API keys, tokens, or credentials in code examples or documentation
- Insecure code patterns in skill scripts (e.g., missing webhook signature verification)
- Misleading security guidance that could lead to PCI-DSS or LGPD violations
- Accidentally committed secrets in git history

For vulnerabilities in the **Garu platform, API, or SDK** itself, contact suporte@garu.com.br directly.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |

## Recommended Tooling

When setting up CI/CD for forks or downstream projects, we recommend enabling automated secret scanning:

- [GitHub secret scanning](https://docs.github.com/en/code-security/secret-scanning) (free for public repos)
- [git-secrets](https://github.com/awslabs/git-secrets) for pre-commit hooks
- [Trivy](https://github.com/aquasecurity/trivy) for broader supply-chain scanning
- `npm audit` for dependency vulnerabilities

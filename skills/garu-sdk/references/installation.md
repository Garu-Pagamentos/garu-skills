# Installation

Set up the Garu SDK in your project. Currently only Node.js is supported — use cURL for other languages.

## Node.js

```bash
npm install @garuhq/node
```

### Usage

```typescript
import Garu from "@garuhq/node";

const garu = new Garu({
  apiKey: process.env.GARU_API_KEY,
});

// Create a charge
const charge = await garu.charges.create({
  /* ... */
});

// List charges
const { data, meta } = await garu.charges.list({ page: 1, limit: 20 });

// Get a charge
const charge = await garu.charges.get(123);

// Refund a charge
await garu.charges.refund(123, { reason: "Customer request" });

// Create a customer
const customer = await garu.customers.create({
  /* ... */
});

// List customers
const { data, meta } = await garu.customers.list({ search: "maria" });
```

## Environment Setup

```bash
# Required
export GARU_API_KEY=sk_live_...

# Optional (for webhook verification)
export GARU_WEBHOOK_SECRET=your_webhook_hash
```

**Never hardcode API keys.** Use environment variables or a secrets manager.

## Language Detection

Check which language the project uses:

| File                                  | Language | SDK                        |
| ------------------------------------- | -------- | -------------------------- |
| `package.json`                        | Node.js  | `@garuhq/node` (available) |
| `requirements.txt` / `pyproject.toml` | Python   | Coming soon — use cURL     |
| `composer.json`                       | PHP      | Coming soon — use cURL     |
| `Gemfile`                             | Ruby     | Coming soon — use cURL     |
| `go.mod`                              | Go       | Coming soon — use cURL     |

## cURL Fallback

For languages without an SDK, use the REST API directly:

```bash
# Create a PIX charge
curl -X POST https://garu.com.br/api/transactions \
  -H "Authorization: Bearer $GARU_API_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: pix-charge/order-123" \
  -d '{
    "productId": "your-product-uuid",
    "paymentMethodId": "pix",
    "customer": {
      "name": "Maria Silva",
      "email": "maria@example.com",
      "document": "12345678900",
      "phone": "11999998888"
    }
  }'

# List charges
curl https://garu.com.br/api/transactions?page=1&limit=20 \
  -H "Authorization: Bearer $GARU_API_KEY"

# Get a charge
curl https://garu.com.br/api/transactions/123 \
  -H "Authorization: Bearer $GARU_API_KEY"
```

## MCP Server

For AI agent integration, install the Garu MCP server:

```bash
npx -y @garuhq/mcp
```

Or add to your MCP config (`.mcp.json`):

```json
{
  "mcpServers": {
    "garu": {
      "command": "npx",
      "args": ["-y", "@garuhq/mcp"],
      "env": { "GARU_API_KEY": "${GARU_API_KEY}" }
    }
  }
}
```

## CLI

For terminal workflows:

```bash
# Install
npm install -g @garuhq/cli

# Or via curl
curl -fsSL https://raw.githubusercontent.com/Garu-Pagamentos/garu-cli/main/install.sh | bash

# Login
garu login

# Create a charge
garu charges create --method pix --product your-product-uuid

# Check system health
garu doctor
```

## Common Mistakes

| #   | Mistake                           | Fix                                                                |
| --- | --------------------------------- | ------------------------------------------------------------------ |
| 1   | **Hardcoding API keys**           | Use `process.env.GARU_API_KEY`. Never commit keys to git.          |
| 2   | **Using `require()` with ESM**    | The SDK is ESM-only. Use `import` syntax or dynamic `import()`.    |
| 3   | **Installing for wrong language** | Only Node.js SDK exists today. Use cURL for Python, PHP, Ruby, Go. |

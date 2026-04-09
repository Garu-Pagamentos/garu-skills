# Garu Skills

Agent skills for the [Garu](https://garu.com.br) payment gateway. Teach Claude Code, Cursor, Codex, and other coding agents how to integrate PIX, credit card, and boleto payments in Brazil.

## Install

```bash
# Claude Code
npx skills add Garu-Pagamentos/garu-skills

# Or clone manually
git clone https://github.com/Garu-Pagamentos/garu-skills.git
cp -r garu-skills/skills/* .claude/skills/
```

## Skills

| Skill                                                                | Description                                            | Status      |
| -------------------------------------------------------------------- | ------------------------------------------------------ | ----------- |
| **[garu-sdk](skills/garu-sdk/SKILL.md)**                             | Integrate the Garu payment gateway — PIX, card, boleto | v0.1.0      |
| **[payment-best-practices](skills/payment-best-practices/SKILL.md)** | Brazilian payment compliance, LGPD, PCI-DSS, BACEN     | v0.1.0      |
| checkout-react                                                       | React checkout components with Brazilian payment masks | Coming soon |
| webhook-handling                                                     | Webhook verification and event processing              | Coming soon |
| garu-cli                                                             | CLI commands for managing charges and customers        | Coming soon |

## MCP Server

Installing this skill bundle also configures the [Garu MCP server](https://github.com/Garu-Pagamentos/garu-mcp) (`@garuhq/mcp`) via the bundled `.mcp.json`. Set your API key:

```bash
export GARU_API_KEY=sk_live_...
```

## Requirements

- A Garu account with API keys ([garu.com.br](https://garu.com.br))
- `@garuhq/node` SDK (installed automatically by skill examples)

## License

MIT

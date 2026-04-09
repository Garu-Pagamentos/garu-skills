# Garu Skills

A collection of skills for AI coding agents following the [Agent Skills](https://agentskills.io) format. Available as a plugin for Claude Code, Cursor, and OpenAI Codex. Includes an MCP server for tool access.

## Install

```bash
npx skills add Garu-Pagamentos/garu-skills
```

Then select the ones you wish to install.

## Available Skills

| Skill | Description | Source |
|---|---|---|
| [`garu-sdk`](./skills/garu-sdk) | Integrate the Garu payment gateway — PIX, card, boleto | Authored here |
| [`payment-best-practices`](./skills/payment-best-practices) | Brazilian payment compliance, LGPD, PCI-DSS, BACEN | Authored here |
| `checkout-react` | React checkout components with Brazilian payment masks | Coming soon |
| `webhook-handling` | Webhook verification and event processing | Coming soon |
| `garu-cli` | CLI commands for managing charges and customers | Synced from [Garu-Pagamentos/garu-cli](https://github.com/Garu-Pagamentos/garu-cli) |

## MCP Server

The plugin includes the [Garu MCP server](https://github.com/Garu-Pagamentos/garu-mcp), giving agents tool access to the full Garu API.

## Plugins

This repo serves as a plugin for multiple platforms:

- **Claude Code** — `.claude-plugin/`
- **Cursor** — `.cursor-plugin/`
- **OpenAI Codex** — `.codex-plugin/`

## Editing Skills

Skills marked **"Authored here"** can be edited directly in this repo.

Skills marked **"Synced from"** are automatically synced from their source repos. **Do not edit them here** — changes will be overwritten on the next sync. Edit in the source repo instead.

## Prerequisites

- A Garu account with a verified domain
- API key stored in `GARU_API_KEY` environment variable

Get your API key at [garu.com.br](https://garu.com.br)

## Security

See [SECURITY.md](SECURITY.md) for our security policy, how to report vulnerabilities, and recommended tooling for secret scanning.

## License

MIT

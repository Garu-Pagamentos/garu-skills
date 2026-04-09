# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test            # Run all tests (vitest)
npm run test:watch  # Run tests in watch mode
npx vitest run skills/garu-sdk/scripts/verify_webhook.spec.ts  # Run a single test file
```

There is no build step — this is a documentation/skill bundle, not a compiled package.

## Architecture

This project is a **multi-platform agent skill bundle** for the Garu payment gateway (PIX, credit card, boleto in Brazil). It ships skills to Claude Code, Cursor, and Codex via platform-specific plugin manifests.

### Skill structure

Each skill under `skills/<name>/` follows a convention:
- `SKILL.md` — the main prompt document that agents consume (triggers, rules, examples)
- `references/` — detailed reference docs the agent can pull in as needed
- `scripts/` — executable TypeScript utilities (e.g., webhook verification)

Corresponding eval files live at `skill-evals/<name>/evals.json`.

### Plugin manifests (three-way sync)

Three plugin directories target different platforms:
- `.claude-plugin/plugin.json` — Claude Code (has extra `skills` and `mcpServers` fields)
- `.cursor-plugin/plugin.json` — Cursor
- `.codex-plugin/plugin.json` — Codex

When bumping `version` or updating shared fields (`name`, `description`, `author`, `keywords`), update all three in lockstep. The `.claude-plugin` variant intentionally has two extra fields the others omit.

### MCP server

`.mcp.json` configures the Garu MCP server (`@garuhq/mcp`), which requires `GARU_API_KEY` env var.

## Do not edit synced skills

The following skills are synced from source repositories via GitHub Actions. Do not edit them directly — changes will be overwritten.

- `skills/garu-cli/` — synced from `garu-cli` repo (coming in Phase 3)

## Safe to edit directly

- `skills/garu-sdk/`
- `skills/payment-best-practices/`
- `skill-evals/`

# Garu Skills

## Do not edit synced skills

The following skills are synced from source repositories via GitHub Actions.
Do not edit them directly — changes will be overwritten.

- `skills/garu-cli/` — synced from `garu-cli` repo (coming in Phase 3)

## Safe to edit directly

- `skills/garu-sdk/`
- `skills/payment-best-practices/`
- `skill-evals/`

## Plugin metadata sync

When bumping `version` or updating shared fields (`name`, `description`, `author`, `keywords`), update all three plugin directories in lockstep:

- `.claude-plugin/plugin.json`
- `.cursor-plugin/plugin.json`
- `.codex-plugin/plugin.json`

The `.claude-plugin` variant has two extra fields (`skills`, `mcpServers`) that the others omit — this is intentional.

# Agent guide (LLMs and automation)

This file is for AI agents and other automated contributors working on **Sunslide**.

## Before every commit

1. **Increase or preserve test coverage** when you change behavior in `src/logic/` or add community/repo checks. Add or update tests in `tests/unit/` (Vitest).
2. **Run the full verification suite** locally when possible:
   ```bash
   npm run lint && npm run build && npm test
   ```
3. **Never commit secrets** — no API tokens, keys, personal paths, internal hostnames, or credentials. Use environment variables only in local/CI config that stays out of git.

## Project conventions

- Pure game logic belongs in `src/logic/` (no three.js meshes).
- Render and runtime slices live under `src/game/frags/` (concatenated at build time).
- Keep `window.__sunslide` working for smoke tests.
- Human-oriented docs: [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md).

## Security

Do not use public issues for vulnerabilities. Point users and agents to [SECURITY.md](SECURITY.md) and private reporting:

https://github.com/carlok/sunslide/security/advisories/new

## Contacts

Maintainer: [@carlok](https://github.com/carlok) on GitHub only (no email in routine docs except Code of Conduct enforcement).
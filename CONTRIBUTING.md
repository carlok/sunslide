# Contributing to Sunslide

Thanks for your interest in Sunslide. Maintainer contact: [@carlok](https://github.com/carlok) on GitHub.

## Development setup

Requirements: **Node.js 22** (matches CI), npm.

```bash
git clone https://github.com/carlok/sunslide.git
cd sunslide
npm ci
npx playwright install chromium   # once, for smoke tests
```

## Run tests and coverage

```bash
npm run lint
npm run build
npm run test:unit    # Vitest + v8 coverage on src/logic/
npm test             # unit + Playwright smoke (needs build)
```

Coverage thresholds are defined in `vite.config.js`. Do not lower them without a clear reason.

## Branch and pull request flow

1. Fork the repo (if you are not a collaborator).
2. Create a branch from the current default branch.
3. Make focused changes; keep commits readable.
4. Run **lint, build, and full `npm test`** before pushing.
5. Open a pull request with a summary and testing notes.

Use the [pull request template](.github/PULL_REQUEST_TEMPLATE.md). Fill in the checklist honestly.

## Security issues

Do **not** file security vulnerabilities as public issues. Follow [SECURITY.md](SECURITY.md) and use private reporting:

https://github.com/carlok/sunslide/security/advisories/new

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By participating, you agree to uphold it.
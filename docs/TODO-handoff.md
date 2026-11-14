# Handoff for the next LLM

Use this after the community-normalization PR merges (and after PR #1 engineering work is on `main`).

## Verify each claim

Run from a clean clone of `https://github.com/carlok/sunslide`.

### 1. Community files exist

```bash
test -f LICENSE && test -f SECURITY.md && test -f CONTRIBUTING.md && test -f CODE_OF_CONDUCT.md && test -f AGENT.md
```

**Expected:** silent success (exit 0).

### 2. Unit + community tests

```bash
npm ci
npx playwright install chromium
npm run lint
npm run build
npm run test:unit
```

**Expected:** Vitest reports all files passed; coverage on `src/logic/` meets thresholds in `vite.config.js` (lines/statements ≥80%, branches ≥75%, functions ≥70%).

### 3. Full test including smoke

```bash
npm test
```

**Expected:** ends with `smoke test passed — screenshots in tests/out/`.

### 4. SECURITY.md advisory URL

```bash
grep -F 'github.com/carlok/sunslide/security/advisories/new' SECURITY.md
```

**Expected:** one matching line.

### 5. Private vulnerability reporting (GitHub setting)

```bash
gh api repos/carlok/sunslide/private-vulnerability-reporting
```

**Expected (when enabled):** `"enabled":true`  
**As of PR creation:** often `"enabled":false` until the owner enables it manually.

### 6. License SPDX

```bash
head -n 1 LICENSE | grep -i Apache
```

**Expected:** header references Apache License 2.0.

## Prioritized TODO

| P | Task | Acceptance criteria |
|---|------|---------------------|
| P0 | Enable private vulnerability reporting | Settings → Code security → Private vulnerability reporting → Enable; `gh api repos/carlok/sunslide/private-vulnerability-reporting` returns `"enabled":true` |
| P0 | Retarget stacked PRs | After PR #1 merges to `main`, retarget the community PR base from `cursor/engineer-sunslide-452f` to `main` and rebase if needed |
| P1 | Confirm CI green on `main` | GitHub Actions CI workflow succeeds on merge; coverage artifact uploaded |
| P1 | Confirm Pages deploy | Live game at https://carlok.github.io/sunslide/ matches built `dist/` |
| P2 | Dependabot first PRs | Within a week, dependabot opens npm and github-actions update PRs; review and merge safely |
| P2 | Codecov (optional) | Only add a coverage badge if codecov.io is wired to the repo; otherwise keep README badges to CI + license only |

### Manual step (owner) — private reporting

The integration token could not enable reporting (`403 Resource not accessible by integration`).

**Action:** Repository **Settings → Code security and analysis → Private vulnerability reporting → Enable**.

## Starter prompt for the next LLM

```text
You are continuing work on https://github.com/carlok/sunslide.

Read docs/TODO-handoff.md and AGENT.md first.

Goals:
1. Confirm private vulnerability reporting is enabled (or document that the owner still needs to enable it).
2. After engineering PR #1 is on main, ensure community and code changes are rebased on main and CI is green.
3. Do not commit secrets. Security reports only via https://github.com/carlok/sunslide/security/advisories/new (never public issues).
4. Before each commit: add tests when behavior changes, run `npm run lint && npm run build && npm test`.

Report what you verified with command output, not assumptions.
```
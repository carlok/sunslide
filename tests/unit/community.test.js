import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ADVISORY = 'https://github.com/carlok/sunslide/security/advisories/new';

const REQUIRED_FILES = [
  'LICENSE',
  'README.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'SECURITY.md',
  'AGENT.md',
  '.github/ISSUE_TEMPLATE/config.yml',
  '.github/ISSUE_TEMPLATE/bug_report.yml',
  '.github/ISSUE_TEMPLATE/feature_request.yml',
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.github/dependabot.yml',
];

describe('community files', () => {
  it('includes required governance and template files', () => {
    for (const rel of REQUIRED_FILES) {
      expect(existsSync(path.join(root, rel)), `missing ${rel}`).toBe(true);
    }
  });

  it('SECURITY.md uses private advisory reporting only', () => {
    const text = readFileSync(path.join(root, 'SECURITY.md'), 'utf8');
    expect(text).toContain(ADVISORY);
    expect(text.toLowerCase()).toMatch(/do not.*public/);
    expect(text).not.toMatch(/file.*(public )?github issue/i);
    expect(text).not.toMatch(/security@/i);
  });

  it('issue config links security to private reporting', () => {
    const text = readFileSync(
      path.join(root, '.github/ISSUE_TEMPLATE/config.yml'),
      'utf8',
    );
    expect(text).toContain(ADVISORY);
    expect(text).toContain('blank_issues_enabled: false');
  });
});
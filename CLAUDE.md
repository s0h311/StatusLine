## Agent skills

### Issue tracker

Issues live in GitHub Issues on this repo (uses `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Checks

- No need to run tsc. `pnpm lint` already runs a type check under the hood
- No need to run Playwright tests, so use `pnpm test:unit`

# 0009: Rebuild in the same repository and domain

Status: Accepted (2026-09)

## Context

The rebuild replaces every file of the previous app. The owner asked to keep the `sadidft/boxy` repository, the
Vercel project and the domain, and not to create a second product or version.

## Decision

- The previous app is preserved as tag `legacy-1.0.23` and on branch `main` until the rebuild is merged.
- The rebuild is developed on branch `boxyverde` (internal codename only; never shown to users), verified locally
  (typecheck, lint, unit, e2e, manual walkthrough), then merged into `main`, which Vercel deploys.
- Commits are authored as "Trico AI Agent" with conventional, descriptive messages and no version labels.
- The GitHub Pages workflow of the previous app is replaced by a CI workflow; deployment stays with Vercel.
- The GitHub Pages site of the previous Boxy keeps running until the handoff has been live long enough, then it is
  reduced to a redirect page.

## Consequences

- One repository, one domain, one product name.
- Legacy fixtures used by tests are generated from the tagged code (`scripts/fixtures/make-legacy.mjs`) so the
  migrator is always tested against real output of the previous app.

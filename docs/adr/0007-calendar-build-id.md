# 0007: Calendar build id instead of a product version

Status: Accepted (2026-09)

## Context

Boxy is one product that replaces the previous Boxy entirely. Version labels ("2.0", "Reborn") in the UI, docs or
commit messages create two products in users' heads and age badly.

## Decision

- No semver anywhere in copy. The About page shows `__BUILD_ID__` (`YYYY.MM.DDHH`, UTC) and the short commit hash.
- `package.json` keeps a private version field only because npm requires one; it is never displayed.
- `scripts/lint-copy.mjs` (guardrail G8) fails on version-like labels in copy, README, docs and manifests.
- The previous app is referred to as "the previous Boxy".

## Consequences

- Release notes are dated, not numbered.
- Export files carry `_meta.format` (an integer for the file schema) and `_meta.build`, not a product version.

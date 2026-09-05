# 0008: Self-hosted IBM Plex Mono and Instrument Serif

Status: Accepted (2026-09)

## Context

The brand of rafifsadid.my.id uses a mono UI face and a serif display face. Boxy must work offline and must not
contact third parties (ADR 0006).

## Decision

Ship subsetted WOFF2 files in `public/fonts/` (IBM Plex Mono 400 and 600, latin and latin-ext; Instrument Serif
regular and italic). Both are licensed under the SIL Open Font License, which allows redistribution. Preload the
two mono files, `font-display: swap`, and precache everything in the service worker.

## Alternatives considered

- Google Fonts: fast on first visit, but a third-party request and not available offline before the first cache.
  Rejected.
- System fonts only: no third party, but the brand relies on the mono face for the "signal" look. Not chosen.

## Consequences

- Font budget is about 120 KB for the initial mono files; the serif loads on demand for reading mode.

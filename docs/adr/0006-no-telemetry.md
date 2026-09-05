# 0006: No telemetry

Status: Accepted (2026-09)

## Context

Boxy stores personal text: addresses, replies, sometimes credentials. Trust is the product.

## Decision

Boxy sends nothing anywhere. No analytics, no crash reporting, no remote config, no fonts from a CDN. The CSP
in `vercel.json` sets `connect-src 'self'`, so a regression would fail loudly in the browser console.
Web vitals may be printed to the console in development only.

## Consequences

- Bugs are learned from issues and from the local error toast, not from dashboards.
- Any future opt-in cloud feature must state exactly what leaves the device, in the Settings page, before it is on.

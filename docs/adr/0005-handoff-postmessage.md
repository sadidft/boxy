# 0005: Cross-origin handoff from the previous Boxy with postMessage

Status: Accepted (2026-09)

## Context

Existing users hold their data in `localStorage` of `https://sadidft.github.io/boxy/`. The new Boxy lives on
`https://boxy.sadid.my.id`. Browsers do not share storage across origins, so the data must be transferred once.

## Decision

The old site opens `https://boxy.sadid.my.id/import/handoff` in a new tab. The new tab posts
`boxy-handoff-ready {nonce}` to its opener for each allow-listed origin. The old site answers with
`boxy-handoff-data {nonce, payload: {primary, backup}, sentAt}`. The new tab checks origin and nonce, stores the
payload in Dexie (`handoff`, `imported = 0`), replies `boxy-handoff-received {nonce, counts}` and shows the normal
import preview. `Cross-Origin-Opener-Policy: same-origin-allow-popups` keeps `window.opener` available.

The allow-list is `https://sadidft.github.io` plus `VITE_LEGACY_ORIGIN` (comma separated) for tests.

## Alternatives considered

- Redirect with the data in the URL fragment: limited by URL length (data can be megabytes) and leaks into
  history and logs. Rejected.
- Manual export and import only: kept as the fallback, but most users never exported. Not enough on its own.
- A shared server: contradicts "no server" for local storage. Rejected.

## Consequences

- The old site needs one small release that adds the "Move to the new Boxy" button and the responder script.
- The e2e suite runs a stand-in of the old site on `127.0.0.1:8099` and a rogue origin on `8098` to prove that
  only allow-listed origins are accepted.

# 0001: One Yjs document per Box, Dexie as projection

Status: Accepted (2026-09)

## Context

Boxy stores everything on the device. Later phases add Nearby (same-network collaboration over WebRTC) and cloud
storage. Both need conflict-free merging of concurrent edits. The previous Boxy kept one JSON blob in localStorage,
which has no merge story and lost data when the tab closed during the 500 ms save debounce.

## Decision

- Each Box is a `Y.Doc` (maps `box`, `tabs`, `cards`) persisted with `y-indexeddb` under `boxy-ydoc-<boxId>`.
- Dexie (`boxy` database) holds projections that are cheap to query: `boxes` (metadata and counts) and `cards_index`
  (title, preview, tags, flags, stats). Plus tables that are not part of a Box: `trash`, `revisions`, `globals`,
  `counters`, `settings`, `migrations`, `handoff`.
- Projections are rebuilt incrementally from Yjs observers, debounced 50 ms per Box, and flushed on `pagehide`
  and before every export.
- Undo is `Y.UndoManager` per Box, tracking only local origin, so it covers edits, moves and reorders.

## Alternatives considered

- Dexie only, with a hand-written sync protocol later: simpler now, but merging concurrent edits of a Card body
  would need its own CRDT or last-writer-wins, which loses text. Rejected.
- One Yjs document for everything: simpler API, but the document grows with every Card ever created and every
  open of Boxy would load all Boxes. Rejected for memory and for per-Box sharing in Nearby.

## Consequences

- Reads for lists and search go through Dexie and `dexie-react-hooks`; reads of a full Card go through the Y.Doc.
- Tests must flush projections (`flushProjections`) after writes before asserting on Dexie.
- Yjs plus y-indexeddb add about 60 KB gzip to the `data` chunk. Accepted.

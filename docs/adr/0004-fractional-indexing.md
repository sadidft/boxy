# 0004: Fractional indexing for order

Status: Accepted (2026-09)

## Context

Cards, Tabs and Boxes have a manual order. Concurrent edits (Nearby, later cloud) must not fight over
positions, and reordering one item must not rewrite every sibling.

## Decision

Orders are strings produced by `fractional-indexing` (`keyBetween`, `keyAfterAll`, `keysBetween`). Moving an item
writes one key. Sorting is a plain string comparison.

## Alternatives considered

- Integer positions with periodic reindexing: every move can touch many rows and two concurrent moves in Yjs
  produce duplicate positions until a reindex runs. Rejected.

## Consequences

- Keys grow slowly when the same gap is used repeatedly; a rebalance can be added later without a schema change.
- Legacy import assigns keys in the original order.

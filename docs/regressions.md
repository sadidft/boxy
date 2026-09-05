# Regressions of the previous Boxy and the tests that close them

Bug ids follow the masterplan (`docs/MASTERPLAN.md` §1.3 when published; the analysis lives in the planning
documents). Every row links to the test that fails if the bug comes back. Rows marked "open" are tracked for a
later phase; the feature that had the bug is not shipped yet or the check is manual.

| Id | Bug in the previous Boxy | Fix in Boxy | Test |
|---|---|---|---|
| B1 | `{{date}}` used UTC; between 00:00 and 06:59 WIB the date was one day behind | Template engine formats in the local time zone (`Intl` with `timeZone`) | `src/test/regressions.test.ts` (B1), `src/core/template/template.test.ts` "renders dates in the local time zone" |
| B2 | Markdown image became `!<a href>` because the link regex ran first | markdown-it renderer | `src/test/regressions.test.ts` (B2) |
| B3 | Ordered lists rendered as `<ul>`, no nesting | markdown-it renderer | `src/test/regressions.test.ts` (B3), `src/core/markdown/markdown.test.ts` |
| B4 | `javascript:` check was case sensitive; `data:` and `vbscript:` passed | DOMPurify with a strict allow-list and a URL scheme filter | `src/test/regressions.test.ts` (B4), `src/core/markdown/markdown.test.ts` "neutralises XSS" |
| B5 | Manifest shortcut `?action=new-card` was never handled | `App.tsx` reads `action` on start, opens the new Card editor or the palette, then removes the parameter | `e2e/core.spec.ts` "PWA shortcuts ?action=search and ?action=new-card are handled (B5)" |
| B6 | Manifest referenced PNG icons that did not exist | Icons are generated from the logo by `scripts/brand/gen-icons.mjs` and precached | `npm run build` fails when an icon listed in the manifest is missing (`includeAssets` glob) |
| B7 | Two manifests linked with different `start_url` | One generated `manifest.webmanifest` with `id: '/'` | Build output inspection; `vite-plugin-pwa` is the only manifest source |
| B8 | Theme toggled `dark` in one place and `light` in another | One `data-theme` attribute on `<html>` set by `settings-store`, applied before paint by the inline script in `index.html` | `e2e/core.spec.ts` toggles the theme through Settings (screenshot walkthrough 12 to 15); unit coverage for `resolvedTheme` is in `src/app` tests planned for F1 |
| B9 | HTML5 drag and drop did not work on touch | Card and Tab reordering is done through menus and keyboard in this phase; pointer-based reordering (dnd-kit) arrives with F1 | open (feature not shipped yet) |
| B10 | Service worker update used `window.confirm()` | `registerType: 'prompt'` with an in-app update banner that flushes pending writes before reloading | manual: build twice and reload; e2e case planned with a mocked SW update |
| B11 | Modals had no focus trap; arrow navigation was one dimensional | Radix dialogs (focus trap and escape stacking); roving 2D navigation in `CardGrid` | `e2e/core.spec.ts` "keyboard" (Escape closes dialogs in order), grid navigation with arrows in the walkthrough |
| A3 | Save was debounced 500 ms without a flush on unload; closing the tab lost the last edit | Writes go to Yjs synchronously and are persisted by y-indexeddb; projections flush on `pagehide` | `src/data/repo.test.ts` (writes visible right after `flushProjections`); persistence across reload covered by the e2e walkthrough |
| A7 | Undo had 7 steps and ignored reorder and copy counts | `Y.UndoManager` per Box with local origin; reorders and moves are undoable; copy stats do not swallow an undo | `src/test/regressions.test.ts` (A7), `src/data/repo.test.ts` "supports undo and redo" |
| A8 | Search only in the active Tab, substring, markdown stripped on every keystroke | MiniSearch index over `cards_index` across all Boxes, palette and `/search` | `e2e/core.spec.ts` palette search; `src/core/search` unit tests planned with the worker in F1 |
| A9 | Masonry toggle produced the same classes in both branches | Real masonry with column balancing in `CardGrid` | `e2e/core.spec.ts` switches to Masonry (screenshot 25) |

## How to add a row

1. Reproduce the bug against the previous code (`git show legacy-1.0.23:<path>`).
2. Write the failing test first, in the closest suite (`src/core/**`, `src/data/**`, `src/test/regressions.test.ts`, `e2e/**`).
3. Add the row here with the test path.

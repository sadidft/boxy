# legacy-site

Static files published to GitHub Pages at `https://sadidft.github.io/boxy/`, the address of the previous Boxy.

- `index.html`: tells users that Boxy moved, shows the data still in this origin's localStorage, offers
  "Move to the new Boxy" (handoff protocol, ADR 0005) and a backup download.
- `sw.js`: replaces the previous service worker with one that clears caches and unregisters itself, so the cached
  old app cannot come back.
- `404.html`: sends any old deep link to `/boxy/`.

Published by `.github/workflows/legacy-pages.yml` when files in this directory change on `main`.

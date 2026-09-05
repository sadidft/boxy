# Glossary (guardrail G5)

One term per concept, in every language. UI in Indonesian keeps the product terms in English.

| Term | Meaning |
|---|---|
| Box | Top level container. Shown in the rail. |
| Tab | A section inside a Box. Shown in the tab strip. |
| Card | One item inside a Tab. Has a type: text, table, and later code, checklist, link, fields, vault, color, prompt, image. |
| Quick Bar | The strip of up to 9 cards copied with Alt+1..9. |
| Boxy Float | The small always-on-top window (Document Picture-in-Picture). |
| Boxy Cloud | Storage mode with a Boxy account, end-to-end encrypted, 15 MB per account. |
| Self Cloud | Storage mode with the user's own database reached through a Boxy Bridge. |
| Boxy Bridge | The small function the user deploys to their own Vercel account to reach their database. |
| Boxy Nearby | Team mode on the same network (WebRTC + CRDT). |
| Team Code | The code used to join a Nearby team. |
| Recovery Key | The key that restores a Boxy Cloud account without email. |
| Workspace Key | The key that encrypts Self Cloud data. Never leaves the user's devices. |
| Migration Wizard | The five step flow that moves data between storage modes. |
| Storage mode | Local, Boxy Cloud or Self Cloud. One at a time. |
| Trash | Deleted items kept for 30 days. |
| Version history | Saved revisions of a card's content. Different from Undo, which is per session. |
| the previous Boxy | The app before the rebuild (code 1.0.23). Never "v1". |

## Forbidden

- `folder` -> Box or Tab
- `note` -> Card
- `notes` -> Cards
- `workspace` -> Box
- `snippet manager` -> Boxy
- `sync key` -> Workspace Key
- `password reset email` -> Recovery Key

# 0002: Radix Primitives for dialogs, menus, switches and tooltips

Status: Accepted (2026-09)

## Context

The previous Boxy had modals without focus trap, menus without keyboard support and a theme toggle that
depended on two different class names. Accessible primitives are the cheapest way to close those bugs
(B8, B11 in the masterplan) and keep them closed.

## Decision

Use `@radix-ui/react-dialog`, `react-dropdown-menu`, `react-switch` and `react-tooltip`. Boxy wraps them once
in `src/components/ui/primitives.tsx` so the rest of the app never imports Radix directly.

## Alternatives considered

- React Aria Components: excellent accessibility, but the bundle for the same four primitives was larger in our
  measurement and the styling model fights Tailwind utilities. Not chosen.
- Own components: focus traps, roving tabindex, `inert` handling and escape stacking are easy to get subtly wrong.
  Rejected.

## Consequences

- Focus trap and escape handling in every dialog and drawer come for free.
- Menus support submenus (Quick Bar slots, labels) with arrow keys.
- Radix adds about 30 KB gzip. Accepted.

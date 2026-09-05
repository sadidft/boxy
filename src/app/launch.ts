/**
 * Reads the `action` query parameter (PWA shortcuts `/?action=new-card`, `/?action=search`) once at start,
 * before the router redirects `/` to the last Box and drops the query string.
 */
let pending: string | null = null;

if (typeof window !== 'undefined') {
  const url = new URL(window.location.href);
  pending = url.searchParams.get('action');
  if (pending) {
    url.searchParams.delete('action');
    window.history.replaceState(null, '', url.toString());
  }
}

export function consumeLaunchAction(): string | null {
  const action = pending;
  pending = null;
  return action;
}

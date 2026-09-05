import { monotonicFactory, ulid } from 'ulidx';

const monotonic = monotonicFactory();

export function newId(at: number = Date.now()): string {
  return monotonic(at);
}

/**
 * Deterministic id for imported legacy entities so re-importing the same file never duplicates data.
 * Time part comes from the legacy createdAt; random part from an HMAC-like digest of the legacy id.
 * Uses SubtleCrypto when available and a small FNV based fallback in non-secure contexts (tests, older runtimes).
 */
export async function legacyId(legacy: string, createdAt: number): Promise<string> {
  const digest = await digestHex(`boxy-legacy-migration:${legacy}`);
  // ulid is Crockford base32: 10 chars time + 16 chars randomness.
  const time = ulid(Number.isFinite(createdAt) && createdAt > 0 ? createdAt : 0).slice(0, 10);
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let rand = '';
  for (let i = 0; i < 16; i += 1) {
    const byte = parseInt(digest.slice(i * 2, i * 2 + 2), 16);
    rand += alphabet[byte % 32];
  }
  return time + rand;
}

async function digestHex(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // FNV-1a 32 bit repeated to 64 hex chars; only used where SubtleCrypto is unavailable.
  let out = '';
  for (let round = 0; round < 8; round += 1) {
    let h = 0x811c9dc5 ^ round;
    for (let i = 0; i < input.length; i += 1) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    out += h.toString(16).padStart(8, '0');
  }
  return out;
}

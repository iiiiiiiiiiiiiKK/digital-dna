/**
 * Deterministic hashing helpers.
 *
 * Everything the product calls "generated" must be reproducible from the
 * user's answers alone: same answers → same DNA code, same colours, same
 * helix geometry. No Math.random, no Date.now inside derived values.
 */

/** FNV-1a 64-bit implemented on two 32-bit halves (no BigInt needed, stable). */
export function fnv1a64(input: string): { hi: number; lo: number } {
  let h1 = 0x811c9dc5; // offset basis split for 64-bit
  let h2 = 0xcbf29ce4;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 ^= c & 0xff;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= (c >>> 8) & 0xff;
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
    h2 = (h2 ^ (h1 >>> 13)) >>> 0;
  }
  return { hi: h2 >>> 0, lo: h1 >>> 0 };
}

/** 32-bit FNV-1a — used as the numeric seed for geometry jitter. */
export function fnv1a32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i) & 0xff;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function toHex32(value: number): string {
  return (value >>> 0).toString(16).padStart(8, '0');
}

/** 16-char canonical fingerprint of an answer payload. */
export function fingerprint(payload: unknown): string {
  const json = stableStringify(payload);
  const { hi, lo } = fnv1a64(json);
  return (toHex32(hi) + toHex32(lo)).toUpperCase();
}

/**
 * JSON.stringify with sorted keys so structurally identical answers always
 * hash identically regardless of object insertion order.
 */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

/** Deterministic pseudo-random generator (mulberry32) seeded by an integer. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * DNA identity number: 6 hex chars of the answer fingerprint.
 *
 * Derived from the *answers only* — never from time, storage id or a random
 * salt — so the same answers always produce the same number, and anyone can
 * recompute it. 24 bits is plenty for a single-person local profile; the
 * full 16-character fingerprint is stored alongside for exact collation.
 */
export function buildDnaCode(hash: string): string {
  return `DNA-${hash.slice(0, 6)}`;
}

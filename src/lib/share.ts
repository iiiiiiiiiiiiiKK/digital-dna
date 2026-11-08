/**
 * Public share links.
 *
 * Architecture note: this build is deliberately server-less (Local-first, as
 * specified). A public share therefore works by encoding a **minimised,
 * explicitly public** snapshot of the profile into the URL fragment:
 *
 *   #/dna/<payload>
 *
 * Consequences, stated honestly in the UI:
 *  - a private profile never produces a payload, so there is nothing to leak;
 *  - whoever holds the link can read the payload (that is what "public" means);
 *  - fragments are not sent to the server, so the payload never reaches a log;
 *  - the link is long, because the data lives inside it.
 *
 * The payload intentionally drops everything that is not needed to render the
 * DNA: no local profile id, no salt, no dates, no avatar.
 */

import type { DnaResult, Profile } from './types';
import { answerPayload } from './profile';
import { fingerprint } from './hash';
import { generateDna } from './engine';

export interface SharePayloadV1 {
  v: 1;
  n: string; // nickname
  b: string; // bio
  r: string; // role
  f: string; // field
  i: [string, string, number][]; // interest id, label, intensity
  s: [string, string, string][]; // skill id, label, level
  c: [string[], string, string, string, string]; // creative
  h: [string[], string[], string[], string[], string[]]; // habits
  v2: string; // visual style
  t: string; // generatedAt
}

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeSharePayload(profile: Profile, result: DnaResult): string {
  const payload: SharePayloadV1 = {
    v: 1,
    n: profile.nickname,
    b: profile.bio,
    r: profile.role,
    f: profile.field,
    i: profile.interests.map((i) => [i.id, i.label, i.intensity]),
    s: profile.skills.map((s) => [s.id, s.label, s.level]),
    c: [
      profile.creative.outputs,
      profile.creative.workStyle,
      profile.creative.exploration,
      profile.creative.thinking,
      profile.creative.pace,
    ],
    h: [
      profile.habits.platforms,
      profile.habits.tools,
      profile.habits.contentTypes,
      profile.habits.products,
      profile.habits.activities,
    ],
    v2: profile.visualStyle,
    t: result.generatedAt,
  };
  return toBase64Url(JSON.stringify(payload));
}

export interface DecodedShare {
  profile: Profile;
  result: DnaResult;
}

/**
 * Rebuild a *view-only* profile from a share payload. The rebuilt profile has a
 * fresh local id and salt — it is a rendering artifact, never merged into the
 * viewer's own database.
 */
export function decodeSharePayload(token: string): DecodedShare | null {
  try {
    const json = fromBase64Url(token);
    const raw = JSON.parse(json) as Partial<SharePayloadV1>;
    if (raw.v !== 1 || typeof raw.n !== 'string') return null;

    const creative = Array.isArray(raw.c) ? raw.c : [[], 'hybrid', 'balanced', 'logic', 'mixed'];
    const habits = Array.isArray(raw.h) ? raw.h : [[], [], [], [], []];

    const profile: Profile = {
      id: 'shared',
      salt: 'shared-view',
      nickname: raw.n.slice(0, 40),
      bio: typeof raw.b === 'string' ? raw.b.slice(0, 280) : '',
      role: typeof raw.r === 'string' ? raw.r.slice(0, 60) : '',
      field: typeof raw.f === 'string' ? raw.f.slice(0, 60) : '',
      avatar: null,
      interests: (Array.isArray(raw.i) ? raw.i : [])
        .filter((x): x is [string, string, number] => Array.isArray(x) && x.length === 3)
        .map(([id, label, intensity]) => ({
          id: String(id),
          label: String(label).slice(0, 40),
          intensity: (Math.min(5, Math.max(1, Number(intensity) || 3)) as 1 | 2 | 3 | 4 | 5),
        })),
      skills: (Array.isArray(raw.s) ? raw.s : [])
        .filter((x): x is [string, string, string] => Array.isArray(x) && x.length === 3)
        .map(([id, label, level]) => ({
          id: String(id),
          label: String(label).slice(0, 40),
          level: (['beginner', 'intermediate', 'advanced', 'expert'].includes(String(level)) ? level : 'intermediate') as Profile['skills'][number]['level'],
        })),
      creative: {
        outputs: (creative[0] as string[] | undefined)?.filter((o): o is Profile['creative']['outputs'][number] =>
          ['products', 'stories', 'visuals', 'systems', 'knowledge', 'experiments'].includes(o)
        ) ?? [],
        workStyle: (['solo', 'team', 'hybrid'].includes(String(creative[1])) ? creative[1] : 'hybrid') as Profile['creative']['workStyle'],
        exploration: (['explore', 'deepen', 'balanced'].includes(String(creative[2])) ? creative[2] : 'balanced') as Profile['creative']['exploration'],
        thinking: (['visual', 'text', 'logic', 'hands-on'].includes(String(creative[3])) ? creative[3] : 'logic') as Profile['creative']['thinking'],
        pace: (['sprint', 'marathon', 'mixed'].includes(String(creative[4])) ? creative[4] : 'mixed') as Profile['creative']['pace'],
      },
      habits: {
        platforms: (habits[0] as string[]) ?? [],
        tools: (habits[1] as string[]) ?? [],
        contentTypes: (habits[2] as string[]) ?? [],
        products: (habits[3] as string[]) ?? [],
        activities: (habits[4] as string[]) ?? [],
      },
      visualStyle: (typeof raw.v2 === 'string' ? raw.v2 : 'futuristic') as Profile['visualStyle'],
      visibility: 'public',
      createdAt: typeof raw.t === 'string' ? raw.t : new Date().toISOString(),
      updatedAt: typeof raw.t === 'string' ? raw.t : new Date().toISOString(),
    };

    // The DNA number must be recomputed identically from the shared answers.
    const result = generateDna(profile, 1, profile.createdAt);
    result.hash = fingerprint(answerPayload(profile));
    return { profile, result };
  } catch {
    return null;
  }
}

export function buildShareUrl(profile: Profile, result: DnaResult): string {
  const token = encodeSharePayload(profile, result);
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/dna/${token}`;
}

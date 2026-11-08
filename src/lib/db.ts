/**
 * Local-first persistence.
 *
 * Everything lives in IndexedDB via Dexie. There is no server: the app never
 * uploads profiles. Public sharing works through a *local* share link whose
 * payload is embedded in the URL fragment (#/dna/...), so a private profile
 * simply never produces a payload and cannot be read from a URL.
 */

import Dexie, { type Table } from 'dexie';
import type { AiInsight, AppSettings, DnaVersion, Profile } from './types';
import { createEmptyProfile, isSkillLevel, isVisualStyle } from './profile';

export interface StoredProfile extends Profile {}

export interface DraftRow {
  id: 'draft';
  profile: Profile;
  step: number;
  savedAt: string;
}

export class DigitalDnaDb extends Dexie {
  profiles!: Table<StoredProfile, string>;
  versions!: Table<DnaVersion, string>;
  insights!: Table<AiInsight & { id: string; profileId: string }, string>;
  settings!: Table<AppSettings, string>;
  drafts!: Table<DraftRow, string>;

  constructor(name = 'digital-dna') {
    super(name);
    this.version(1).stores({
      profiles: 'id, updatedAt, visibility',
      versions: 'id, profileId, version, dnaCode, generatedAt',
      insights: 'id, profileId',
      settings: 'id',
      drafts: 'id',
    });
  }
}

export const db = new DigitalDnaDb();

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app',
  ai: { enabled: false, baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', apiKey: '' },
};

export async function ensureSettings(): Promise<AppSettings> {
  const existing = await db.settings.get('app');
  if (existing) return { ...DEFAULT_SETTINGS, ...existing, ai: { ...DEFAULT_SETTINGS.ai, ...existing.ai } };
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function saveSettings(next: AppSettings): Promise<void> {
  await db.settings.put(next);
}

export async function listProfiles(): Promise<StoredProfile[]> {
  const all = await db.profiles.toArray();
  return all.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function getOrCreatePrimaryProfile(): Promise<StoredProfile> {
  const all = await listProfiles();
  if (all.length > 0) return all[0];
  const profile = createEmptyProfile();
  await db.profiles.put(profile);
  return profile;
}

export async function putProfile(profile: Profile): Promise<void> {
  const next = { ...profile, updatedAt: new Date().toISOString() };
  await db.profiles.put(next);
}

export async function deleteProfileCascade(profileId: string): Promise<void> {
  await db.transaction('rw', [db.profiles, db.versions, db.insights, db.drafts], async () => {
    await db.profiles.delete(profileId);
    await db.versions.where('profileId').equals(profileId).delete();
    await db.insights.where('profileId').equals(profileId).delete();
    await db.drafts.delete('draft');
  });
}

export async function listVersions(profileId: string): Promise<DnaVersion[]> {
  const rows = await db.versions.where('profileId').equals(profileId).toArray();
  return rows.sort((a, b) => a.version - b.version);
}

export async function latestVersion(profileId: string): Promise<DnaVersion | undefined> {
  const rows = await listVersions(profileId);
  return rows[rows.length - 1];
}

export async function saveVersion(version: DnaVersion): Promise<void> {
  await db.versions.put(version);
}

export async function saveDraft(profile: Profile, step: number): Promise<void> {
  await db.drafts.put({ id: 'draft', profile, step, savedAt: new Date().toISOString() });
}

export async function readDraft(): Promise<DraftRow | undefined> {
  return db.drafts.get('draft');
}

export async function clearDraft(): Promise<void> {
  await db.drafts.delete('draft');
}

export async function saveInsight(insight: AiInsight & { id: string; profileId: string }): Promise<void> {
  await db.insights.put(insight);
}

export async function getInsight(profileId: string): Promise<(AiInsight & { id: string; profileId: string }) | undefined> {
  const rows = await db.insights.where('profileId').equals(profileId).toArray();
  return rows[rows.length - 1];
}

export async function deleteInsight(profileId: string): Promise<void> {
  await db.insights.where('profileId').equals(profileId).delete();
}

/* ------------------------------------------------------------------ *
 * Full JSON export / import
 * ------------------------------------------------------------------ */

export interface ExportBundle {
  app: 'digital-dna';
  schema: 1;
  exportedAt: string;
  profiles: Profile[];
  versions: DnaVersion[];
}

export async function exportBundle(): Promise<ExportBundle> {
  const [profiles, versions] = await Promise.all([db.profiles.toArray(), db.versions.toArray()]);
  return {
    app: 'digital-dna',
    schema: 1,
    exportedAt: new Date().toISOString(),
    profiles: profiles as Profile[],
    versions,
  };
}

export interface ImportResult {
  profiles: number;
  versions: number;
  skipped: number;
}

/**
 * Import is validated field by field. Anything unrecognised is dropped rather
 * than trusted, because the file may come from anywhere.
 */
export async function importBundle(raw: unknown): Promise<ImportResult> {
  if (!raw || typeof raw !== 'object') throw new Error('File is not a Digital DNA backup.');
  const bundle = raw as Partial<ExportBundle>;
  if (bundle.app !== 'digital-dna') throw new Error('This file is not a Digital DNA backup.');
  if (!Array.isArray(bundle.profiles)) throw new Error('Backup has no profiles array.');

  const profiles: Profile[] = [];
  let skipped = 0;
  for (const candidate of bundle.profiles) {
    const profile = sanitizeImportedProfile(candidate);
    if (profile) profiles.push(profile);
    else skipped++;
  }
  if (profiles.length === 0) throw new Error('Backup contained no valid profiles.');

  const profileIds = new Set(profiles.map((p) => p.id));
  const versions: DnaVersion[] = [];
  if (Array.isArray(bundle.versions)) {
    for (const v of bundle.versions) {
      const version = v as Partial<DnaVersion>;
      if (!version || typeof version !== 'object') continue;
      if (typeof version.profileId !== 'string' || !profileIds.has(version.profileId)) continue;
      if (typeof version.dnaCode !== 'string' || typeof version.version !== 'number') continue;
      versions.push(version as DnaVersion);
    }
  }

  await db.transaction('rw', [db.profiles, db.versions], async () => {
    for (const p of profiles) await db.profiles.put(p);
    for (const v of versions) await db.versions.put(v);
  });

  return { profiles: profiles.length, versions: versions.length, skipped };
}

function sanitizeImportedProfile(raw: unknown): Profile | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id) return null;
  if (typeof r.nickname !== 'string') return null;

  const base = createEmptyProfile();
  const creative = (r.creative ?? {}) as Record<string, unknown>;
  const habits = (r.habits ?? {}) as Record<string, unknown>;
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 40) : []);

  return {
    ...base,
    id: r.id.slice(0, 120),
    salt: typeof r.salt === 'string' && r.salt ? r.salt.slice(0, 60) : base.salt,
    nickname: String(r.nickname).slice(0, 40),
    bio: typeof r.bio === 'string' ? r.bio.slice(0, 280) : '',
    role: typeof r.role === 'string' ? r.role.slice(0, 60) : '',
    field: typeof r.field === 'string' ? r.field.slice(0, 60) : '',
    avatar: typeof r.avatar === 'string' && r.avatar.startsWith('data:image/') ? r.avatar : null,
    interests: Array.isArray(r.interests)
      ? r.interests
          .filter((i): i is Record<string, unknown> => !!i && typeof i === 'object')
          .filter((i) => typeof i.id === 'string' && typeof i.label === 'string')
          .slice(0, 30)
          .map((i) => ({
            id: String(i.id).slice(0, 60),
            label: String(i.label).slice(0, 40),
            intensity: (Math.min(5, Math.max(1, Number(i.intensity) || 3)) as 1 | 2 | 3 | 4 | 5),
            custom: Boolean(i.custom),
          }))
      : [],
    skills: Array.isArray(r.skills)
      ? r.skills
          .filter((i): i is Record<string, unknown> => !!i && typeof i === 'object')
          .filter((i) => typeof i.id === 'string' && typeof i.label === 'string')
          .slice(0, 30)
          .map((i) => ({
            id: String(i.id).slice(0, 60),
            label: String(i.label).slice(0, 40),
            level: (isSkillLevel(i.level) ? i.level : 'intermediate') as Profile['skills'][number]['level'],
            custom: Boolean(i.custom),
          }))
      : [],
    creative: {
      outputs: Array.isArray(creative.outputs)
        ? (creative.outputs.filter((o) =>
            ['products', 'stories', 'visuals', 'systems', 'knowledge', 'experiments'].includes(String(o))
          ) as Profile['creative']['outputs'])
        : [],
      workStyle: (['solo', 'team', 'hybrid'].includes(String(creative.workStyle)) ? creative.workStyle : 'hybrid') as Profile['creative']['workStyle'],
      exploration: (['explore', 'deepen', 'balanced'].includes(String(creative.exploration)) ? creative.exploration : 'balanced') as Profile['creative']['exploration'],
      thinking: (['visual', 'text', 'logic', 'hands-on'].includes(String(creative.thinking)) ? creative.thinking : 'logic') as Profile['creative']['thinking'],
      pace: (['sprint', 'marathon', 'mixed'].includes(String(creative.pace)) ? creative.pace : 'mixed') as Profile['creative']['pace'],
    },
    habits: {
      platforms: arr(habits.platforms),
      tools: arr(habits.tools),
      contentTypes: arr(habits.contentTypes),
      products: arr(habits.products),
      activities: arr(habits.activities),
    },
    visualStyle: isVisualStyle(r.visualStyle) ? r.visualStyle : base.visualStyle,
    visibility: r.visibility === 'public' ? 'public' : 'private',
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : base.createdAt,
    updatedAt: new Date().toISOString(),
  };
}

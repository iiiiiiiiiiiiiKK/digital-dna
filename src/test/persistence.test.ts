import { beforeEach, describe, expect, it } from 'vitest';
import { db, exportBundle, importBundle } from '../lib/db';
import { createEmptyProfile } from '../lib/profile';
import { generateDna } from '../lib/engine';
import type { DnaVersion, Profile } from '../lib/types';

/**
 * Persistence tests run against the real Dexie singleton on top of
 * fake-indexeddb (installed in src/test/setup.ts), so they exercise exactly the
 * code path the app uses — not a parallel test database.
 */
beforeEach(async () => {
  await db.versions.clear();
  await db.insights.clear();
  await db.drafts.clear();
  await db.profiles.clear();
});

function profileWith(overrides: Partial<Profile> = {}): Profile {
  return {
    ...createEmptyProfile(),
    nickname: 'Persist Test',
    interests: [{ id: 'ai', label: 'AI', intensity: 4 }],
    skills: [{ id: 'writing', label: 'Writing', level: 'advanced' }],
    creative: { outputs: ['stories'], workStyle: 'solo', exploration: 'explore', thinking: 'text', pace: 'mixed' },
    ...overrides,
  };
}

function versionFor(profile: Profile, version: number): DnaVersion {
  const result = generateDna(profile, version, '2026-04-04T00:00:00.000Z');
  return {
    id: `${profile.id}:v${version}`,
    profileId: profile.id,
    version,
    dnaCode: result.dnaCode,
    generatedAt: result.generatedAt,
    profile,
    result,
  };
}

describe('profile persistence', () => {
  it('stores and reads a profile', async () => {
    const profile = profileWith();
    await db.profiles.put(profile);
    const read = await db.profiles.get(profile.id);
    expect(read?.nickname).toBe('Persist Test');
  });

  it('keeps every generated version', async () => {
    const profile = profileWith();
    await db.profiles.put(profile);
    for (const v of [1, 2, 3]) await db.versions.put(versionFor(profile, v));

    const rows = await db.versions.where('profileId').equals(profile.id).toArray();
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.version).sort()).toEqual([1, 2, 3]);
  });

  it('survives a reload (fresh read after write)', async () => {
    const profile = profileWith({ nickname: 'Reload Test' });
    await db.profiles.put(profile);
    // Simulate a page reload: read straight from the store again.
    const rows = await db.profiles.toArray();
    expect(rows.find((p) => p.id === profile.id)?.nickname).toBe('Reload Test');
  });

  it('cascades a delete across versions', async () => {
    const profile = profileWith();
    await db.profiles.put(profile);
    await db.versions.put(versionFor(profile, 1));
    await db.versions.where('profileId').equals(profile.id).delete();
    expect(await db.versions.count()).toBe(0);
  });
});

describe('JSON export / import', () => {
  it('round-trips profiles and versions', async () => {
    const profile = profileWith();
    await db.profiles.put(profile);
    await db.versions.put(versionFor(profile, 1));

    const bundle = await exportBundle();
    expect(bundle.app).toBe('digital-dna');
    expect(bundle.profiles).toHaveLength(1);
    expect(bundle.versions).toHaveLength(1);

    await db.profiles.clear();
    await db.versions.clear();
    expect(await db.profiles.count()).toBe(0);

    const imported = await importBundle(JSON.parse(JSON.stringify(bundle)));
    expect(imported.profiles).toBe(1);
    expect(imported.versions).toBe(1);
    expect((await db.profiles.get(profile.id))?.nickname).toBe('Persist Test');
    expect(await db.versions.count()).toBe(1);
  });

  it('rejects files that are not Digital DNA backups', async () => {
    await expect(importBundle({ hello: 'world' })).rejects.toThrow(/not a Digital DNA backup/i);
    await expect(importBundle(null)).rejects.toThrow();
    await expect(importBundle('string')).rejects.toThrow();
    await expect(importBundle({ app: 'digital-dna' })).rejects.toThrow(/profiles array/i);
  });

  it('sanitises malicious or malformed fields instead of trusting them', async () => {
    const imported = await importBundle({
      app: 'digital-dna',
      schema: 1,
      exportedAt: new Date().toISOString(),
      profiles: [
        {
          id: 'evil',
          nickname: 'x'.repeat(200),
          interests: [
            { id: 'ai', label: 'AI', intensity: 99 },
            { id: 'broken' }, // missing label → dropped
          ],
          skills: [{ id: 'writing', label: 'Writing', level: 'godlike' }],
          creative: { outputs: ['products', 'nonsense'], workStyle: 'telepathy' },
          habits: {},
          visualStyle: 'not-a-style',
          visibility: 'public',
          avatar: 'javascript:alert(1)',
        },
      ],
      versions: [{ profileId: 'unknown', dnaCode: 'DNA-000000', version: 1 }],
    });

    expect(imported.profiles).toBe(1);
    // The version references a profile that was not imported, so it is dropped.
    expect(imported.versions).toBe(0);

    const stored = await db.profiles.get('evil');
    expect(stored).toBeDefined();
    expect(stored!.nickname.length).toBeLessThanOrEqual(40);
    expect(stored!.interests).toHaveLength(1);
    expect(stored!.interests[0].intensity).toBe(5);
    expect(stored!.skills[0].level).toBe('intermediate');
    expect(stored!.creative.outputs).toEqual(['products']);
    expect(stored!.creative.workStyle).toBe('hybrid');
    expect(stored!.visualStyle).not.toBe('not-a-style');
    expect(stored!.avatar).toBeNull();
  });

  it('skips invalid profiles but keeps valid ones', async () => {
    const result = await importBundle({
      app: 'digital-dna',
      schema: 1,
      exportedAt: new Date().toISOString(),
      profiles: [{ nickname: 'no id here' }, { id: 'ok', nickname: 'Valid' }],
      versions: [],
    });
    expect(result.profiles).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it('refuses a backup with no usable profile', async () => {
    await expect(
      importBundle({ app: 'digital-dna', schema: 1, exportedAt: '', profiles: [{ nickname: 'nobody' }], versions: [] })
    ).rejects.toThrow(/no valid profiles/i);
  });
});

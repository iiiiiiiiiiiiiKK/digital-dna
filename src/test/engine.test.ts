import { describe, expect, it } from 'vitest';
import { generateDna } from '../lib/engine';
import { createEmptyProfile, validateProfile, answerPayload } from '../lib/profile';
import { fingerprint } from '../lib/hash';
import type { Profile } from '../lib/types';

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  const base = createEmptyProfile();
  return {
    ...base,
    nickname: 'Test User',
    interests: [
      { id: 'ai', label: 'AI', intensity: 5 },
      { id: 'design', label: 'Design', intensity: 3 },
    ],
    skills: [
      { id: 'programming', label: 'Programming', level: 'advanced' },
      { id: 'writing', label: 'Writing', level: 'intermediate' },
    ],
    creative: {
      outputs: ['systems', 'visuals'],
      workStyle: 'solo',
      exploration: 'explore',
      thinking: 'logic',
      pace: 'sprint',
    },
    habits: {
      platforms: ['github', 'x'],
      tools: ['vscode', 'figma'],
      contentTypes: ['code-repos'],
      products: ['laptop'],
      activities: ['coding'],
    },
    ...overrides,
  };
}

describe('profile validation', () => {
  it('requires a nickname, one interest and one skill', () => {
    const empty = createEmptyProfile();
    const problems = validateProfile(empty);
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.join(' ')).toMatch(/Nickname/);
    expect(problems.join(' ')).toMatch(/interest/);
    expect(problems.join(' ')).toMatch(/skill/);
  });

  it('accepts a minimally complete profile', () => {
    expect(validateProfile(makeProfile())).toEqual([]);
  });

  it('rejects overlong free text', () => {
    const profile = makeProfile({ nickname: 'x'.repeat(41) });
    expect(validateProfile(profile).join(' ')).toMatch(/40 characters/);
  });
});

describe('DNA generation determinism', () => {
  it('returns identical output for identical answers', () => {
    const a = generateDna(makeProfile(), 1, '2026-01-01T00:00:00.000Z');
    const b = generateDna(makeProfile(), 1, '2026-01-01T00:00:00.000Z');

    expect(a.hash).toBe(b.hash);
    expect(a.seed).toBe(b.seed);
    expect(a.dnaCode).toBe(b.dnaCode);
    expect(a.palette).toEqual(b.palette);
    expect(a.helix).toEqual(b.helix);
    expect(a.interestGenes).toEqual(b.interestGenes);
    expect(a.dimensions).toEqual(b.dimensions);
    expect(a.tags).toEqual(b.tags);
  });

  it('ignores object key order and array order when hashing', () => {
    const p1 = makeProfile();
    const p2 = makeProfile({
      interests: [
        { id: 'design', label: 'Design', intensity: 3 },
        { id: 'ai', label: 'AI', intensity: 5 },
      ],
    });
    expect(fingerprint(answerPayload(p1))).toBe(fingerprint(answerPayload(p2)));
    expect(generateDna(p1).dnaCode).toBe(generateDna(p2).dnaCode);
  });

  it('produces different output for different answers', () => {
    const a = generateDna(makeProfile());
    const b = generateDna(makeProfile({ interests: [{ id: 'crypto', label: 'Crypto', intensity: 2 }] }));
    expect(a.dnaCode).not.toBe(b.dnaCode);
    expect(a.hash).not.toBe(b.hash);
    expect(a.helix.rungs).not.toBe(b.helix.rungs);
  });

  it('changes when an interest intensity changes', () => {
    const a = generateDna(makeProfile());
    const b = generateDna(
      makeProfile({
        interests: [
          { id: 'ai', label: 'AI', intensity: 2 },
          { id: 'design', label: 'Design', intensity: 3 },
        ],
      })
    );
    expect(a.dnaCode).not.toBe(b.dnaCode);
    expect(a.interestGenes[0].percent).not.toBe(b.interestGenes[0].percent);
  });

  it('maps intensity monotonically to interest percent', () => {
    const low = generateDna(makeProfile({ interests: [{ id: 'ai', label: 'AI', intensity: 1 }] }));
    const high = generateDna(makeProfile({ interests: [{ id: 'ai', label: 'AI', intensity: 5 }] }));
    expect(high.interestGenes[0].percent).toBeGreaterThan(low.interestGenes[0].percent);
  });

  it('maps self-rated skill level monotonically to skill percent', () => {
    const beginner = generateDna(makeProfile({ skills: [{ id: 'programming', label: 'Programming', level: 'beginner' }] }));
    const expert = generateDna(makeProfile({ skills: [{ id: 'programming', label: 'Programming', level: 'expert' }] }));
    expect(expert.skillGenes[0].percent).toBeGreaterThan(beginner.skillGenes[0].percent);
    expect(beginner.skillGenes[0].raw).toContain('self-rated');
  });

  it('scales helix density with skill count', () => {
    const few = generateDna(makeProfile({ skills: [{ id: 'programming', label: 'Programming', level: 'advanced' }] }));
    const many = generateDna(
      makeProfile({
        skills: [
          { id: 'programming', label: 'Programming', level: 'advanced' },
          { id: 'design', label: 'Design', level: 'advanced' },
          { id: 'marketing', label: 'Marketing', level: 'advanced' },
          { id: 'research', label: 'Research', level: 'advanced' },
        ],
      })
    );
    expect(many.helix.branchCount).toBeGreaterThan(few.helix.branchCount);
  });

  it('scales particles with habit count', () => {
    const quiet = generateDna(
      makeProfile({ habits: { platforms: [], tools: [], contentTypes: [], products: [], activities: [] } })
    );
    const busy = generateDna(makeProfile());
    expect(busy.helix.particleCount).toBeGreaterThan(quiet.helix.particleCount);
  });

  it('applies the chosen visual style to the palette', () => {
    const neon = generateDna(makeProfile({ visualStyle: 'neon' }));
    const minimal = generateDna(makeProfile({ visualStyle: 'minimal' }));
    expect(neon.palette.background).not.toBe(minimal.palette.background);
    expect(neon.helix.glow).toBeGreaterThan(minimal.helix.glow);
  });

  it('keeps every geometry parameter finite and in range', () => {
    const r = generateDna(makeProfile());
    expect(r.helix.rungs).toBeGreaterThan(0);
    expect(r.helix.jitter).toHaveLength(48);
    expect(r.helix.jitter.every((v) => v >= 0 && v <= 1)).toBe(true);
    expect(Number.isFinite(r.helix.amplitude)).toBe(true);
    expect(r.interestGenes.every((g) => g.percent >= 0 && g.percent <= 100)).toBe(true);
    expect(r.dimensions).toHaveLength(8);
    expect(r.dimensions.every((d) => d.percent >= 0 && d.percent <= 100)).toBe(true);
  });

  it('generates a DNA code in the documented format', () => {
    const r = generateDna(makeProfile());
    expect(r.dnaCode).toMatch(/^DNA-[0-9A-F]{6}$/);
    expect(r.hash).toMatch(/^[0-9A-F]{16}$/);
  });

  it('derives the DNA code from answers only, never from storage metadata', () => {
    // Same answers, different local ids/salts/timestamps → same public number,
    // so the number can be recomputed by anyone from the visible answers.
    const a = makeProfile({ id: 'profile-a', salt: 'salt-a', createdAt: '2025-01-01T00:00:00.000Z' });
    const b = makeProfile({ id: 'profile-b', salt: 'salt-b', createdAt: '2026-09-09T00:00:00.000Z' });
    expect(generateDna(a).dnaCode).toBe(generateDna(b).dnaCode);
    expect(generateDna(a).hash).toBe(generateDna(b).hash);
  });

  it('handles custom interests and skills', () => {
    const r = generateDna(
      makeProfile({
        interests: [{ id: 'custom:3d-printing', label: '3D Printing', intensity: 4, custom: true }],
        skills: [{ id: 'custom:latte-art', label: 'Latte Art', level: 'expert', custom: true }],
      })
    );
    expect(r.interestGenes[0].label).toBe('3D Printing');
    expect(r.interestGenes[0].custom).toBe(true);
    expect(r.skillGenes[0].custom).toBe(true);
  });
});

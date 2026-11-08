import { describe, expect, it } from 'vitest';
import { createEmptyProfile } from '../lib/profile';
import { generateDna } from '../lib/engine';
import { encodeSharePayload, decodeSharePayload, buildShareUrl } from '../lib/share';
import type { Profile } from '../lib/types';

function sampleProfile(): Profile {
  return {
    ...createEmptyProfile(),
    nickname: 'Helix Tester',
    bio: 'Testing the share round-trip.',
    role: 'Engineer',
    field: 'Tools',
    avatar: 'data:image/jpeg;base64,AAAA',
    interests: [
      { id: 'ai', label: 'AI', intensity: 5 },
      { id: 'music', label: 'Music', intensity: 2 },
    ],
    skills: [
      { id: 'programming', label: 'Programming', level: 'expert' },
      { id: 'design', label: 'Design', level: 'beginner' },
    ],
    creative: {
      outputs: ['systems', 'stories'],
      workStyle: 'team',
      exploration: 'deepen',
      thinking: 'text',
      pace: 'marathon',
    },
    habits: {
      platforms: ['github'],
      tools: ['vscode'],
      contentTypes: ['code-repos'],
      products: ['laptop'],
      activities: ['coding'],
    },
    visualStyle: 'retro',
  };
}

describe('share payload round-trip', () => {
  it('reproduces the same DNA when decoded', () => {
    const profile = sampleProfile();
    const original = generateDna(profile, 1, '2026-02-02T00:00:00.000Z');
    const decoded = decodeSharePayload(encodeSharePayload(profile, original));

    expect(decoded).not.toBeNull();
    expect(decoded!.profile.nickname).toBe('Helix Tester');
    expect(decoded!.result.dnaCode).toBe(original.dnaCode);
    expect(decoded!.result.hash).toBe(original.hash);
    expect(decoded!.result.dimensions).toEqual(original.dimensions);
    expect(decoded!.result.tags).toEqual(original.tags);
    expect(decoded!.result.palette).toEqual(original.palette);
  });

  it('never puts local-only fields into the payload', () => {
    const profile = sampleProfile();
    const token = encodeSharePayload(profile, generateDna(profile));
    const decoded = JSON.parse(atob(token.replace(/-/g, '+').replace(/_/g, '/')));

    expect(decoded).not.toHaveProperty('avatar');
    expect(decoded).not.toHaveProperty('id');
    expect(decoded).not.toHaveProperty('salt');
    expect(JSON.stringify(decoded)).not.toContain(profile.id);
    expect(JSON.stringify(decoded)).not.toContain(profile.salt);
    expect(JSON.stringify(decoded)).not.toContain('data:image');
  });

  it('is URL-safe (no +, /, or = characters)', () => {
    const profile = sampleProfile();
    const token = encodeSharePayload(profile, generateDna(profile));
    expect(token).not.toMatch(/[+/=]/);
    expect(encodeURIComponent(token)).toBe(token);
  });

  it('returns null for garbage input instead of throwing', () => {
    expect(decodeSharePayload('not-a-payload')).toBeNull();
    expect(decodeSharePayload('')).toBeNull();
    expect(decodeSharePayload('IiIi')).toBeNull();
  });

  it('builds a hash-based share URL', () => {
    const profile = sampleProfile();
    const url = buildShareUrl(profile, generateDna(profile));
    expect(url).toContain('#/dna/');
    expect(url.startsWith('http')).toBe(true);
  });

  it('rebuilds a view-only profile that is never the stored profile', () => {
    const profile = sampleProfile();
    const decoded = decodeSharePayload(encodeSharePayload(profile, generateDna(profile)));
    expect(decoded!.profile.id).toBe('shared');
    expect(decoded!.profile.visibility).toBe('public');
    expect(decoded!.profile.avatar).toBeNull();
  });
});

describe('helix geometry', () => {
  it('is deterministic for identical parameters', async () => {
    const { buildHelixScene } = await import('../lib/helix');
    const profile = sampleProfile();
    const result = generateDna(profile);
    const a = buildHelixScene(result.helix, result.palette);
    const b = buildHelixScene(result.helix, result.palette);
    expect(a.strands.pathA).toBe(b.strands.pathA);
    expect(a.rungs.length).toBe(b.rungs.length);
    expect(a.particles).toEqual(b.particles);
    expect(a.branches.length).toBe(b.branches.length);
  });

  it('differs between different profiles', async () => {
    const { buildHelixScene } = await import('../lib/helix');
    const a = generateDna(sampleProfile());
    const b = generateDna({
      ...sampleProfile(),
      visualStyle: 'neon',
      habits: { platforms: [], tools: [], contentTypes: [], products: [], activities: [] },
    });
    const sceneA = buildHelixScene(a.helix, a.palette);
    const sceneB = buildHelixScene(b.helix, b.palette);
    expect(sceneA.strands.pathA).not.toBe(sceneB.strands.pathA);
  });

  it('produces valid SVG path syntax', async () => {
    const { buildHelixScene } = await import('../lib/helix');
    const result = generateDna(sampleProfile());
    const scene = buildHelixScene(result.helix, result.palette);

    // "M x y" followed by any number of "C x1 y1, x2 y2, x y" segments.
    const valid = /^M -?\d+(\.\d+)? -?\d+(\.\d+)?( C -?\d+(\.\d+)? -?\d+(\.\d+)?, -?\d+(\.\d+)? -?\d+(\.\d+)?, -?\d+(\.\d+)? -?\d+(\.\d+)?)+$/;
    expect(scene.strands.pathA).toMatch(valid);
    expect(scene.strands.pathB).toMatch(valid);
    expect(scene.strands.pathA).not.toContain('NaN');
    expect(scene.strands.pathB).not.toContain('NaN');
  });

  it('keeps every point inside the viewBox', async () => {
    const { buildHelixScene, HELIX_VIEWBOX } = await import('../lib/helix');
    const result = generateDna(sampleProfile());
    const scene = buildHelixScene(result.helix, result.palette);
    for (const p of [...scene.strands.pointsA, ...scene.strands.pointsB]) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(HELIX_VIEWBOX.width);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(HELIX_VIEWBOX.height);
    }
  });

  it('draws one rung per requested rung and one branch per skill', async () => {
    const { buildHelixScene } = await import('../lib/helix');
    const profile = sampleProfile();
    const result = generateDna(profile);
    const scene = buildHelixScene(result.helix, result.palette);
    expect(scene.rungs).toHaveLength(result.helix.rungs);
    expect(scene.branches).toHaveLength(result.helix.branchCount);
  });
});

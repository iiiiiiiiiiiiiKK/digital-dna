import { describe, expect, it } from 'vitest';
import { buildCardSvg, EXPORT_SIZES, exportFilename } from '../lib/export';
import { createEmptyProfile } from '../lib/profile';
import { generateDna } from '../lib/engine';
import type { Profile } from '../lib/types';

function sample(): { profile: Profile; result: ReturnType<typeof generateDna> } {
  const profile: Profile = {
    ...createEmptyProfile(),
    nickname: 'Card Tester',
    role: 'Designer',
    interests: [
      { id: 'design', label: 'Design', intensity: 4 },
      { id: 'ai', label: 'AI', intensity: 3 },
    ],
    skills: [{ id: 'design', label: 'Design', level: 'advanced' }],
    creative: { outputs: ['visuals'], workStyle: 'team', exploration: 'deepen', thinking: 'visual', pace: 'mixed' },
  };
  return { profile, result: generateDna(profile, 1, '2026-03-03T00:00:00.000Z') };
}

describe('card SVG export', () => {
  it('emits a square document at the documented size', () => {
    const { profile, result } = sample();
    const svg = buildCardSvg({ profile, result, format: 'square' });
    expect(svg).toContain('width="1080"');
    expect(svg).toContain('height="1080"');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('emits a 1080x1920 poster', () => {
    const { profile, result } = sample();
    const svg = buildCardSvg({ profile, result, format: 'poster' });
    expect(svg).toContain(`width="${EXPORT_SIZES.poster.width}"`);
    expect(svg).toContain(`height="${EXPORT_SIZES.poster.height}"`);
  });

  it('contains the nickname, DNA code and date', () => {
    const { profile, result } = sample();
    const svg = buildCardSvg({ profile, result, format: 'square' });
    expect(svg).toContain('Card Tester');
    expect(svg).toContain(result.dnaCode);
    expect(svg).toContain('2026-03-03');
  });

  it('contains no NaN or undefined coordinates', () => {
    const { profile, result } = sample();
    for (const format of ['square', 'poster'] as const) {
      const svg = buildCardSvg({ profile, result, format });
      expect(svg).not.toContain('NaN');
      expect(svg).not.toContain('undefined');
      expect(svg).not.toContain('Infinity');
    }
  });

  it('escapes user text so injected markup cannot break the SVG', () => {
    const profile: Profile = {
      ...createEmptyProfile(),
      nickname: '<script>alert(1)</script>',
      interests: [{ id: 'ai', label: 'A&B <c>', intensity: 2 }],
      skills: [{ id: 'writing', label: 'Writing', level: 'beginner' }],
    };
    const result = generateDna(profile, 1, '2026-03-03T00:00:00.000Z');
    const svg = buildCardSvg({ profile, result, format: 'square' });

    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
    expect(svg).toContain('A&amp;B &lt;c&gt;');
  });

  it('uses only system fonts and no external assets', () => {
    const { profile, result } = sample();
    const svg = buildCardSvg({ profile, result, format: 'square' });
    expect(svg).toContain('Segoe UI');
    expect(svg).not.toContain('@font-face');
    // The only URL allowed is the SVG namespace itself.
    const urls = svg.match(/https?:\/\/[^"')\s]+/g) ?? [];
    expect(urls).toEqual(['http://www.w3.org/2000/svg']);
    expect(svg).not.toContain('<image');
    expect(svg).not.toContain('href=');
  });

  it('builds a safe filename', () => {
    const { profile, result } = sample();
    const name = exportFilename(profile, result, 'square');
    expect(name).toMatch(/^Card-Tester-DNA-[0-9A-F]{6}-square\.png$/);
  });

  it('keeps a CJK nickname readable in the filename', () => {
    const profile: Profile = {
      ...createEmptyProfile(),
      nickname: '数字基因',
      interests: [{ id: 'ai', label: 'AI', intensity: 3 }],
      skills: [{ id: 'writing', label: 'Writing', level: 'beginner' }],
    };
    const result = generateDna(profile);
    expect(exportFilename(profile, result, 'poster')).toMatch(/^数字基因-DNA-[0-9A-F]{6}-poster\.png$/);
  });
});

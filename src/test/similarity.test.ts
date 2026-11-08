import { describe, expect, it } from 'vitest';
import { jaccard, weightedJaccard, profilePercentSimilarity, compareProfiles } from '../lib/similarity';
import { generateDna } from '../lib/engine';
import { createEmptyProfile } from '../lib/profile';
import { DEMO_PROFILES } from '../lib/demo';

describe('jaccard', () => {
  it('returns 100 for identical sets', () => {
    expect(jaccard(['a', 'b'], ['a', 'b'])).toBe(100);
  });

  it('returns 0 for disjoint sets', () => {
    expect(jaccard(['a'], ['b'])).toBe(0);
  });

  it('computes the classic ratio', () => {
    // |{a,b} ∩ {b,c}| = 1, union = 3 → 33.3
    expect(jaccard(['a', 'b'], ['b', 'c'])).toBe(33.3);
  });

  it('reports two empty sets as no data, never as 100%', () => {
    expect(jaccard([], [])).toBeNull();
  });

  it('reports one empty set as 0', () => {
    expect(jaccard(['a'], [])).toBe(0);
    expect(jaccard([], ['a'])).toBe(0);
  });

  it('deduplicates before comparing', () => {
    expect(jaccard(['a', 'a', 'b'], ['a', 'b'])).toBe(100);
  });
});

describe('weightedJaccard', () => {
  it('returns 100 when weights match exactly', () => {
    const a = new Map([['x', 4], ['y', 2]]);
    const b = new Map([['x', 4], ['y', 2]]);
    expect(weightedJaccard(a, b)).toBe(100);
  });

  it('uses only the overlap of weights, not the count', () => {
    const a = new Map([['x', 5]]);
    const b = new Map([['x', 1]]);
    expect(weightedJaccard(a, b)).toBe(20);
  });

  it('is null for two empty maps', () => {
    expect(weightedJaccard(new Map(), new Map())).toBeNull();
  });

  it('is 0 when only one side has data', () => {
    expect(weightedJaccard(new Map([['x', 3]]), new Map())).toBe(0);
  });

  it('is symmetric', () => {
    const a = new Map([['x', 5], ['y', 1]]);
    const b = new Map([['x', 2], ['z', 4]]);
    expect(weightedJaccard(a, b)).toBe(weightedJaccard(b, a));
  });
});

describe('profilePercentSimilarity', () => {
  it('accounts for genes present on only one side', () => {
    const a = [{ id: 'ai', label: 'AI', percent: 90, raw: '' }];
    const b = [
      { id: 'ai', label: 'AI', percent: 90, raw: '' },
      { id: 'design', label: 'Design', percent: 90, raw: '' },
    ];
    const sim = profilePercentSimilarity(a, b);
    expect(sim).not.toBeNull();
    expect(sim!).toBeLessThan(100);
    // mean |diff| = (0 + 90) / 2 = 45 → 55
    expect(sim).toBe(55);
  });

  it('is null when both lists are empty', () => {
    expect(profilePercentSimilarity([], [])).toBeNull();
  });
});

describe('compareProfiles', () => {
  const demoA = DEMO_PROFILES[0];
  const demoB = DEMO_PROFILES[1];
  const resultA = generateDna(demoA, 1, demoA.createdAt);
  const resultB = generateDna(demoB, 1, demoB.createdAt);

  it('reports every documented dimension', () => {
    const report = compareProfiles({ profile: demoA, result: resultA }, { profile: demoB, result: resultB });
    expect(report.breakdown.length).toBe(9);
    expect(report.breakdown.every((b) => typeof b.method === 'string' && b.method.length > 0)).toBe(true);
    expect(report.overall).not.toBeNull();
  });

  it('is symmetric for overlapping metrics', () => {
    const ab = compareProfiles({ profile: demoA, result: resultA }, { profile: demoB, result: resultB });
    const ba = compareProfiles({ profile: demoB, result: resultB }, { profile: demoA, result: resultA });
    expect(ab.overall).toBe(ba.overall);
    expect(ab.breakdown.map((b) => b.percent)).toEqual(ba.breakdown.map((b) => b.percent));
  });

  it('scores a profile against itself as fully matching', () => {
    const self = compareProfiles({ profile: demoA, result: resultA }, { profile: demoA, result: resultA });
    expect(self.overall).toBe(100);
    expect(self.sharedInterests.length).toBe(demoA.interests.length);
    expect(self.uniqueToA).toHaveLength(0);
  });

  it('handles two nearly empty profiles without dividing by zero', () => {
    const empty = createEmptyProfile();
    empty.nickname = 'Empty';
    empty.interests = [{ id: 'ai', label: 'AI', intensity: 1 }];
    empty.skills = [{ id: 'writing', label: 'Writing', level: 'beginner' }];
    const emptyResult = generateDna(empty);

    const report = compareProfiles({ profile: empty, result: emptyResult }, { profile: empty, result: emptyResult });
    expect(report.overall).toBe(100);
    expect(report.breakdown.every((b) => b.percent === null || Number.isFinite(b.percent))).toBe(true);
  });

  it('lists concrete differences', () => {
    const report = compareProfiles({ profile: demoA, result: resultA }, { profile: demoB, result: resultB });
    expect(report.differences.length).toBeGreaterThan(0);
    expect(report.differences.every((d) => d.label && d.a !== undefined && d.b !== undefined)).toBe(true);
  });
});

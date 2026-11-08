/**
 * Similarity maths for Compare DNA.
 *
 * Documented, honest, and careful about the boring cases:
 *
 *  - Sets are compared with Jaccard: |A ∩ B| / |A ∪ B|.
 *  - Weighted sets use weighted Jaccard (Ruzicka): Σ min(wA,wB) / Σ max(wA,wB).
 *  - Two empty sets are reported as "no data" (null), never as 100% similar,
 *    because "both said nothing" is not evidence of agreement.
 *  - When exactly one side is empty the result is 0, not a divide-by-zero.
 *  - Percentages are compared with 1 - mean(|a-b|)/100 so a 4-point difference
 *    is a 4-point gap regardless of how many items exist.
 *  - Categorical answers (work style, thinking, pace…) are compared as
 *    equality (100 / 0) and never weighted into a fake "compatibility score".
 *
 * Nothing here claims to measure personality match. The UI labels every number
 * as "answer overlap".
 */

import type { DnaResult, GeneValue, Profile } from './types';

export interface SimilarityBreakdown {
  id: string;
  label: string;
  /** 0–100, or null when neither profile supplied the data. */
  percent: number | null;
  method: string;
  detail: string;
}

export interface CompareReport {
  overall: number | null;
  breakdown: SimilarityBreakdown[];
  sharedTags: string[];
  uniqueToA: string[];
  uniqueToB: string[];
  sharedInterests: string[];
  sharedSkills: string[];
  differences: { label: string; a: string; b: string }[];
}

function intersectionSize<T>(a: Set<T>, b: Set<T>): number {
  let n = 0;
  for (const v of a) if (b.has(v)) n++;
  return n;
}

/** Jaccard with explicit, honest handling of empty sets. */
export function jaccard<T>(a: T[], b: T[]): number | null {
  const sa = new Set(a);
  const sb = new Set(b);
  if (sa.size === 0 && sb.size === 0) return null;
  if (sa.size === 0 || sb.size === 0) return 0;
  const inter = intersectionSize(sa, sb);
  const union = sa.size + sb.size - inter;
  return union === 0 ? null : round((inter / union) * 100);
}

/**
 * Weighted Jaccard (Ruzicka) over id → weight maps. Weights must be > 0.
 * Returns null only when both maps are empty.
 */
export function weightedJaccard(a: Map<string, number>, b: Map<string, number>): number | null {
  if (a.size === 0 && b.size === 0) return null;
  if (a.size === 0 || b.size === 0) return 0;
  const keys = new Set([...a.keys(), ...b.keys()]);
  let minSum = 0;
  let maxSum = 0;
  for (const k of keys) {
    const av = a.get(k) ?? 0;
    const bv = b.get(k) ?? 0;
    minSum += Math.min(av, bv);
    maxSum += Math.max(av, bv);
  }
  if (maxSum === 0) return null;
  return round((minSum / maxSum) * 100);
}

/** Mean absolute difference of two percentage lists, inverted to a similarity. */
export function profilePercentSimilarity(a: GeneValue[], b: GeneValue[]): number | null {
  const mapA = new Map(a.map((g) => [g.id, g.percent]));
  const mapB = new Map(b.map((g) => [g.id, g.percent]));
  const keys = [...new Set([...mapA.keys(), ...mapB.keys()])];
  if (keys.length === 0) return null;

  let total = 0;
  for (const k of keys) {
    const av = mapA.get(k) ?? 0;
    const bv = mapB.get(k) ?? 0;
    total += Math.abs(av - bv);
  }
  // Items present on only one side contribute their full value difference, so a
  // profile with many extra genes is correctly reported as dissimilar.
  const mean = total / keys.length;
  return round(Math.max(0, 100 - mean));
}

export function compareProfiles(
  a: { profile: Profile; result: DnaResult },
  b: { profile: Profile; result: DnaResult }
): CompareReport {
  const interestA = new Set(a.profile.interests.map((i) => i.id));
  const interestB = new Set(b.profile.interests.map((i) => i.id));
  const skillA = new Set(a.profile.skills.map((s) => s.id));
  const skillB = new Set(b.profile.skills.map((s) => s.id));

  const interestJaccard = jaccard([...interestA], [...interestB]);
  const skillJaccard = jaccard([...skillA], [...skillB]);

  const weightedInterests = weightedJaccard(
    new Map(a.profile.interests.map((i) => [i.id, i.intensity])),
    new Map(b.profile.interests.map((i) => [i.id, i.intensity]))
  );

  const interestPercentSim = profilePercentSimilarity(a.result.interestGenes, b.result.interestGenes);
  const skillPercentSim = profilePercentSimilarity(a.result.skillGenes, b.result.skillGenes);

  const catMatch = (x: string, y: string): number => (x === y ? 100 : 0);
  const creativePairs = [
    ['Outputs', a.profile.creative.outputs.join(','), b.profile.creative.outputs.join(',')],
    ['Work style', a.profile.creative.workStyle, b.profile.creative.workStyle],
    ['Exploration', a.profile.creative.exploration, b.profile.creative.exploration],
    ['Thinking', a.profile.creative.thinking, b.profile.creative.thinking],
    ['Pace', a.profile.creative.pace, b.profile.creative.pace],
  ] as const;

  const creativeScores = creativePairs.map(([, x, y]) => catMatch(x, y));
  const creativeSimilarity = round(creativeScores.reduce((s, v) => s + v, 0) / creativeScores.length);

  const visualMatch = catMatch(a.profile.visualStyle, b.profile.visualStyle);

  const habitKeys = ['platforms', 'tools', 'contentTypes', 'products', 'activities'] as const;
  const habitScores: (number | null)[] = habitKeys.map((k) => jaccard(a.profile.habits[k], b.profile.habits[k]));
  const habitSimilarity = averageDefined(habitScores);

  const tagJaccard = jaccard(a.result.tags, b.result.tags);

  const breakdown: SimilarityBreakdown[] = [
    {
      id: 'interests',
      label: 'Interest overlap',
      percent: interestJaccard,
      method: 'Jaccard index over interest ids',
      detail: `${intersectionSize(interestA, interestB)} shared of ${new Set([...interestA, ...interestB]).size} total domains`,
    },
    {
      id: 'interest-intensity',
      label: 'Interest intensity match',
      percent: weightedInterests,
      method: 'Weighted Jaccard (Ruzicka) over 1–5 intensities',
      detail: 'Compares how strongly you each rated the same domains',
    },
    {
      id: 'interest-profile',
      label: 'Interest profile distance',
      percent: interestPercentSim,
      method: '1 − mean absolute difference of interest percentages',
      detail: 'Accounts for domains only one side selected',
    },
    {
      id: 'skills',
      label: 'Skill overlap',
      percent: skillJaccard,
      method: 'Jaccard index over skill ids',
      detail: `${intersectionSize(skillA, skillB)} shared of ${new Set([...skillA, ...skillB]).size} total skills`,
    },
    {
      id: 'skill-profile',
      label: 'Skill level match',
      percent: skillPercentSim,
      method: '1 − mean absolute difference of skill percentages',
      detail: 'Uses the self-rated levels, not any measured ability',
    },
    {
      id: 'creative',
      label: 'Creative answers match',
      percent: creativeSimilarity,
      method: 'Share of identical answers across 5 creative questions',
      detail: 'Equality only — partial credit is not meaningful here',
    },
    {
      id: 'habits',
      label: 'Digital habit overlap',
      percent: habitSimilarity,
      method: 'Mean Jaccard across platforms, tools, content, products, activities',
      detail: 'Only categories you both filled in are averaged',
    },
    {
      id: 'visual',
      label: 'Visual preference',
      percent: visualMatch,
      method: 'Exact style equality',
      detail: 'Same chosen visual style, or not',
    },
    {
      id: 'tags',
      label: 'Tag overlap',
      percent: tagJaccard,
      method: 'Jaccard index over generated identity tags',
      detail: 'Tags are derived from your answers',
    },
  ];

  const overall = averageDefined(breakdown.map((b) => b.percent));

  const sharedTags = a.result.tags.filter((t) => b.result.tags.includes(t));
  const uniqueToA = a.result.tags.filter((t) => !b.result.tags.includes(t));
  const uniqueToB = b.result.tags.filter((t) => !a.result.tags.includes(t));

  const sharedInterests = a.profile.interests.filter((i) => interestB.has(i.id)).map((i) => i.label);
  const sharedSkills = a.profile.skills.filter((s) => skillB.has(s.id)).map((s) => s.label);

  const differences: { label: string; a: string; b: string }[] = [];
  const topA = a.result.dimensions.reduce((m, d) => (d.percent > m.percent ? d : m));
  const topB = b.result.dimensions.reduce((m, d) => (d.percent > m.percent ? d : m));
  if (topA.label !== topB.label) {
    differences.push({ label: 'Dominant dimension', a: `${topA.label} ${topA.percent}`, b: `${topB.label} ${topB.percent}` });
  }
  if (a.profile.visualStyle !== b.profile.visualStyle) {
    differences.push({ label: 'Visual style', a: a.profile.visualStyle, b: b.profile.visualStyle });
  }
  if (a.profile.creative.workStyle !== b.profile.creative.workStyle) {
    differences.push({ label: 'Work style', a: a.profile.creative.workStyle, b: b.profile.creative.workStyle });
  }
  if (a.profile.creative.exploration !== b.profile.creative.exploration) {
    differences.push({ label: 'Exploration', a: a.profile.creative.exploration, b: b.profile.creative.exploration });
  }
  const onlyA = [...interestA].filter((id) => !interestB.has(id));
  const onlyB = [...interestB].filter((id) => !interestA.has(id));
  if (onlyA.length) differences.push({ label: 'Interests only in A', a: onlyA.join(', '), b: '—' });
  if (onlyB.length) differences.push({ label: 'Interests only in B', a: '—', b: onlyB.join(', ') });

  return {
    overall,
    breakdown,
    sharedTags: sharedTags.slice(0, 20),
    uniqueToA: uniqueToA.slice(0, 20),
    uniqueToB: uniqueToB.slice(0, 20),
    sharedInterests,
    sharedSkills,
    differences,
  };
}

function averageDefined(values: (number | null)[]): number | null {
  const defined = values.filter((v): v is number => v !== null);
  if (defined.length === 0) return null;
  return round(defined.reduce((s, v) => s + v, 0) / defined.length);
}

function round(v: number): number {
  return Math.round(v * 10) / 10;
}

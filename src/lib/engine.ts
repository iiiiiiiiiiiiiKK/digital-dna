/**
 * Digital DNA engine.
 *
 * Every value produced here is a documented, reproducible transform of the
 * answers the user gave. The mapping table is listed in `MAPPING_RULES` below
 * and rendered verbatim in the UI (see components/engine/EngineExplainer.tsx),
 * so nothing about the result is opaque.
 *
 * Determinism contract: `generateDna(profile, version)` depends only on the
 * canonical answer payload and the profile salt. Calling it twice with the same
 * answers returns byte-identical output.
 */

import { fingerprint, fnv1a32, buildDnaCode, createRng } from './hash';
import { answerPayload, SKILL_LEVEL_PERCENT } from './profile';
import type {
  DnaArchetype,
  DnaDimension,
  DnaResult,
  GeneValue,
  HelixParameters,
  Palette,
  Profile,
  VisualStyleId,
} from './types';

export const MAPPING_RULES: { from: string; to: string }[] = [
  { from: 'Interest domain', to: 'Helix main hue and rung colour' },
  { from: 'Interest intensity (1-5)', to: 'Rung node size and brightness' },
  { from: 'Number of skills', to: 'Number of side branches' },
  { from: 'Self-rated skill level', to: 'Branch thickness and gene percentage' },
  { from: 'Creative answers', to: 'Helix shape: braid, turns, amplitude' },
  { from: 'Digital habits', to: 'Ambient particle distribution' },
  { from: 'Visual preference', to: 'Overall rendering style and palette' },
  { from: 'All answers (canonicalised)', to: 'DNA identity number and geometry seed' },
];

/** Fixed hue wheel for interest domains - a stable colour per domain id. */
const INTEREST_HUES: Record<string, number> = {
  technology: 190,
  ai: 265,
  crypto: 42,
  finance: 150,
  design: 320,
  art: 12,
  music: 285,
  gaming: 225,
  science: 205,
  business: 32,
  writing: 350,
  photography: 260,
  education: 168,
  travel: 96,
  sports: 130,
  history: 25,
  psychology: 300,
  programming: 175,
  'internet-culture': 315,
  entrepreneurship: 55,
};

function hueFor(id: string): number {
  const known = INTEREST_HUES[id];
  if (known !== undefined) return known;
  // Custom interests get a stable hue from their own id, so the same custom
  // label always keeps the same colour.
  return fnv1a32(id) % 360;
}

/* ------------------------------------------------------------------ *
 * Palette
 * ------------------------------------------------------------------ */

interface StylePalette {
  background: string;
  backgroundAlt: string;
  strandA: string;
  strandB: string;
  accent: string;
  accentSoft: string;
  text: string;
  textMuted: string;
}

const STYLE_PALETTES: Record<VisualStyleId, StylePalette> = {
  cyberpunk: {
    background: '#0b0316',
    backgroundAlt: '#1a0730',
    strandA: '#ff2bd1',
    strandB: '#22e6ff',
    accent: '#ff2bd1',
    accentSoft: '#7a1a63',
    text: '#f6f0ff',
    textMuted: '#a993c7',
  },
  minimal: {
    background: '#0a0b0d',
    backgroundAlt: '#141619',
    strandA: '#e8edf4',
    strandB: '#8b96a5',
    accent: '#e8edf4',
    accentSoft: '#3a414b',
    text: '#f4f7fa',
    textMuted: '#8b96a5',
  },
  futuristic: {
    background: '#040a16',
    backgroundAlt: '#0a1730',
    strandA: '#5bc8ff',
    strandB: '#9d7bff',
    accent: '#5bc8ff',
    accentSoft: '#2b4a7a',
    text: '#eef6ff',
    textMuted: '#7e97b8',
  },
  retro: {
    background: '#080c07',
    backgroundAlt: '#111a10',
    strandA: '#8dff8d',
    strandB: '#ffb35c',
    accent: '#ffb35c',
    accentSoft: '#3f5c3a',
    text: '#eafff0',
    textMuted: '#89a186',
  },
  abstract: {
    background: '#0b0614',
    backgroundAlt: '#1d0f2e',
    strandA: '#b14bff',
    strandB: '#ff9d4b',
    accent: '#ff9d4b',
    accentSoft: '#5c2f7a',
    text: '#fbf3ff',
    textMuted: '#b096c9',
  },
  organic: {
    background: '#04100c',
    backgroundAlt: '#0a211a',
    strandA: '#4be6a1',
    strandB: '#a7ff8d',
    accent: '#4be6a1',
    accentSoft: '#245c46',
    text: '#ecfff6',
    textMuted: '#85a899',
  },
  neon: {
    background: '#05010b',
    backgroundAlt: '#12042a',
    strandA: '#39ff14',
    strandB: '#ff1f6f',
    accent: '#39ff14',
    accentSoft: '#3f0f2c',
    text: '#f8fff4',
    textMuted: '#9a8fb0',
  },
  monochrome: {
    background: '#07080a',
    backgroundAlt: '#121417',
    strandA: '#d8dee9',
    strandB: '#6b7280',
    accent: '#d8dee9',
    accentSoft: '#3a3f47',
    text: '#f2f4f7',
    textMuted: '#8a919b',
  },
};

function buildPalette(profile: Profile): Palette {
  const style = STYLE_PALETTES[profile.visualStyle] ?? STYLE_PALETTES.futuristic;
  // Rank interests by intensity so the primary hue reflects the strongest gene.
  const sorted = [...profile.interests].sort((a, b) => b.intensity - a.intensity);
  const top = sorted[0];
  const second = sorted[1];

  // Only allow a hue influence when the top interest is genuinely dominant,
  // otherwise the visual style stays in charge instead of being overridden.
  const topHue = top ? hueFor(top.id) : null;
  const accent =
    top && top.intensity >= 4 ? `hsl(${topHue} 92% 62%)` : style.accent;
  const strandA =
    top && top.intensity >= 3 ? `hsl(${topHue} 88% 64%)` : style.strandA;
  const strandB =
    second && second.intensity >= 3 ? `hsl(${hueFor(second.id)} 85% 66%)` : style.strandB;

  const rungColors = sorted.slice(0, 12).map((item) => `hsl(${hueFor(item.id)} 90% ${52 + item.intensity * 5}%)`);

  return {
    background: style.background,
    backgroundAlt: style.backgroundAlt,
    strandA,
    strandB,
    accent,
    accentSoft: style.accentSoft,
    text: style.text,
    textMuted: style.textMuted,
    rungColors: rungColors.length ? rungColors : [style.accent],
  };
}

/* ------------------------------------------------------------------ *
 * Gene percentages
 * ------------------------------------------------------------------ */

/**
 * Interest % = intensity/5 -> 20/40/60/80/100, blended with a small, clearly
 * documented "breadth" term so two people with identical intensities but
 * different totals still differ. Breadth weight is capped at 10 points.
 */
export function interestPercent(intensity: number, totalInterests: number): number {
  const base = (Math.min(Math.max(intensity, 1), 5) / 5) * 100;
  const breadth = totalInterests <= 0 ? 0 : Math.min(totalInterests, 20) / 20;
  const blended = base * 0.9 + breadth * 10 * (intensity / 5);
  return Math.round(Math.min(100, blended));
}

export function skillPercent(level: keyof typeof SKILL_LEVEL_PERCENT, totalSkills: number): number {
  const base = SKILL_LEVEL_PERCENT[level] ?? 25;
  const breadth = totalSkills <= 0 ? 0 : Math.min(totalSkills, 15) / 15;
  const blended = base * 0.92 + breadth * 8 * (base / 100);
  return Math.round(Math.min(100, blended));
}

const SKILL_LABEL: Record<keyof typeof SKILL_LEVEL_PERCENT, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

const INTENSITY_LABEL: Record<number, string> = {
  1: 'Curious',
  2: 'Interested',
  3: 'Keen',
  4: 'Passionate',
  5: 'Obsessed',
};

/* ------------------------------------------------------------------ *
 * Dimensions (radar)
 * ------------------------------------------------------------------ */

function buildDimensions(profile: Profile): DnaDimension[] {
  const c = profile.creative;
  const has = (v: string, list: readonly string[]) => list.includes(v);

  const breadth =
    Math.min(100, profile.interests.length * 9 + profile.habits.platforms.length * 3 + profile.habits.tools.length * 3);

  const depth =
    profile.skills.length === 0
      ? 0
      : Math.round(
          Math.min(
            100,
            profile.skills.reduce((sum, s) => sum + SKILL_LEVEL_PERCENT[s.level], 0) / profile.skills.length
          )
        );

  const craft = Math.round(
    Math.min(
      100,
      (c.outputs.includes('products') ? 18 : 0) +
        (c.outputs.includes('systems') ? 18 : 0) +
        (c.outputs.includes('visuals') ? 16 : 0) +
        (c.outputs.includes('stories') ? 16 : 0) +
        (c.outputs.includes('knowledge') ? 12 : 0) +
        (c.outputs.includes('experiments') ? 12 : 0) +
        (has(c.pace, ['sprint']) ? 12 : has(c.pace, ['marathon']) ? 8 : 10)
    )
  );

  const collaboration =
    c.workStyle === 'team' ? 92 : c.workStyle === 'hybrid' ? 62 : 28;

  const exploration =
    c.exploration === 'explore' ? 90 : c.exploration === 'deepen' ? 42 : 68;

  const digitality = Math.round(
    Math.min(
      100,
      12 +
        profile.habits.platforms.length * 6 +
        profile.habits.tools.length * 5 +
        profile.habits.activities.length * 4 +
        profile.habits.contentTypes.length * 3
    )
  );

  const aesthetics = Math.round(
    Math.min(
      100,
      (c.thinking === 'visual' ? 42 : 18) +
        (c.outputs.includes('visuals') ? 24 : 0) +
        (profile.interests.some((i) => ['design', 'art', 'photography', 'music'].includes(i.id)) ? 20 : 0) +
        (profile.visualStyle === 'minimal' || profile.visualStyle === 'monochrome' ? 8 : 12)
    )
  );

  const logic = Math.round(
    Math.min(
      100,
      (c.thinking === 'logic' ? 46 : 20) +
        (c.thinking === 'hands-on' ? 18 : 0) +
        (profile.skills.some((s) => ['programming', 'data-analysis', 'research'].includes(s.id)) ? 22 : 0) +
        (profile.interests.some((i) => ['programming', 'science', 'ai'].includes(i.id)) ? 18 : 0)
    )
  );

  return [
    { id: 'breadth', label: 'Breadth', hint: 'How many domains and tools you listed', percent: breadth },
    { id: 'depth', label: 'Depth', hint: 'Average of your self-rated skill levels', percent: depth },
    { id: 'craft', label: 'Craft', hint: 'From the creative outputs you selected', percent: craft },
    { id: 'collaboration', label: 'Collaboration', hint: 'From your solo / team / hybrid answer', percent: collaboration },
    { id: 'exploration', label: 'Exploration', hint: 'From the explore / deepen answer', percent: exploration },
    { id: 'digitality', label: 'Digital life', hint: 'How many platforms, tools and habits you listed', percent: digitality },
    { id: 'aesthetics', label: 'Aesthetics', hint: 'From visual affinity answers', percent: aesthetics },
    { id: 'logic', label: 'Logic', hint: 'From thinking style and analytical skills', percent: logic },
  ];
}

/* ------------------------------------------------------------------ *
 * Archetype (labels derived from the answers, never a personality verdict)
 * ------------------------------------------------------------------ */

function buildArchetype(profile: Profile, dims: DnaDimension[]): DnaArchetype {
  const get = (id: string) => dims.find((d) => d.id === id)?.percent ?? 0;
  const strongest = [...dims].sort((a, b) => b.percent - a.percent)[0];
  const think = profile.creative.thinking;
  const topInterest = [...profile.interests].sort((a, b) => b.intensity - a.intensity)[0];

  const prefix =
    get('exploration') >= 75 ? 'Explorer' : get('depth') >= 70 ? 'Deep-Dive' : get('breadth') >= 70 ? 'Polymath' : 'Independent';

  const suffix =
    think === 'visual'
      ? 'Visualist'
      : think === 'text'
        ? 'Wordsmith'
        : think === 'logic'
          ? 'Systems Thinker'
          : 'Builder';

  const subject = topInterest?.label ?? 'Curious';

  return {
    title: `${prefix} ${suffix}`,
    subtitle: `${subject}-leaning · ${strongest.label} ${strongest.percent}`,
    description: `Your answers put ${strongest.label.toLowerCase()} at the top of your DNA map, with ${subject.toLowerCase()} as your strongest interest and a ${think === 'hands-on' ? 'build-first' : think === 'visual' ? 'visual-first' : think === 'text' ? 'language-first' : 'logic-first'} way of working. This label is generated from the options you chose — it is not a test result.`,
  };
}

function buildSummary(profile: Profile, dims: DnaDimension[]): string {
  const top = [...profile.interests].sort((a, b) => b.intensity - a.intensity).slice(0, 3);
  const topSkills = [...profile.skills]
    .sort((a, b) => SKILL_LEVEL_PERCENT[b.level] - SKILL_LEVEL_PERCENT[a.level])
    .slice(0, 3);
  const strongest = [...dims].sort((a, b) => b.percent - a.percent)[0];

  const interestsText = top.map((i) => `${i.label} (${i.intensity}/5)`).join(', ') || 'no interests yet';
  const skillsText = topSkills.map((s) => `${s.label} (${SKILL_LABEL[s.level]})`).join(', ') || 'no skills yet';

  return `You listed ${interestsText} as your strongest interests and ${skillsText} as your top self-rated skills. Your most pronounced DNA dimension is ${strongest.label} at ${strongest.percent}. Everything on this page is derived from the options you picked.`;
}

/* ------------------------------------------------------------------ *
 * Tags
 * ------------------------------------------------------------------ */

function collectTags(profile: Profile, dims: DnaDimension[]): string[] {
  const tags: string[] = [];
  const push = (t: string) => {
    const clean = t.trim();
    if (clean && !tags.some((x) => x.toLowerCase() === clean.toLowerCase())) tags.push(clean);
  };

  const styleLabel = profile.visualStyle.charAt(0).toUpperCase() + profile.visualStyle.slice(1);
  push(styleLabel);

  for (const i of [...profile.interests].sort((a, b) => b.intensity - a.intensity).slice(0, 6)) push(i.label);
  for (const s of [...profile.skills].sort((a, b) => SKILL_LEVEL_PERCENT[b.level] - SKILL_LEVEL_PERCENT[a.level]).slice(0, 4))
    push(s.label);

  const c = profile.creative;
  if (c.workStyle === 'solo') push('Solo Builder');
  if (c.workStyle === 'team') push('Team Player');
  if (c.workStyle === 'hybrid') push('Hybrid Worker');
  if (c.exploration === 'explore') push('Explorer');
  if (c.exploration === 'deepen') push('Deep Diver');
  if (c.pace === 'sprint') push('Fast Shipper');
  if (c.pace === 'marathon') push('Long Game');
  if (c.thinking === 'visual') push('Visual Thinker');
  if (c.thinking === 'text') push('Word Person');
  if (c.thinking === 'logic') push('Logical');
  if (c.thinking === 'hands-on') push('Hands-on');

  const dominant = [...dims].sort((a, b) => b.percent - a.percent)[0];
  if (dominant) push(`${dominant.label}-led`);

  return tags.slice(0, 12);
}

function buildTagCloud(profile: Profile): { label: string; weight: number }[] {
  const out: { label: string; weight: number }[] = [];
  for (const i of profile.interests) out.push({ label: i.label, weight: i.intensity });
  for (const s of profile.skills) out.push({ label: s.label, weight: SKILL_LEVEL_PERCENT[s.level] / 25 });
  for (const t of profile.habits.tools.slice(0, 6)) out.push({ label: t, weight: 1.5 });
  for (const p of profile.habits.platforms.slice(0, 6)) out.push({ label: p, weight: 1.2 });
  return out.sort((a, b) => b.weight - a.weight).slice(0, 24);
}

/**
 * Interest <-> skill links. Strength uses the shared taxonomy where a domain and
 * a skill are the same concept (e.g. Design interest <-> Design skill) plus a
 * deterministic hash-based affinity for unrelated pairs, so the graph is stable
 * and still looks organic.
 */
const INTEREST_SKILL_AFFINITY: Record<string, string[]> = {
  programming: ['ai-tools', 'data-analysis', 'product-building'],
  technology: ['programming', 'ai-tools', 'data-analysis'],
  ai: ['ai-tools', 'research', 'programming'],
  crypto: ['trading', 'research', 'data-analysis'],
  finance: ['trading', 'data-analysis', 'research'],
  design: ['design', 'video-editing', 'communication'],
  art: ['design', 'video-editing', 'writing'],
  music: ['video-editing', 'communication', 'writing'],
  gaming: ['programming', 'video-editing', 'communication'],
  science: ['research', 'data-analysis', 'writing'],
  business: ['marketing', 'product-building', 'communication'],
  writing: ['writing', 'communication', 'research'],
  photography: ['design', 'video-editing', 'marketing'],
  education: ['communication', 'writing', 'language-learning'],
  travel: ['language-learning', 'writing', 'communication'],
  sports: ['communication', 'research', 'marketing'],
  history: ['research', 'writing', 'language-learning'],
  psychology: ['research', 'communication', 'writing'],
  'internet-culture': ['marketing', 'video-editing', 'writing'],
  entrepreneurship: ['product-building', 'marketing', 'trading'],
};

function buildLinks(profile: Profile): { from: string; to: string; strength: number }[] {
  const links: { from: string; to: string; strength: number }[] = [];
  for (const interest of profile.interests) {
    const affinity = INTEREST_SKILL_AFFINITY[interest.id] ?? [];
    for (const skill of profile.skills) {
      const sameId = interest.id === skill.id;
      const inAffinity = affinity.includes(skill.id);
      const hashLuck = (fnv1a32(`${interest.id}:${skill.id}`) % 100) < 24;
      if (!sameId && !inAffinity && !hashLuck) continue;
      const strength = Math.min(
        100,
        Math.round(
          interest.intensity * 12 +
            SKILL_LEVEL_PERCENT[skill.level] * 0.45 +
            (sameId ? 14 : inAffinity ? 10 : 4)
        )
      );
      links.push({ from: interest.id, to: skill.id, strength });
    }
  }
  return links.sort((a, b) => b.strength - a.strength).slice(0, 40);
}

/* ------------------------------------------------------------------ *
 * Helix parameters
 * ------------------------------------------------------------------ */

function buildHelix(profile: Profile, seed: number): HelixParameters {
  const rng = createRng(seed);
  const c = profile.creative;

  const rungs = 18 + Math.min(profile.interests.length, 14) + Math.min(profile.skills.length, 12);
  const turns = 1.6 + Math.min(profile.skills.length, 12) * 0.11 + (c.exploration === 'explore' ? 0.4 : 0);
  const amplitude = 62 + Math.min(profile.interests.length, 12) * 2.2;

  const branchCount = Math.min(4 + profile.skills.length, 26);
  const avgSkill =
    profile.skills.length === 0
      ? 0
      : profile.skills.reduce((sum, s) => sum + SKILL_LEVEL_PERCENT[s.level], 0) / profile.skills.length;
  const branchWeight = 1 + (avgSkill / 100) * 3.4;

  const habitCount =
    profile.habits.platforms.length +
    profile.habits.tools.length +
    profile.habits.contentTypes.length +
    profile.habits.products.length +
    profile.habits.activities.length;
  const particleCount = Math.min(24 + habitCount * 3, 160);

  const braid =
    c.workStyle === 'solo' ? 0.82 : c.workStyle === 'team' ? 0.62 : 0.72;

  const twist =
    (c.pace === 'sprint' ? 1.35 : c.pace === 'marathon' ? 0.72 : 1) *
    (c.thinking === 'logic' ? 1.08 : c.thinking === 'visual' ? 1.18 : 1);

  const glow = c.thinking === 'visual' ? 0.92 : profile.visualStyle === 'minimal' ? 0.28 : 0.66;

  const baseRadius = 4.2 + Math.min(profile.interests.length, 12) * 0.34;
  const strandWidth = 2.1 + (profile.visualStyle === 'minimal' ? -0.5 : 0.6);

  const phase = (seed % 1000) / 1000 * Math.PI * 2;

  const jitter: number[] = [];
  for (let i = 0; i < 48; i++) jitter.push(rng());

  return {
    rungs,
    turns,
    amplitude,
    phase,
    twist,
    baseRadius,
    strandWidth: Math.max(1.2, strandWidth),
    branchCount,
    branchWeight,
    particleCount,
    particleSpread: 40 + habitCount * 1.6,
    glow,
    braid,
    jitter,
  };
}

/* ------------------------------------------------------------------ *
 * Main entry
 * ------------------------------------------------------------------ */

export function generateDna(profile: Profile, version = 1, generatedAt = new Date().toISOString()): DnaResult {
  const payload = answerPayload(profile);
  const hash = fingerprint(payload);
  const seed = fnv1a32(hash);
  const dnaCode = buildDnaCode(hash);

  const palette = buildPalette(profile);
  const helix = buildHelix(profile, seed);
  const totalInterests = profile.interests.length;
  const totalSkills = profile.skills.length;

  const interestGenes: GeneValue[] = [...profile.interests]
    .map((i) => ({
      id: i.id,
      label: i.label,
      percent: interestPercent(i.intensity, totalInterests),
      raw: `${INTENSITY_LABEL[i.intensity] ?? i.intensity} · ${i.intensity}/5`,
      custom: i.custom,
    }))
    .sort((a, b) => b.percent - a.percent);

  const skillGenes: GeneValue[] = [...profile.skills]
    .map((s) => ({
      id: s.id,
      label: s.label,
      percent: skillPercent(s.level, totalSkills),
      raw: `${SKILL_LABEL[s.level]} (self-rated)`,
      custom: s.custom,
    }))
    .sort((a, b) => b.percent - a.percent);

  const dimensions = buildDimensions(profile);
  const tags = collectTags(profile, dimensions);
  const tagCloud = buildTagCloud(profile);
  const links = buildLinks(profile);
  const archetype = buildArchetype(profile, dimensions);
  const summary = buildSummary(profile, dimensions);

  const creativeSummary = [
    { label: 'Creates', value: profile.creative.outputs.length ? profile.creative.outputs.map(capitalize).join(' · ') : '—' },
    { label: 'Works', value: { solo: 'Mostly solo', team: 'With a team', hybrid: 'Hybrid' }[profile.creative.workStyle] },
    {
      label: 'Explores',
      value: { explore: 'New territory', deepen: 'Deeper into the known', balanced: 'Both ways' }[profile.creative.exploration],
    },
    {
      label: 'Thinks',
      value: { visual: 'Visually', text: 'In words', logic: 'In logic', 'hands-on': 'By doing' }[profile.creative.thinking],
    },
    { label: 'Pace', value: { sprint: 'Fast iterations', marathon: 'Long polishing', mixed: 'Adaptive' }[profile.creative.pace] },
  ];

  const habitSummary = [
    { label: 'Platforms', values: profile.habits.platforms },
    { label: 'Tools', values: profile.habits.tools },
    { label: 'Content', values: profile.habits.contentTypes },
    { label: 'Products', values: profile.habits.products },
    { label: 'Daily activity', values: profile.habits.activities },
  ].filter((h) => h.values.length > 0);

  return {
    dnaCode,
    seed,
    hash,
    version,
    generatedAt,
    palette,
    helix,
    interestGenes,
    skillGenes,
    dimensions,
    tagCloud,
    links,
    creativeSummary,
    habitSummary,
    tags,
    archetype,
    summary,
  };
}

function capitalize(v: string): string {
  return v.charAt(0).toUpperCase() + v.slice(1);
}

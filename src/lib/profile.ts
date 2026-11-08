import type { Profile, SkillLevel, VisualStyleId } from './types';

export const SKILL_LEVEL_PERCENT: Record<SkillLevel, number> = {
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 100,
};

export function isSkillLevel(value: unknown): value is SkillLevel {
  return value === 'beginner' || value === 'intermediate' || value === 'advanced' || value === 'expert';
}

const VISUAL_STYLE_IDS: VisualStyleId[] = [
  'cyberpunk',
  'minimal',
  'futuristic',
  'retro',
  'abstract',
  'organic',
  'neon',
  'monochrome',
];

export function isVisualStyle(value: unknown): value is VisualStyleId {
  return typeof value === 'string' && (VISUAL_STYLE_IDS as string[]).includes(value);
}

export function newId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}_${rand}`;
}

/** Random salt generated once per profile so DNA numbers never collide across profiles. */
export function newSalt(): string {
  return newId('salt').slice(5);
}

export function createEmptyProfile(): Profile {
  const now = new Date().toISOString();
  return {
    id: newId('profile'),
    salt: newSalt(),
    nickname: '',
    bio: '',
    role: '',
    field: '',
    avatar: null,
    interests: [],
    skills: [],
    creative: {
      outputs: [],
      workStyle: 'hybrid',
      exploration: 'balanced',
      thinking: 'logic',
      pace: 'mixed',
    },
    habits: {
      platforms: [],
      tools: [],
      contentTypes: [],
      products: [],
      activities: [],
    },
    visualStyle: 'futuristic',
    visibility: 'private',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * The canonical answer payload. Only things the user actually chose are part of
 * the fingerprint — ids, salts, timestamps and visibility are excluded so an
 * identical set of answers always produces an identical DNA.
 */
export function answerPayload(profile: Profile) {
  return {
    v: 1,
    nicknameKey: profile.nickname.trim().toLowerCase(),
    role: profile.role.trim(),
    field: profile.field.trim(),
    interests: [...profile.interests]
      .map((i) => ({ id: i.id, label: i.label.trim(), intensity: i.intensity }))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
    skills: [...profile.skills]
      .map((s) => ({ id: s.id, label: s.label.trim(), level: s.level }))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
    creative: {
      outputs: [...profile.creative.outputs].sort(),
      workStyle: profile.creative.workStyle,
      exploration: profile.creative.exploration,
      thinking: profile.creative.thinking,
      pace: profile.creative.pace,
    },
    habits: {
      platforms: [...profile.habits.platforms].sort(),
      tools: [...profile.habits.tools].sort(),
      contentTypes: [...profile.habits.contentTypes].sort(),
      products: [...profile.habits.products].sort(),
      activities: [...profile.habits.activities].sort(),
    },
    visualStyle: profile.visualStyle,
  };
}

/** Minimum viable answers before a DNA can be generated. */
export function validateProfile(profile: Profile): string[] {
  const problems: string[] = [];
  if (!profile.nickname.trim()) problems.push('Nickname is required.');
  if (profile.nickname.trim().length > 40) problems.push('Nickname must be 40 characters or fewer.');
  if (profile.bio.length > 280) problems.push('Bio must be 280 characters or fewer.');
  if (profile.role.length > 60) problems.push('Role must be 60 characters or fewer.');
  if (profile.field.length > 60) problems.push('Field must be 60 characters or fewer.');
  if (profile.interests.length < 1) problems.push('Pick at least one interest.');
  if (profile.interests.length > 30) problems.push('At most 30 interests.');
  if (profile.skills.length < 1) problems.push('Pick at least one skill.');
  if (profile.skills.length > 30) problems.push('At most 30 skills.');
  if (profile.creative.outputs.length < 1) problems.push('Choose at least one thing you like to create.');
  return problems;
}

export function profileCompleteness(profile: Profile): number {
  const checks = [
    profile.nickname.trim().length > 0,
    profile.bio.trim().length > 0,
    profile.role.trim().length > 0 || profile.field.trim().length > 0,
    profile.interests.length >= 3,
    profile.skills.length >= 2,
    profile.creative.outputs.length >= 1,
    profile.habits.platforms.length + profile.habits.tools.length >= 2,
    true, // visual style always has a default
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

/** Truncate + strip control characters from free text before it reaches storage or the SVG. */
export function tidyText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

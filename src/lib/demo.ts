/**
 * Two clearly-labelled Demo profiles used by Compare when the visitor has only
 * one DNA of their own. These are authored example answers, not real people and
 * not scraped data — the UI marks them "Demo" everywhere they appear.
 */

import type { Profile } from './types';
import { generateDna } from './engine';

function demoProfile(partial: Partial<Profile> & Pick<Profile, 'id' | 'nickname'>): Profile {
  const now = '2026-01-01T00:00:00.000Z';
  return {
    id: partial.id,
    salt: `dem-${partial.id}`,
    nickname: partial.nickname,
    bio: partial.bio ?? '',
    role: partial.role ?? '',
    field: partial.field ?? '',
    avatar: null,
    interests: partial.interests ?? [],
    skills: partial.skills ?? [],
    creative: partial.creative ?? {
      outputs: ['products'],
      workStyle: 'hybrid',
      exploration: 'balanced',
      thinking: 'logic',
      pace: 'mixed',
    },
    habits: partial.habits ?? {
      platforms: [],
      tools: [],
      contentTypes: [],
      products: [],
      activities: [],
    },
    visualStyle: partial.visualStyle ?? 'futuristic',
    visibility: 'public',
    createdAt: now,
    updatedAt: now,
  };
}

export const DEMO_PROFILES: Profile[] = [
  demoProfile({
    id: 'demo-helix',
    nickname: 'Nova Lin',
    role: 'Product engineer',
    field: 'Developer tools',
    bio: 'Demo profile. Builds small tools, reads papers at 2am, ships on weekends.',
    interests: [
      { id: 'technology', label: 'Technology', intensity: 5 },
      { id: 'ai', label: 'AI', intensity: 5 },
      { id: 'programming', label: 'Programming', intensity: 4 },
      { id: 'science', label: 'Science', intensity: 3 },
      { id: 'design', label: 'Design', intensity: 3 },
      { id: 'writing', label: 'Writing', intensity: 2 },
    ],
    skills: [
      { id: 'programming', label: 'Programming', level: 'expert' },
      { id: 'product-building', label: 'Product Building', level: 'advanced' },
      { id: 'ai-tools', label: 'AI Tools', level: 'advanced' },
      { id: 'data-analysis', label: 'Data Analysis', level: 'intermediate' },
      { id: 'writing', label: 'Writing', level: 'intermediate' },
    ],
    creative: {
      outputs: ['systems', 'products', 'knowledge'],
      workStyle: 'solo',
      exploration: 'explore',
      thinking: 'logic',
      pace: 'sprint',
    },
    habits: {
      platforms: ['github', 'x', 'reddit'],
      tools: ['vscode', 'cursor', 'terminal', 'notion'],
      contentTypes: ['code-repos', 'research-papers', 'long-form'],
      products: ['laptop', 'mech-keyboard', 'ereader'],
      activities: ['coding', 'reading', 'researching'],
    },
    visualStyle: 'futuristic',
  }),
  demoProfile({
    id: 'demo-palette',
    nickname: 'Iris Vale',
    role: 'Design lead',
    field: 'Brand & motion',
    bio: 'Demo profile. Draws interfaces, collects typefaces, runs a small studio.',
    interests: [
      { id: 'design', label: 'Design', intensity: 5 },
      { id: 'art', label: 'Art', intensity: 4 },
      { id: 'photography', label: 'Photography', intensity: 4 },
      { id: 'music', label: 'Music', intensity: 3 },
      { id: 'internet-culture', label: 'Internet Culture', intensity: 3 },
      { id: 'technology', label: 'Technology', intensity: 2 },
    ],
    skills: [
      { id: 'design', label: 'Design', level: 'expert' },
      { id: 'communication', label: 'Communication', level: 'advanced' },
      { id: 'video-editing', label: 'Video Editing', level: 'advanced' },
      { id: 'marketing', label: 'Marketing', level: 'intermediate' },
      { id: 'programming', label: 'Programming', level: 'beginner' },
    ],
    creative: {
      outputs: ['visuals', 'stories', 'experiments'],
      workStyle: 'team',
      exploration: 'deepen',
      thinking: 'visual',
      pace: 'marathon',
    },
    habits: {
      platforms: ['instagram', 'x', 'youtube'],
      tools: ['figma', 'photoshop', 'miro', 'spotify'],
      contentTypes: ['design-portfolios', 'short-video', 'documentaries'],
      products: ['tablet', 'camera', 'headphones'],
      activities: ['designing', 'watching', 'listening'],
    },
    visualStyle: 'abstract',
  }),
];

export const DEMO_RESULTS = DEMO_PROFILES.map((profile) => ({
  profile,
  result: generateDna(profile, 1, profile.createdAt),
}));

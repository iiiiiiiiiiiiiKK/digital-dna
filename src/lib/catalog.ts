import type { CreativeOutput, VisualStyleId } from './types';

export interface CatalogEntry {
  id: string;
  label: string;
  /** Short descriptor shown on the option chip. */
  hint?: string;
}

export const INTEREST_CATALOG: CatalogEntry[] = [
  { id: 'technology', label: 'Technology' },
  { id: 'ai', label: 'AI' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'finance', label: 'Finance' },
  { id: 'design', label: 'Design' },
  { id: 'art', label: 'Art' },
  { id: 'music', label: 'Music' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'science', label: 'Science' },
  { id: 'business', label: 'Business' },
  { id: 'writing', label: 'Writing' },
  { id: 'photography', label: 'Photography' },
  { id: 'education', label: 'Education' },
  { id: 'travel', label: 'Travel' },
  { id: 'sports', label: 'Sports' },
  { id: 'history', label: 'History' },
  { id: 'psychology', label: 'Psychology' },
  { id: 'programming', label: 'Programming' },
  { id: 'internet-culture', label: 'Internet Culture' },
  { id: 'entrepreneurship', label: 'Entrepreneurship' },
];

export const SKILL_CATALOG: CatalogEntry[] = [
  { id: 'programming', label: 'Programming' },
  { id: 'writing', label: 'Writing' },
  { id: 'design', label: 'Design' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'trading', label: 'Trading' },
  { id: 'research', label: 'Research' },
  { id: 'video-editing', label: 'Video Editing' },
  { id: 'data-analysis', label: 'Data Analysis' },
  { id: 'communication', label: 'Communication' },
  { id: 'product-building', label: 'Product Building' },
  { id: 'ai-tools', label: 'AI Tools' },
  { id: 'language-learning', label: 'Language Learning' },
];

export const PLATFORM_CATALOG: CatalogEntry[] = [
  { id: 'x', label: 'X / Twitter' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'github', label: 'GitHub' },
  { id: 'bilibili', label: 'Bilibili' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'discord', label: 'Discord' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'wechat', label: 'WeChat' },
  { id: 'xiaohongshu', label: 'Xiaohongshu' },
  { id: 'douyin', label: 'Douyin' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'substack', label: 'Substack' },
  { id: 'notion', label: 'Notion' },
];

export const TOOL_CATALOG: CatalogEntry[] = [
  { id: 'vscode', label: 'VS Code' },
  { id: 'figma', label: 'Figma' },
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'claude', label: 'Claude' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'notion', label: 'Notion' },
  { id: 'obsidian', label: 'Obsidian' },
  { id: 'excel', label: 'Excel' },
  { id: 'photoshop', label: 'Photoshop' },
  { id: 'premiere', label: 'Premiere' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'miro', label: 'Miro' },
  { id: 'trello', label: 'Trello' },
  { id: 'spotify', label: 'Spotify' },
];

export const CONTENT_CATALOG: CatalogEntry[] = [
  { id: 'long-form', label: 'Long-form articles' },
  { id: 'short-video', label: 'Short video' },
  { id: 'podcasts', label: 'Podcasts' },
  { id: 'research-papers', label: 'Research papers' },
  { id: 'news', label: 'News' },
  { id: 'manga', label: 'Manga & anime' },
  { id: 'documentaries', label: 'Documentaries' },
  { id: 'code-repos', label: 'Code repositories' },
  { id: 'design-portfolios', label: 'Design portfolios' },
  { id: 'data-reports', label: 'Data & reports' },
  { id: 'memes', label: 'Memes' },
  { id: 'courses', label: 'Courses' },
];

export const PRODUCT_CATALOG: CatalogEntry[] = [
  { id: 'phone', label: 'Smartphone' },
  { id: 'laptop', label: 'Laptop' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'ereader', label: 'E-reader' },
  { id: 'camera', label: 'Camera' },
  { id: 'console', label: 'Game console' },
  { id: 'headphones', label: 'Headphones' },
  { id: 'smartwatch', label: 'Smartwatch' },
  { id: 'mech-keyboard', label: 'Mechanical keyboard' },
  { id: 'drone', label: 'Drone' },
  { id: 'nas', label: 'Home server / NAS' },
  { id: 'vr', label: 'VR headset' },
];

export const ACTIVITY_CATALOG: CatalogEntry[] = [
  { id: 'reading', label: 'Reading' },
  { id: 'writing', label: 'Writing' },
  { id: 'coding', label: 'Coding' },
  { id: 'designing', label: 'Designing' },
  { id: 'watching', label: 'Watching' },
  { id: 'listening', label: 'Listening' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'researching', label: 'Researching' },
  { id: 'chatting', label: 'Chatting' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'learning', label: 'Learning' },
  { id: 'building', label: 'Building side projects' },
];

export const CREATIVE_OUTPUT_OPTIONS: { id: CreativeOutput; label: string; hint: string }[] = [
  { id: 'products', label: 'Products', hint: 'Things people can use' },
  { id: 'stories', label: 'Stories', hint: 'Words, narratives, scripts' },
  { id: 'visuals', label: 'Visuals', hint: 'Images, interfaces, motion' },
  { id: 'systems', label: 'Systems', hint: 'Tools, code, structures' },
  { id: 'knowledge', label: 'Knowledge', hint: 'Guides, teaching, research' },
  { id: 'experiments', label: 'Experiments', hint: 'Prototypes and trials' },
];

export const WORK_STYLE_OPTIONS = [
  { id: 'solo', label: 'Mostly on my own', hint: 'Deep, uninterrupted focus' },
  { id: 'team', label: 'With a team', hint: 'Ideas grow in conversation' },
  { id: 'hybrid', label: 'Both, depending on the task', hint: 'Mixed rhythm' },
] as const;

export const EXPLORATION_OPTIONS = [
  { id: 'explore', label: 'Explore something new', hint: 'I like starting from zero' },
  { id: 'deepen', label: 'Go deeper into what I know', hint: 'Depth over breadth' },
  { id: 'balanced', label: 'A bit of both', hint: 'Balanced curiosity' },
] as const;

export const THINKING_OPTIONS = [
  { id: 'visual', label: 'Visually', hint: 'Images, layout, shape' },
  { id: 'text', label: 'In words', hint: 'Writing, narrative, phrasing' },
  { id: 'logic', label: 'In logic', hint: 'Rules, structure, proofs' },
  { id: 'hands-on', label: 'By doing', hint: 'Build first, understand later' },
] as const;

export const PACE_OPTIONS = [
  { id: 'sprint', label: 'Quick experiments', hint: 'Ship fast, iterate' },
  { id: 'marathon', label: 'Long-term polishing', hint: 'Slow and lasting' },
  { id: 'mixed', label: 'Depends on the project', hint: 'Adaptive pace' },
] as const;

export interface VisualStyleMeta {
  id: VisualStyleId;
  label: string;
  hint: string;
  /** Swatch gradient used by the picker. */
  swatch: [string, string, string];
}

export const VISUAL_STYLES: VisualStyleMeta[] = [
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    hint: 'Neon rain, dense circuitry',
    swatch: ['#0b0418', '#ff2bd1', '#22e6ff'],
  },
  {
    id: 'minimal',
    label: 'Minimal',
    hint: 'Quiet lines, lots of air',
    swatch: ['#0b0d10', '#e7ecf3', '#7d8899'],
  },
  {
    id: 'futuristic',
    label: 'Futuristic',
    hint: 'Clean glass and light',
    swatch: ['#040a16', '#5bc8ff', '#9d7bff'],
  },
  {
    id: 'retro',
    label: 'Retro',
    hint: 'CRT greens and amber',
    swatch: ['#0a0d08', '#8dff8d', '#ffb35c'],
  },
  {
    id: 'abstract',
    label: 'Abstract',
    hint: 'Organic colour fields',
    swatch: ['#0a0714', '#b14bff', '#ff9d4b'],
  },
  {
    id: 'organic',
    label: 'Organic',
    hint: 'Soft gradients, living curves',
    swatch: ['#06110d', '#4be6a1', '#a7ff8d'],
  },
  {
    id: 'neon',
    label: 'Neon',
    hint: 'High-voltage saturation',
    swatch: ['#06010c', '#39ff14', '#ff1f6f'],
  },
  {
    id: 'monochrome',
    label: 'Monochrome',
    hint: 'Grayscale precision',
    swatch: ['#08090b', '#d8dee9', '#6b7280'],
  },
];

export const SKILL_LEVELS = [
  { id: 'beginner', label: 'Beginner', percent: 25, hint: 'Self-assessed: just started' },
  { id: 'intermediate', label: 'Intermediate', percent: 50, hint: 'Self-assessed: comfortable' },
  { id: 'advanced', label: 'Advanced', percent: 75, hint: 'Self-assessed: strong' },
  { id: 'expert', label: 'Expert', percent: 100, hint: 'Self-assessed: expert' },
] as const;

export const INTENSITY_LABELS: Record<number, string> = {
  1: 'Curious',
  2: 'Interested',
  3: 'Keen',
  4: 'Passionate',
  5: 'Obsessed',
};

/** Lookup helper used everywhere so labels stay in sync with ids. */
export function labelFor(catalog: CatalogEntry[], id: string, fallback?: string): string {
  return catalog.find((c) => c.id === id)?.label ?? fallback ?? id;
}

export const ALL_CATALOGS: Record<string, CatalogEntry[]> = {
  platform: PLATFORM_CATALOG,
  tool: TOOL_CATALOG,
  content: CONTENT_CATALOG,
  product: PRODUCT_CATALOG,
  activity: ACTIVITY_CATALOG,
  interest: INTEREST_CATALOG,
  skill: SKILL_CATALOG,
};

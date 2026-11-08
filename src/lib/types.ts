/**
 * Core domain types for Digital DNA.
 *
 * Design rule: every stored value is something the user themselves supplied.
 * Nothing here is ever inferred as a psychological measurement — derived
 * numbers are documented transforms of the answers (see lib/engine.ts).
 */

export type InterestIntensity = 1 | 2 | 3 | 4 | 5;

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface InterestItem {
  /** Stable catalog id, or `custom:<slug>` for user-added entries. */
  id: string;
  label: string;
  intensity: InterestIntensity;
  custom?: boolean;
}

export interface SkillItem {
  id: string;
  label: string;
  level: SkillLevel;
  custom?: boolean;
}

export type CreativeOutput =
  | 'products'
  | 'stories'
  | 'visuals'
  | 'systems'
  | 'knowledge'
  | 'experiments';

export type WorkStyle = 'solo' | 'team' | 'hybrid';
export type ExplorationStyle = 'explore' | 'deepen' | 'balanced';
export type ThinkingMode = 'visual' | 'text' | 'logic' | 'hands-on';
export type PaceStyle = 'sprint' | 'marathon' | 'mixed';

export interface CreativeGenes {
  /** What the user most likes to make. */
  outputs: CreativeOutput[];
  workStyle: WorkStyle;
  exploration: ExplorationStyle;
  thinking: ThinkingMode;
  pace: PaceStyle;
}

export interface DigitalHabits {
  platforms: string[];
  tools: string[];
  contentTypes: string[];
  products: string[];
  activities: string[];
}

export type VisualStyleId =
  | 'cyberpunk'
  | 'minimal'
  | 'futuristic'
  | 'retro'
  | 'abstract'
  | 'organic'
  | 'neon'
  | 'monochrome';

export interface Profile {
  id: string;
  /** Rotating salt created once per profile so DNA codes cannot collide across profiles. */
  salt: string;
  nickname: string;
  bio: string;
  role: string;
  field: string;
  /** Optional avatar as a data URL. Never uploaded anywhere. */
  avatar: string | null;
  interests: InterestItem[];
  skills: SkillItem[];
  creative: CreativeGenes;
  habits: DigitalHabits;
  visualStyle: VisualStyleId;
  visibility: 'private' | 'public';
  createdAt: string;
  updatedAt: string;
}

export interface GeneValue {
  id: string;
  label: string;
  /** 0–100, documented transform of the user's own answer. */
  percent: number;
  /** Raw answer kept beside the derived value for full transparency. */
  raw: string;
  custom?: boolean;
}

export interface DnaDimension {
  id: string;
  label: string;
  hint: string;
  percent: number;
}

export interface HelixParameters {
  rungs: number;
  turns: number;
  amplitude: number;
  phase: number;
  twist: number;
  baseRadius: number;
  strandWidth: number;
  branchCount: number;
  branchWeight: number;
  particleCount: number;
  particleSpread: number;
  glow: number;
  /** 0 = straight ladder, 1 = full braid. Derived from creative genes. */
  braid: number;
  /** Deterministic jitter seed so two runs never differ. */
  jitter: number[];
}

export interface Palette {
  background: string;
  backgroundAlt: string;
  strandA: string;
  strandB: string;
  accent: string;
  accentSoft: string;
  text: string;
  textMuted: string;
  rungColors: string[];
}

export interface DnaArchetype {
  title: string;
  subtitle: string;
  description: string;
}

export interface DnaResult {
  /** Public identity number, e.g. DNA-7F2A91. */
  dnaCode: string;
  /** uint32 hash of the canonical answer payload. */
  seed: number;
  /** 16 hex chars of the canonical hash — reproducible fingerprint. */
  hash: string;
  /** Profile version number this result was generated for. */
  version: number;
  generatedAt: string;
  palette: Palette;
  helix: HelixParameters;
  interestGenes: GeneValue[];
  skillGenes: GeneValue[];
  dimensions: DnaDimension[];
  tagCloud: { label: string; weight: number }[];
  /** Bipartite interest ↔ skill links used by the association graph. */
  links: { from: string; to: string; strength: number }[];
  creativeSummary: { label: string; value: string }[];
  habitSummary: { label: string; values: string[] }[];
  tags: string[];
  archetype: DnaArchetype;
  summary: string;
}

export interface DnaVersion {
  id: string;
  profileId: string;
  version: number;
  dnaCode: string;
  generatedAt: string;
  /** Snapshot so Evolution always shows what was actually answered. */
  profile: Profile;
  result: DnaResult;
}

export type ShareMode = 'private' | 'public';

export interface AiSettings {
  enabled: boolean;
  baseUrl: string;
  model: string;
  /** Stored only in this browser's IndexedDB; never bundled or uploaded. */
  apiKey: string;
}

export interface AppSettings {
  id: 'app';
  ai: AiSettings;
}

export interface AiInsight {
  text: string;
  suggestedTags: string[];
  createdAt: string;
  model: string;
}

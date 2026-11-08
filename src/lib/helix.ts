/**
 * Pure geometry for the DNA helix.
 *
 * Kept separate from React so the exact same path data is used by:
 *   - the on-screen SVG renderer
 *   - the PNG export renderer (same math, drawn to a canvas-sized SVG)
 *   - unit tests (determinism + difference checks)
 *
 * The helix is a standard double spiral: two strands 180° out of phase, with
 * rungs connecting them. Every parameter below comes from `DnaResult.helix`,
 * which is itself a documented transform of the user's answers.
 */

import type { HelixParameters, Palette } from './types';

export const HELIX_VIEWBOX = { width: 1000, height: 640 };

export interface Point {
  x: number;
  y: number;
  /** Depth term 0..1 — used for radius scaling so the twist reads in 2D. */
  z: number;
}

export interface StrandGeometry {
  pathA: string;
  pathB: string;
  pointsA: Point[];
  pointsB: Point[];
}

export interface Rung {
  index: number;
  from: Point;
  to: Point;
  mid: Point;
  /** 0..1 depth of the midpoint, used for opacity. */
  depth: number;
  color: string;
  radius: number;
  opacity: number;
}

export interface Branch {
  index: number;
  from: Point;
  to: Point;
  control: Point;
  width: number;
  opacity: number;
  color: string;
  length: number;
}

export interface Particle {
  x: number;
  y: number;
  r: number;
  opacity: number;
  color: string;
}

export interface HelixScene {
  strands: StrandGeometry;
  rungs: Rung[];
  branches: Branch[];
  particles: Particle[];
}

const SAMPLES = 260;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Build the full scene. `rungColors` cycles through the palette colours derived
 * from the user's own interest domains.
 */
export function buildHelixScene(helix: HelixParameters, palette: Palette): HelixScene {
  const { width, height } = HELIX_VIEWBOX;
  const cx = width / 2;
  const marginTop = 56;
  const marginBottom = 46;
  const usableHeight = height - marginTop - marginBottom;

  // Amplitude is capped so the widest sweep always fits inside the viewBox.
  const maxAmplitude = Math.min(helix.amplitude * 3.2, width / 2 - 120);
  const amplitude = Math.max(60, maxAmplitude);

  const pointsA: Point[] = [];
  const pointsB: Point[] = [];

  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const y = marginTop + usableHeight * t;
    const angle = helix.phase + t * Math.PI * 2 * helix.turns * helix.twist;
    const taper = Math.sin(Math.PI * Math.min(1, Math.max(0, t))) ** 0.55;
    // `braid` controls how strongly the two strands cross: 1 = full braid,
    // lower values flatten the helix into a ladder-like ribbon.
    const spread = amplitude * (0.55 + helix.braid * 0.45) * taper;
    const zx = Math.cos(angle);
    const zy = Math.sin(angle);
    pointsA.push({ x: cx + zx * spread, y, z: (zy + 1) / 2 });
    pointsB.push({ x: cx - zx * spread, y, z: ((-zy + 1) / 2) });
  }

  const pathA = smoothPath(pointsA);
  const pathB = smoothPath(pointsB);

  const rungs: Rung[] = [];
  const rungCount = Math.max(8, Math.min(helix.rungs, 60));
  for (let i = 0; i < rungCount; i++) {
    const t = (i + 0.5) / rungCount;
    const idx = Math.round(t * SAMPLES);
    const from = pointsA[Math.min(idx, SAMPLES)];
    const to = pointsB[Math.min(idx, SAMPLES)];
    const depth = (from.z + to.z) / 2;
    const mid = {
      x: (from.x + to.x) / 2,
      y: (from.y + to.y) / 2,
      z: depth,
    };
    // Jitter keeps the ladder from looking mechanically even, but is seeded so
    // it is identical on every render for the same answers.
    const jitter = helix.jitter[i % helix.jitter.length] ?? 0.5;
    const radius = helix.baseRadius * (0.6 + depth * 0.8) * (0.85 + jitter * 0.4);
    rungs.push({
      index: i,
      from,
      to,
      mid,
      depth,
      color: palette.rungColors[i % palette.rungColors.length] ?? palette.accent,
      radius,
      opacity: 0.34 + depth * 0.62,
    });
  }

  const branches: Branch[] = [];
  const branchCount = Math.max(0, Math.min(helix.branchCount, 26));
  for (let i = 0; i < branchCount; i++) {
    const t = (i + 0.5) / branchCount;
    const idx = Math.min(SAMPLES, Math.round(t * SAMPLES));
    const base = pointsA[idx];
    const side = i % 2 === 0 ? 1 : -1;
    const jitter = helix.jitter[(i + 7) % helix.jitter.length] ?? 0.5;
    const length = (28 + jitter * 54) * (0.7 + helix.branchWeight / 8);
    const angle = -Math.PI / 2 + side * (0.55 + jitter * 0.5);
    const to: Point = {
      x: base.x + Math.cos(angle) * length * (base.x < cx ? -1 : 1),
      y: base.y + Math.sin(angle) * length * 0.6,
      z: base.z,
    };
    const control: Point = {
      x: lerp(base.x, to.x, 0.55) + side * 14,
      y: lerp(base.y, to.y, 0.55) - 8,
      z: base.z,
    };
    branches.push({
      index: i,
      from: base,
      to,
      control,
      width: 0.9 + helix.branchWeight * 0.42,
      opacity: 0.24 + base.z * 0.4,
      color: palette.rungColors[(i + 3) % palette.rungColors.length] ?? palette.accent,
      length,
    });
  }

  const particles: Particle[] = [];
  for (let i = 0; i < Math.min(helix.particleCount, 200); i++) {
    const a = helix.jitter[i % helix.jitter.length] ?? 0.5;
    const b = helix.jitter[(i * 7 + 3) % helix.jitter.length] ?? 0.5;
    const c = helix.jitter[(i * 13 + 5) % helix.jitter.length] ?? 0.5;
    const spread = helix.particleSpread * (0.35 + c * 0.9);
    const angle = a * Math.PI * 2;
    const distance = spread * (0.5 + b * 1.4);
    particles.push({
      x: cx + Math.cos(angle) * distance * 1.9,
      y: marginTop + usableHeight * c + Math.sin(angle) * distance * 0.55,
      r: 0.7 + b * 2.1,
      opacity: 0.08 + a * 0.34,
      color: palette.rungColors[i % palette.rungColors.length] ?? palette.accent,
    });
  }

  return { strands: { pathA, pathB, pointsA, pointsB }, rungs, branches, particles };
}

/** Catmull-Rom → cubic Bézier so the strand reads as one continuous curve. */
export function smoothPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${round(points[0].x)} ${round(points[0].y)}`;
  let d = `M ${round(points[0].x)} ${round(points[0].y)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${round(c1x)} ${round(c1y)}, ${round(c2x)} ${round(c2y)}, ${round(p2.x)} ${round(p2.y)}`;
  }
  return d;
}

function round(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Quadratic branch path. */
export function branchPath(branch: Branch): string {
  return `M ${round(branch.from.x)} ${round(branch.from.y)} Q ${round(branch.control.x)} ${round(branch.control.y)} ${round(branch.to.x)} ${round(branch.to.y)}`;
}

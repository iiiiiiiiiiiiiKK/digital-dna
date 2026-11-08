/**
 * PNG export.
 *
 * The exporter re-renders the helix from the same geometry module used on
 * screen, into a self-contained SVG string, then rasterises it through an
 * Image → Canvas pipeline. Because the SVG is built with absolute coordinates
 * and system font stacks only, the output never depends on webfonts being
 * loaded and text never drifts or clips.
 */

import type { DnaResult, Profile } from './types';
import { buildHelixScene, branchPath, HELIX_VIEWBOX } from './helix';

export type ExportFormat = 'square' | 'poster';

export interface ExportOptions {
  profile: Profile;
  result: DnaResult;
  format: ExportFormat;
  /** Rendered at 2× for crisp text on retina displays and in social previews. */
  scale?: number;
}

export const EXPORT_SIZES: Record<ExportFormat, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  poster: { width: 1080, height: 1920 },
};

const FONT_STACK =
  "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif";

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

/** Inline helix markup scaled into a target box without any external assets. */
function helixMarkup(result: DnaResult, x: number, y: number, w: number, h: number, idPrefix: string): string {
  const scene = buildHelixScene(result.helix, result.palette);
  const { width: vbW, height: vbH } = HELIX_VIEWBOX;
  const scale = Math.min(w / vbW, h / vbH);
  const tx = x + (w - vbW * scale) / 2;
  const ty = y + (h - vbH * scale) / 2;
  const { palette, helix } = result;

  const particles = scene.particles
    .map((p) => `<circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="${p.color}" opacity="${p.opacity.toFixed(3)}"/>`)
    .join('');

  const branches = scene.branches
    .map(
      (b) =>
        `<path d="${branchPath(b)}" stroke="${b.color}" stroke-width="${b.width}" stroke-linecap="round" fill="none" opacity="${b.opacity.toFixed(3)}"/>`
    )
    .join('');

  const rungs = scene.rungs
    .map(
      (r) =>
        `<g opacity="${r.opacity.toFixed(3)}"><line x1="${r.from.x}" y1="${r.from.y}" x2="${r.to.x}" y2="${r.to.y}" stroke="${r.color}" stroke-width="${(1.1 + r.radius * 0.32).toFixed(2)}" stroke-linecap="round" opacity="0.7"/><circle cx="${r.mid.x}" cy="${r.mid.y}" r="${r.radius.toFixed(2)}" fill="${r.color}"/></g>`
    )
    .join('');

  return `<g transform="translate(${tx} ${ty}) scale(${scale})">
    <defs>
      <linearGradient id="${idPrefix}-sa" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${palette.strandA}" stop-opacity="0.15"/>
        <stop offset="22%" stop-color="${palette.strandA}" stop-opacity="1"/>
        <stop offset="78%" stop-color="${palette.strandA}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${palette.strandA}" stop-opacity="0.15"/>
      </linearGradient>
      <linearGradient id="${idPrefix}-sb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${palette.strandB}" stop-opacity="0.15"/>
        <stop offset="22%" stop-color="${palette.strandB}" stop-opacity="1"/>
        <stop offset="78%" stop-color="${palette.strandB}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${palette.strandB}" stop-opacity="0.15"/>
      </linearGradient>
    </defs>
    <g opacity="0.9">${particles}</g>
    <g>${branches}</g>
    <g>${rungs}</g>
    <path d="${scene.strands.pathA}" fill="none" stroke="url(#${idPrefix}-sa)" stroke-width="${(helix.strandWidth * 2).toFixed(2)}" stroke-linecap="round" opacity="0.5"/>
    <path d="${scene.strands.pathA}" fill="none" stroke="${palette.strandA}" stroke-width="${helix.strandWidth.toFixed(2)}" stroke-linecap="round"/>
    <path d="${scene.strands.pathB}" fill="none" stroke="url(#${idPrefix}-sb)" stroke-width="${(helix.strandWidth * 2).toFixed(2)}" stroke-linecap="round" opacity="0.45"/>
    <path d="${scene.strands.pathB}" fill="none" stroke="${palette.strandB}" stroke-width="${helix.strandWidth.toFixed(2)}" stroke-linecap="round"/>
  </g>`;
}

function pill(text: string, x: number, y: number, color: string, fontSize: number): { svg: string; width: number } {
  // Approximate width so neighbours can be placed without measuring text.
  const width = Math.round(text.length * fontSize * 0.62 + fontSize * 1.6);
  const height = Math.round(fontSize * 2.1);
  return {
    width,
    svg: `<g><rect x="${x}" y="${y - height / 2}" rx="${height / 2}" width="${width}" height="${height}" fill="${color}" fill-opacity="0.14" stroke="${color}" stroke-opacity="0.42"/><text x="${x + width / 2}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="${FONT_STACK}" font-size="${fontSize}" font-weight="600" fill="${color}">${esc(text)}</text></g>`,
  };
}

/** Build the standalone SVG document string for a card. */
export function buildCardSvg({ profile, result, format }: ExportOptions): string {
  const { width, height } = EXPORT_SIZES[format];
  const p = result.palette;
  const isPoster = format === 'poster';

  const interestTags = result.interestGenes.slice(0, isPoster ? 8 : 5);
  const skillTags = result.skillGenes.slice(0, isPoster ? 6 : 4);

  let y = isPoster ? 168 : 132;
  const pillsTop = y;
  let cursor = 64;
  let pillsSvg = '';
  for (const tag of interestTags) {
    if (cursor > width - 120) break;
    const chip = pill(tag.label, cursor, pillsTop, p.accent, isPoster ? 26 : 22);
    pillsSvg += chip.svg;
    cursor += chip.width + 14;
  }

  const skillRowY = pillsTop + (isPoster ? 84 : 66);
  cursor = 64;
  let skillSvg = '';
  for (const tag of skillTags) {
    if (cursor > width - 120) break;
    const chip = pill(tag.label, cursor, skillRowY, p.strandB, isPoster ? 24 : 20);
    skillSvg += chip.svg;
    cursor += chip.width + 14;
  }

  const helixBox = isPoster
    ? { x: 40, y: 330, w: 1000, h: 900 }
    : { x: 30, y: 300, w: 1020, h: 470 };

  const footerY = height - (isPoster ? 150 : 96);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.background}"/>
      <stop offset="48%" stop-color="${p.backgroundAlt}"/>
      <stop offset="100%" stop-color="${p.background}"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.36" r="0.62">
      <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${p.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#halo)"/>

  <text x="64" y="86" font-family="${FONT_STACK}" font-size="${isPoster ? 26 : 22}" font-weight="700" letter-spacing="9" fill="${p.accent}">DIGITAL DNA</text>
  <text x="${width - 64}" y="86" text-anchor="end" font-family="${FONT_STACK}" font-size="${isPoster ? 22 : 18}" font-weight="600" letter-spacing="3" fill="${p.textMuted}">${esc(result.dnaCode)}</text>
  <line x1="64" y1="${isPoster ? 112 : 104}" x2="${width - 64}" y2="${isPoster ? 112 : 104}" stroke="${p.textMuted}" stroke-opacity="0.28"/>

  <text x="64" y="${isPoster ? 232 : 176}" font-family="${FONT_STACK}" font-size="${isPoster ? 58 : 46}" font-weight="700" fill="${p.text}">${esc(truncate(profile.nickname || 'Unnamed', 22))}</text>
  <text x="64" y="${isPoster ? 268 : 200}" font-family="${FONT_STACK}" font-size="${isPoster ? 24 : 20}" fill="${p.textMuted}">${esc(truncate(profile.role || profile.field || result.archetype.title, 46))}</text>

  ${pillsSvg}
  ${skillSvg}

  ${helixMarkup(result, helixBox.x, helixBox.y, helixBox.w, helixBox.h, 'card')}

  ${
    isPoster
      ? `<text x="64" y="${isPoster ? 1280 : 0}" font-family="${FONT_STACK}" font-size="26" font-weight="600" fill="${p.accent}">${esc(truncate(result.archetype.title, 40))}</text>
         <text x="64" y="${isPoster ? 1324 : 0}" font-family="${FONT_STACK}" font-size="20" fill="${p.textMuted}">${esc(truncate(result.archetype.subtitle, 58))}</text>
         <text x="64" y="${isPoster ? 1388 : 0}" font-family="${FONT_STACK}" font-size="19" fill="${p.textMuted}">${esc(truncate(result.summary, 96))}</text>
         <text x="64" y="${isPoster ? 1436 : 0}" font-family="${FONT_STACK}" font-size="19" fill="${p.textMuted}">${esc(truncate(result.summary.slice(96), 96))}</text>`
      : ''
  }

  <line x1="64" y1="${footerY - 46}" x2="${width - 64}" y2="${footerY - 46}" stroke="${p.textMuted}" stroke-opacity="0.22"/>
  <text x="64" y="${footerY}" font-family="${FONT_STACK}" font-size="${isPoster ? 22 : 18}" fill="${p.textMuted}">Your Identity. Your Digital DNA.</text>
  <text x="${width - 64}" y="${footerY}" text-anchor="end" font-family="${FONT_STACK}" font-size="${isPoster ? 22 : 18}" fill="${p.textMuted}">${esc(new Date(result.generatedAt).toISOString().slice(0, 10))}</text>
</svg>`;
}

/** Rasterise the card SVG into a PNG blob. */
export async function renderCardPng(options: ExportOptions): Promise<Blob> {
  const svg = buildCardSvg(options);
  const { width, height } = EXPORT_SIZES[options.format];
  const scale = options.scale ?? 1;

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is unavailable in this browser.');
    ctx.fillStyle = options.result.palette.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const png = await canvasToBlob(canvas);
    return png;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not rasterise the card image.'));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG encoding failed.'));
    }, 'image/png');
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function exportFilename(profile: Profile, result: DnaResult, format: ExportFormat): string {
  const safe = (profile.nickname || 'digital-dna').replace(/[^\w\u4e00-\u9fa5-]+/g, '-').replace(/^-+|-+$/g, '');
  return `${safe || 'digital-dna'}-${result.dnaCode}-${format}.png`;
}

import { useMemo } from 'react';
import type { GeneValue, Palette } from '../../lib/types';

interface Props {
  genes: GeneValue[];
  palette: Palette;
  max?: number;
  className?: string;
}

/**
 * Ring distribution: each gene becomes an arc whose sweep is its percentage.
 * Colours cycle through the palette so the ring echoes the helix.
 */
export function RingChart({ genes, palette, max = 10, className }: Props) {
  const size = 360;
  const cx = size / 2;
  const cy = size / 2;
  const outer = size / 2 - 8;
  const items = genes.slice(0, max);

  const arcs = useMemo(() => {
    const total = items.reduce((s, g) => s + g.percent, 0) || 1;
    let cursor = -Math.PI / 2;
    const gap = items.length > 1 ? 0.035 : 0;
    return items.map((g, i) => {
      const sweep = (g.percent / total) * (Math.PI * 2 - gap * items.length);
      const start = cursor;
      const end = cursor + sweep;
      cursor = end + gap;
      const color = palette.rungColors[i % palette.rungColors.length] ?? palette.accent;
      return { gene: g, color, d: arcPath(cx, cy, outer - (i % 2) * 16, start, end) };
    });
  }, [items, palette, cx, cy, outer]);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} role="img" aria-label="Gene distribution ring">
      <circle cx={cx} cy={cy} r={outer + 4} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      {arcs.map(({ gene, color, d }) => (
        <path key={gene.id} d={d} fill="none" stroke={color} strokeWidth={13} strokeLinecap="round" opacity={0.92} />
      ))}
      <circle cx={cx} cy={cy} r={outer - 42} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={13} fill={palette.textMuted} fontWeight={600}>
        {items.length}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fill={palette.textMuted} opacity={0.7}>
        genes
      </text>
    </svg>
  );
}

function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number): string {
  const sweep = end - start;
  if (sweep <= 0.0001) return '';
  const largeArc = sweep > Math.PI ? 1 : 0;
  const p0 = polar(cx, cy, r, start);
  const p1 = polar(cx, cy, r, end);
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
}

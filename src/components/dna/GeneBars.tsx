import { useMemo } from 'react';
import type { GeneValue, Palette } from '../../lib/types';

interface Props {
  genes: GeneValue[];
  palette: Palette;
  className?: string;
}

/**
 * Horizontal gene bars. Deliberately *not* a card grid: the bars are the layout,
 * with the label and the raw self-rated answer shown next to each value so the
 * number always has a visible origin.
 */
export function GeneBars({ genes, palette, className }: Props) {
  const max = useMemo(() => Math.max(1, ...genes.map((g) => g.percent)), [genes]);

  if (genes.length === 0) {
    return <p className="muted text-sm">Nothing selected yet.</p>;
  }

  return (
    <ul className={className} style={{ display: 'grid', gap: '0.85rem' }}>
      {genes.map((gene, i) => {
        const color = palette.rungColors[i % palette.rungColors.length] ?? palette.accent;
        return (
          <li key={gene.id}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-sm font-medium text-white/85">{gene.label}</span>
              <span className="shrink-0 font-mono text-[11px] tabular-nums" style={{ color }}>
                {gene.percent}%
              </span>
            </div>
            <div className="h-[6px] w-full overflow-hidden rounded-full bg-white/[0.055]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(3, (gene.percent / max) * 100)}%`,
                  background: `linear-gradient(90deg, ${color}55, ${color})`,
                }}
              />
            </div>
            <span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-white/30">{gene.raw}</span>
          </li>
        );
      })}
    </ul>
  );
}

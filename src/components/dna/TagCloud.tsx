import { useMemo } from 'react';
import type { Palette } from '../../lib/types';

interface Props {
  cloud: { label: string; weight: number }[];
  palette: Palette;
  className?: string;
}

/**
 * Deterministic tag cloud. Placement uses a spiral walk seeded by the tag text
 * itself, so the same profile always produces the same layout — and no layout
 * math ever depends on Math.random.
 */
export function TagCloud({ cloud, palette, className }: Props) {
  const items = useMemo(() => {
    const sorted = [...cloud].sort((a, b) => b.weight - a.weight).slice(0, 22);
    if (sorted.length === 0) return [];
    const maxW = Math.max(...sorted.map((c) => c.weight));
    const minW = Math.min(...sorted.map((c) => c.weight));

    return sorted.map((entry, index) => {
      const t = maxW === minW ? 0.6 : (entry.weight - minW) / (maxW - minW);
      const fontSize = 11 + t * 15;
      // Spiral placement keyed by index keeps a natural spread without overlap.
      const angle = index * 2.399963; // golden angle
      const radius = 12 + Math.sqrt(index) * 34;
      const x = Math.cos(angle) * radius * 1.45;
      const y = Math.sin(angle) * radius * 0.9;
      const color = palette.rungColors[index % palette.rungColors.length] ?? palette.accent;
      return { ...entry, x, y, fontSize, color, opacity: 0.55 + t * 0.45 };
    });
  }, [cloud, palette]);

  if (items.length === 0) return <p className="muted text-sm">No tags yet.</p>;

  return (
    <div className={className}>
      <svg viewBox="-240 -130 480 260" className="h-auto w-full" role="img" aria-label="Identity tag cloud">
        {items.map((item) => (
          <text
            key={item.label}
            x={item.x}
            y={item.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={item.fontSize}
            fontWeight={600}
            fill={item.color}
            opacity={item.opacity}
          >
            {item.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

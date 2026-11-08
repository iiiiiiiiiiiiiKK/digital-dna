import { useMemo } from 'react';
import type { DnaResult } from '../../lib/types';

interface Props {
  result: DnaResult;
  className?: string;
}

/**
 * Bipartite interest ↔ skill association graph.
 *
 * Left column = interests (node size from intensity), right column = skills
 * (node size from self-rated level). Edges exist only where the engine found a
 * real affinity, shared id, or a deterministic hash affinity — the same set the
 * engine reports in `result.links`, so the drawing cannot invent relationships.
 */
export function AssociationGraph({ result, className }: Props) {
  const width = 520;
  const height = Math.max(320, Math.min(560, 190 + Math.max(result.interestGenes.length, result.skillGenes.length) * 24));

  const layout = useMemo(() => {
    const interests = result.interestGenes.slice(0, 12);
    const skills = result.skillGenes.slice(0, 10);
    const leftX = 118;
    const rightX = width - 118;
    const topPad = 40;
    const bottomPad = 30;

    const place = (count: number, i: number) => {
      const usable = height - topPad - bottomPad;
      const step = count <= 1 ? 0 : usable / (count - 1);
      return topPad + (count <= 1 ? usable / 2 : i * step);
    };

    const left = interests.map((g, i) => ({
      id: g.id,
      label: g.label,
      percent: g.percent,
      x: leftX,
      y: place(interests.length, i),
      r: 5 + (g.percent / 100) * 8,
      color: result.palette.rungColors[i % result.palette.rungColors.length] ?? result.palette.accent,
    }));

    const right = skills.map((g, i) => ({
      id: g.id,
      label: g.label,
      percent: g.percent,
      x: rightX,
      y: place(skills.length, i),
      r: 5 + (g.percent / 100) * 8,
      color: result.palette.rungColors[(i + 4) % result.palette.rungColors.length] ?? result.palette.accent,
    }));

    const edges = result.links
      .map((link) => {
        const from = left.find((n) => n.id === link.from);
        const to = right.find((n) => n.id === link.to);
        if (!from || !to) return null;
        return { ...link, from, to };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);

    return { left, right, edges };
  }, [result, height]);

  if (layout.left.length === 0 || layout.right.length === 0) {
    return (
      <p className="muted text-sm">
        Add at least one interest and one skill to see how they connect.
      </p>
    );
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label="Interest and skill association graph">
      <text x={118} y={20} textAnchor="middle" fontSize={10} fill={result.palette.textMuted} letterSpacing={2}>
        INTERESTS
      </text>
      <text x={width - 118} y={20} textAnchor="middle" fontSize={10} fill={result.palette.textMuted} letterSpacing={2}>
        SKILLS
      </text>

      {layout.edges.map((edge, i) => (
        <path
          key={`e${i}`}
          d={`M ${edge.from.x} ${edge.from.y} C ${(edge.from.x + edge.to.x) / 2} ${edge.from.y}, ${(edge.from.x + edge.to.x) / 2} ${edge.to.y}, ${edge.to.x} ${edge.to.y}`}
          stroke={edge.from.color}
          strokeWidth={0.5 + (edge.strength / 100) * 2.6}
          fill="none"
          opacity={0.16 + (edge.strength / 100) * 0.42}
        />
      ))}

      {layout.left.map((n) => (
        <g key={`l-${n.id}`}>
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} />
          <text x={n.x - n.r - 8} y={n.y} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="rgba(255,255,255,0.82)">
            {n.label}
          </text>
        </g>
      ))}

      {layout.right.map((n) => (
        <g key={`r-${n.id}`}>
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.color} />
          <text x={n.x + n.r + 8} y={n.y} dominantBaseline="middle" fontSize={11} fill="rgba(255,255,255,0.82)">
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

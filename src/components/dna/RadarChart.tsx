import { useMemo } from 'react';
import type { DnaDimension } from '../../lib/types';

interface Props {
  dimensions: DnaDimension[];
  accent: string;
  accentSoft: string;
  textMuted: string;
  className?: string;
}

/**
 * Radar chart for the eight derived dimensions. SVG, no chart library, so the
 * same markup can be re-rendered at export resolution.
 */
export function RadarChart({ dimensions, accent, accentSoft, textMuted, className }: Props) {
  const size = 420;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 54;

  const points = useMemo(() => {
    const n = dimensions.length;
    return dimensions.map((d, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = (Math.max(0, Math.min(100, d.percent)) / 100) * radius;
      return {
        ...d,
        angle,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        ax: cx + Math.cos(angle) * radius,
        ay: cy + Math.sin(angle) * radius,
        lx: cx + Math.cos(angle) * (radius + 22),
        ly: cy + Math.sin(angle) * (radius + 22),
      };
    });
  }, [dimensions, cx, cy, radius]);

  const polygon = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const rings = [25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className={className} role="img" aria-label="Digital DNA dimension radar">
      {rings.map((ring) => {
        const r = (ring / 100) * radius;
        const ringPoints = dimensions
          .map((_, i) => {
            const angle = (Math.PI * 2 * i) / dimensions.length - Math.PI / 2;
            return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`;
          })
          .join(' ');
        return (
          <polygon
            key={ring}
            points={ringPoints}
            fill="none"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth={1}
            strokeDasharray={ring === 100 ? undefined : '3 5'}
          />
        );
      })}

      {points.map((p) => (
        <line key={`axis-${p.id}`} x1={cx} y1={cy} x2={p.ax} y2={p.ay} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
      ))}

      <polygon points={polygon} fill={accentSoft} fillOpacity={0.4} stroke={accent} strokeWidth={2} strokeLinejoin="round" />
      {points.map((p) => (
        <circle key={`dot-${p.id}`} cx={p.x} cy={p.y} r={3.6} fill={accent} />
      ))}

      {points.map((p) => {
        const anchor = Math.abs(p.lx - cx) < 12 ? 'middle' : p.lx > cx ? 'start' : 'end';
        return (
          <g key={`label-${p.id}`}>
            <text
              x={p.lx}
              y={p.ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={12}
              fontWeight={600}
              fill={textMuted}
            >
              {p.label}
            </text>
            <text
              x={p.lx}
              y={p.ly + 14}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize={11}
              fill={accent}
              opacity={0.9}
            >
              {p.percent}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

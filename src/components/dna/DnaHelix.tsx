import { useMemo } from 'react';
import type { DnaResult } from '../../lib/types';
import { buildHelixScene, branchPath, HELIX_VIEWBOX } from '../../lib/helix';

interface Props {
  result: DnaResult;
  /** Unique prefix for SVG defs ids so multiple helixes can coexist. */
  uid: string;
  className?: string;
  /** Draw the assembly animation (grow from top to bottom). */
  animated?: boolean;
  /** Hide ambient particles for tiny thumbnails. */
  compact?: boolean;
}

/**
 * The signature visual: a data-driven double helix.
 *
 * Every geometric value traces back to `result.helix`, which is a documented
 * transform of the user's answers — so this is not a decorative random graphic.
 */
export function DnaHelix({ result, uid, className, animated = false, compact = false }: Props) {
  const scene = useMemo(() => buildHelixScene(result.helix, result.palette), [result]);
  const { palette, helix } = result;
  const { width, height } = HELIX_VIEWBOX;

  const glowStd = 0.35 + helix.glow * 0.9;
  const strandOpacity = 0.55 + helix.glow * 0.4;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={`Digital DNA helix for ${result.dnaCode}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.background} />
          <stop offset="55%" stopColor={palette.backgroundAlt} />
          <stop offset="100%" stopColor={palette.background} />
        </linearGradient>

        <linearGradient id={`${uid}-strandA`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.strandA} stopOpacity="0.15" />
          <stop offset="22%" stopColor={palette.strandA} stopOpacity="1" />
          <stop offset="78%" stopColor={palette.strandA} stopOpacity="1" />
          <stop offset="100%" stopColor={palette.strandA} stopOpacity="0.15" />
        </linearGradient>

        <linearGradient id={`${uid}-strandB`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.strandB} stopOpacity="0.15" />
          <stop offset="22%" stopColor={palette.strandB} stopOpacity="1" />
          <stop offset="78%" stopColor={palette.strandB} stopOpacity="1" />
          <stop offset="100%" stopColor={palette.strandB} stopOpacity="0.15" />
        </linearGradient>

        <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation={2 + glowStd * 2.4} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={`${uid}-soft`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={1.2 + glowStd} />
        </filter>

        <radialGradient id={`${uid}-vignette`} cx="0.5" cy="0.5" r="0.72">
          <stop offset="55%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      <rect width={width} height={height} fill={`url(#${uid}-bg)`} />
      <rect width={width} height={height} fill={`url(#${uid}-vignette)`} />

      {/* Ambient habit-driven particles. */}
      {!compact && (
        <g aria-hidden="true">
          {scene.particles.map((p, i) => (
            <circle key={`p${i}`} cx={p.x} cy={p.y} r={p.r} fill={p.color} opacity={p.opacity} />
          ))}
        </g>
      )}

      {/* Side branches: count = number of skills, width = self-rated level. */}
      <g aria-hidden="true" filter={`url(#${uid}-soft)`} opacity="0.85">
        {scene.branches.map((b) => (
          <path
            key={`b${b.index}`}
            d={branchPath(b)}
            stroke={b.color}
            strokeWidth={b.width}
            strokeLinecap="round"
            fill="none"
            opacity={b.opacity}
          />
        ))}
      </g>

      {/* Rungs: colour = interest domain, radius = intensity. */}
      <g aria-hidden="true">
        {scene.rungs.map((r) => (
          <g key={`r${r.index}`} opacity={r.opacity}>
            <line
              x1={r.from.x}
              y1={r.from.y}
              x2={r.to.x}
              y2={r.to.y}
              stroke={r.color}
              strokeWidth={1.1 + r.radius * 0.32}
              strokeLinecap="round"
              opacity="0.7"
            />
            <circle cx={r.mid.x} cy={r.mid.y} r={r.radius} fill={r.color} filter={`url(#${uid}-glow)`} />
          </g>
        ))}
      </g>

      {/* The two strands. */}
      {animated && <AnimateDraw path={scene.strands.pathA} />}
      <path
        d={scene.strands.pathA}
        data-part="strand-a"
        fill="none"
        stroke={`url(#${uid}-strandA)`}
        strokeWidth={helix.strandWidth * 1.9}
        strokeLinecap="round"
        opacity={strandOpacity}
        filter={`url(#${uid}-glow)`}
      />
      <path
        d={scene.strands.pathA}
        data-part="strand-a-core"
        fill="none"
        stroke={palette.strandA}
        strokeWidth={helix.strandWidth}
        strokeLinecap="round"
        opacity={strandOpacity}
      />
      <path
        d={scene.strands.pathB}
        data-part="strand-b"
        fill="none"
        stroke={`url(#${uid}-strandB)`}
        strokeWidth={helix.strandWidth * 1.9}
        strokeLinecap="round"
        opacity={strandOpacity * 0.9}
        filter={`url(#${uid}-glow)`}
      />
      <path
        d={scene.strands.pathB}
        fill="none"
        stroke={palette.strandB}
        strokeWidth={helix.strandWidth}
        strokeLinecap="round"
        opacity={strandOpacity * 0.9}
      />
    </svg>
  );
}

/**
 * One-shot stroke-draw animation used on the generation screen.
 * Implemented with CSS (not a library) so it works inside static SVG export too.
 */
function AnimateDraw({ path }: { path: string }) {
  return (
    <path
      d={path}
      fill="none"
      stroke="#ffffff"
      strokeWidth={0.6}
      opacity={0.22}
      style={{
        strokeDasharray: 2400,
        strokeDashoffset: 0,
        animation: 'dnaDraw 2.4s cubic-bezier(0.22,1,0.36,1) both',
      }}
    />
  );
}

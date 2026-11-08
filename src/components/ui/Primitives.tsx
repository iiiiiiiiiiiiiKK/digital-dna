import type { ReactNode } from 'react';

/** Small labelled section used across result pages. */
export function SectionTitle({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div>
        {kicker && <p className="kicker mb-1.5">{kicker}</p>}
        <h2 className="text-[17px] font-semibold tracking-tight text-white/90 sm:text-lg">{title}</h2>
      </div>
      {children && <div className="text-[12px] text-white/40">{children}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="panel flex flex-col items-center gap-2 px-6 py-12 text-center">
      {icon && <div className="mb-1 text-neon-cyan/70">{icon}</div>}
      <p className="text-[15px] font-medium text-white/80">{title}</p>
      {hint && <p className="muted max-w-sm text-[13px] leading-relaxed">{hint}</p>}
    </div>
  );
}

export function Callout({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'warn' }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-[12.5px] leading-relaxed ${
        tone === 'warn'
          ? 'border-amber-400/25 bg-amber-400/[0.06] text-amber-100/80'
          : 'border-white/10 bg-white/[0.03] text-white/55'
      }`}
    >
      {children}
    </div>
  );
}

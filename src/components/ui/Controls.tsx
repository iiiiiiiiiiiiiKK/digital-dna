import { useMemo, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { tidyText } from '../../lib/profile';

interface ChipGridProps {
  options: { id: string; label: string; hint?: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  /** Max selections; undefined = unlimited. */
  max?: number;
  columns?: 2 | 3 | 4;
}

export function ChipGrid({ options, selected, onToggle, max, columns = 3 }: ChipGridProps) {
  const colClass = columns === 2 ? 'sm:grid-cols-2' : columns === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3';
  return (
    <div className={`grid grid-cols-2 gap-2 ${colClass}`}>
      {options.map((opt) => {
        const isActive = selected.includes(opt.id);
        const atMax = max !== undefined && selected.length >= max && !isActive;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onToggle(opt.id)}
            disabled={atMax}
            aria-pressed={isActive}
            className={`group relative flex min-h-[46px] items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-[13px] font-medium transition-all disabled:opacity-35 ${
              isActive
                ? 'border-neon-cyan/55 bg-neon-cyan/[0.11] text-white'
                : 'border-white/10 bg-white/[0.02] text-white/65 hover:border-white/25 hover:text-white'
            }`}
          >
            <span className="min-w-0 truncate">{opt.label}</span>
            {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-neon-cyan" strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}

interface CustomAddProps {
  label: string;
  placeholder: string;
  onAdd: (value: string) => void;
  max?: number;
}

export function CustomAdd({ label, placeholder, onAdd, max = 40 }: CustomAddProps) {
  const [value, setValue] = useState('');
  const clean = tidyText(value, max);
  const canAdd = clean.length >= 2;

  const submit = () => {
    if (!canAdd) return;
    onAdd(clean);
    setValue('');
  };

  return (
    <div className="flex gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        aria-label={label}
        className="field !py-2.5 text-[13px]"
        maxLength={max}
      />
      <button
        type="button"
        onClick={submit}
        disabled={!canAdd}
        className="btn-ghost shrink-0 !px-3.5 disabled:opacity-35"
        aria-label={label}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

interface RemovableProps {
  items: { id: string; label: string; custom?: boolean }[];
  onRemove: (id: string) => void;
  emptyHint?: string;
}

export function CustomList({ items, onRemove, emptyHint }: RemovableProps) {
  const custom = useMemo(() => items.filter((i) => i.custom), [items]);
  if (custom.length === 0) return emptyHint ? <p className="text-[12px] text-white/25">{emptyHint}</p> : null;
  return (
    <div className="flex flex-wrap gap-2">
      {custom.map((item) => (
        <span
          key={item.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-neon-violet/35 bg-neon-violet/10 px-3 py-1.5 text-[12px] text-white/80"
        >
          {item.label}
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="text-white/40 hover:text-white"
            aria-label={`Remove ${item.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

interface IntensityProps {
  value: number;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
  labels: Record<number, string>;
}

/** 1–5 intensity with a large, thumb-friendly target set. */
export function IntensityPicker({ value, onChange, labels }: IntensityProps) {
  return (
    <div className="mt-2 flex items-center gap-1.5" role="group" aria-label="Interest intensity">
      {[1, 2, 3, 4, 5].map((level) => {
        const active = value === level;
        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange(level as 1 | 2 | 3 | 4 | 5)}
            aria-pressed={active}
            aria-label={`${level} — ${labels[level]}`}
            className={`h-9 flex-1 rounded-lg border text-[11px] font-semibold tabular-nums transition-all ${
              active
                ? 'border-neon-cyan/60 bg-neon-cyan/15 text-white'
                : 'border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20'
            }`}
          >
            {level}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentedCard({
  options,
  value,
  onChange,
  columns = 3,
}: {
  options: readonly { id: string; label: string; hint?: string }[];
  value: string;
  onChange: (id: string) => void;
  columns?: 2 | 3;
}) {
  const colClass = columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3';
  return (
    <div className={`grid grid-cols-1 gap-2 ${colClass}`}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            aria-pressed={active}
            className={`flex min-h-[56px] flex-col justify-center gap-1 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
              active
                ? 'border-neon-cyan/55 bg-neon-cyan/[0.1]'
                : 'border-white/10 bg-white/[0.02] hover:border-white/25'
            }`}
          >
            <span className={`text-[13px] font-semibold ${active ? 'text-white' : 'text-white/75'}`}>{opt.label}</span>
            {opt.hint && <span className="text-[11px] leading-snug text-white/35">{opt.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

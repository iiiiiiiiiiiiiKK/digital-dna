import { useApp } from '../../store/useApp';
import {
  ACTIVITY_CATALOG,
  CONTENT_CATALOG,
  PLATFORM_CATALOG,
  PRODUCT_CATALOG,
  TOOL_CATALOG,
} from '../../lib/catalog';
import { ChipGrid } from '../../components/ui/Controls';

type HabitKey = 'platforms' | 'tools' | 'contentTypes' | 'products' | 'activities';

const GROUPS: { key: HabitKey; title: string; hint: string; catalog: { id: string; label: string }[]; columns: 2 | 3 | 4 }[] = [
  { key: 'platforms', title: 'Platforms you spend time on', hint: 'No account connection — this is just a tag list.', catalog: PLATFORM_CATALOG, columns: 3 },
  { key: 'tools', title: 'Tools you actually open', hint: '', catalog: TOOL_CATALOG, columns: 3 },
  { key: 'contentTypes', title: 'Content you consume', hint: '', catalog: CONTENT_CATALOG, columns: 3 },
  { key: 'products', title: 'Digital products you like', hint: '', catalog: PRODUCT_CATALOG, columns: 3 },
  { key: 'activities', title: 'Your main daily digital activity', hint: '', catalog: ACTIVITY_CATALOG, columns: 3 },
];

/** Step 5 — digital habits. Purely descriptive; nothing is fetched. */
export function StepHabits() {
  const profile = useApp((s) => s.profile);
  const updateProfile = useApp((s) => s.updateProfile);

  const toggle = (key: HabitKey, id: string) => {
    const current = profile.habits[key];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    updateProfile({ habits: { ...profile.habits, [key]: next } });
  };

  const total =
    profile.habits.platforms.length +
    profile.habits.tools.length +
    profile.habits.contentTypes.length +
    profile.habits.products.length +
    profile.habits.activities.length;

  return (
    <div className="space-y-7">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <p className="text-[12px] leading-relaxed text-white/45">
          This step only shapes the ambient particle field around your helix. Nothing here is scraped, imported or
          verified — no social account is ever connected.
        </p>
      </div>

      {GROUPS.map((group) => (
        <div key={group.key}>
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <span className="label !mb-0">{group.title}</span>
            <span className="font-mono text-[10.5px] text-white/25">
              {profile.habits[group.key].length} selected
            </span>
          </div>
          {group.hint && <p className="mb-2 text-[11.5px] text-white/30">{group.hint}</p>}
          <ChipGrid
            options={group.catalog}
            selected={profile.habits[group.key]}
            onToggle={(id) => toggle(group.key, id)}
            columns={group.columns}
          />
        </div>
      ))}

      <p className="text-[11.5px] text-white/25">
        {total} items across five categories · more items means a denser particle field.
      </p>
    </div>
  );
}

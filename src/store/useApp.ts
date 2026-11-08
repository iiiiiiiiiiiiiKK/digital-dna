import { create } from 'zustand';
import type { AppSettings, DnaResult, DnaVersion, Profile } from '../lib/types';
import { createEmptyProfile, validateProfile } from '../lib/profile';
import { generateDna } from '../lib/engine';
import * as repo from '../lib/db';

interface AppState {
  ready: boolean;
  profile: Profile;
  versions: DnaVersion[];
  settings: AppSettings;
  /** Latest generated result for the current profile, if any. */
  result: DnaResult | null;
  wizardStep: number;
  draftSavedAt: string | null;
  busy: boolean;
  error: string | null;

  init: () => Promise<void>;
  reloadVersions: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => void;
  setProfile: (profile: Profile) => void;
  resetForNew: () => Promise<void>;
  setStep: (step: number) => void;
  persistDraft: () => Promise<void>;
  generate: () => Promise<DnaResult>;
  updateSettings: (next: AppSettings) => Promise<void>;
  setVisibility: (visibility: 'private' | 'public') => Promise<void>;
}

const emptySettings: AppSettings = {
  id: 'app',
  ai: { enabled: false, baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', apiKey: '' },
};

export const useApp = create<AppState>((set, get) => ({
  ready: false,
  profile: createEmptyProfile(),
  versions: [],
  settings: emptySettings,
  result: null,
  wizardStep: 0,
  draftSavedAt: null,
  busy: false,
  error: null,

  init: async () => {
    try {
      const [profile, settings] = await Promise.all([repo.getOrCreatePrimaryProfile(), repo.ensureSettings()]);
      const versions = await repo.listVersions(profile.id);
      const latest = versions[versions.length - 1];
      // Restore the wizard step only if a draft for *this* profile exists;
      // otherwise start at the first step (e.g. right after generating or
      // after deleting all data).
      const draft = await repo.readDraft();
      const step =
        draft && draft.profile.id === profile.id && versions.length === 0
          ? Math.max(0, Math.min(6, draft.step))
          : 0;
      set({
        ready: true,
        profile,
        settings,
        versions,
        result: latest ? latest.result : null,
        wizardStep: step,
        error: null,
      });
    } catch (err) {
      set({ ready: true, error: err instanceof Error ? err.message : 'Storage unavailable.' });
    }
  },

  reloadVersions: async () => {
    const { profile } = get();
    const versions = await repo.listVersions(profile.id);
    set({ versions, result: versions.length ? versions[versions.length - 1].result : null });
  },

  updateProfile: (patch) => {
    set({ profile: { ...get().profile, ...patch, updatedAt: new Date().toISOString() } });
  },

  setProfile: (profile) => set({ profile }),

  resetForNew: async () => {
    const profile = createEmptyProfile();
    await repo.putProfile(profile);
    await repo.clearDraft();
    set({ profile, wizardStep: 0, result: null, versions: [], draftSavedAt: null });
  },

  setStep: (step) => set({ wizardStep: Math.max(0, step) }),

  persistDraft: async () => {
    const { profile, wizardStep } = get();
    try {
      await repo.putProfile(profile);
      await repo.saveDraft(profile, wizardStep);
      set({ draftSavedAt: new Date().toISOString() });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Could not save your progress.' });
    }
  },

  generate: async () => {
    const { profile, versions } = get();
    const problems = validateProfile(profile);
    if (problems.length > 0) throw new Error(problems[0]);

    set({ busy: true, error: null });
    try {
      const version = versions.length + 1;
      const result = generateDna(profile, version);
      const record: DnaVersion = {
        id: `${profile.id}:v${version}`,
        profileId: profile.id,
        version,
        dnaCode: result.dnaCode,
        generatedAt: result.generatedAt,
        profile: { ...profile },
        result,
      };
      await repo.putProfile(profile);
      await repo.saveVersion(record);
      await repo.clearDraft();
      const nextVersions = [...versions, record];
      // Reset to the first step so reopening the wizard to edit starts at the
      // beginning rather than dropping the user on the review screen.
      set({ versions: nextVersions, result, busy: false, wizardStep: 0, draftSavedAt: null });
      return result;
    } catch (err) {
      set({ busy: false, error: err instanceof Error ? err.message : 'Generation failed.' });
      throw err;
    }
  },

  updateSettings: async (next) => {
    await repo.saveSettings(next);
    set({ settings: next });
  },

  setVisibility: async (visibility) => {
    const profile = { ...get().profile, visibility, updatedAt: new Date().toISOString() };
    await repo.putProfile(profile);
    set({ profile });
  },
}));

import { useRef } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useApp } from '../../store/useApp';
import { tidyText } from '../../lib/profile';

/** Step 1 — basic identity. Everything except the nickname is optional. */
export function StepBasics() {
  const profile = useApp((s) => s.profile);
  const updateProfile = useApp((s) => s.updateProfile);
  const fileRef = useRef<HTMLInputElement>(null);

  const onAvatar = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    // Downscale before storing: keeps IndexedDB small and avoids shipping a
    // multi-megabyte base64 string into the export bundle.
    const dataUrl = await downscaleImage(file, 256);
    updateProfile({ avatar: dataUrl });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="label" htmlFor="nickname">
          Nickname <span className="text-neon-cyan/70">required</span>
        </label>
        <input
          id="nickname"
          value={profile.nickname}
          onChange={(e) => updateProfile({ nickname: tidyText(e.target.value, 40) })}
          placeholder="How should the helix be signed?"
          maxLength={40}
          autoComplete="nickname"
          className="field"
          autoFocus
        />
        <p className="mt-2 text-[11.5px] text-white/30">
          A handle or first name is enough. We never ask for a real name, email, phone number or address.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="bio">
          Short bio <span className="text-white/25">optional</span>
        </label>
        <textarea
          id="bio"
          value={profile.bio}
          onChange={(e) => updateProfile({ bio: e.target.value.slice(0, 280) })}
          placeholder="One or two lines about what you're into."
          rows={3}
          maxLength={280}
          className="field resize-none"
        />
        <p className="mt-1.5 text-right font-mono text-[10.5px] text-white/25">{profile.bio.length}/280</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="role">
            Role <span className="text-white/25">optional</span>
          </label>
          <input
            id="role"
            value={profile.role}
            onChange={(e) => updateProfile({ role: tidyText(e.target.value, 60) })}
            placeholder="Student, designer, engineer…"
            maxLength={60}
            className="field"
          />
        </div>
        <div>
          <label className="label" htmlFor="field">
            Field <span className="text-white/25">optional</span>
          </label>
          <input
            id="field"
            value={profile.field}
            onChange={(e) => updateProfile({ field: tidyText(e.target.value, 60) })}
            placeholder="Developer tools, brand design…"
            maxLength={60}
            className="field"
          />
        </div>
      </div>

      <div>
        <span className="label">
          Avatar <span className="text-white/25">optional · stays on this device</span>
        </span>
        <div className="flex items-center gap-3">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="h-5 w-5 text-white/25" />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost !py-2 text-[12.5px]">
              Choose image
            </button>
            {profile.avatar && (
              <button
                type="button"
                onClick={() => updateProfile({ avatar: null })}
                className="btn-ghost !py-2 text-[12.5px]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onAvatar(e.target.files?.[0])}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Resize an image to a square data URL. Uses canvas so EXIF orientation is
 * applied by the browser and no library is needed.
 */
async function downscaleImage(file: File, size: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
  bitmap.close?.();
  return canvas.toDataURL('image/jpeg', 0.82);
}

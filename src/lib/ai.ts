/**
 * Optional AI module.
 *
 * Design constraints from the spec, implemented literally:
 *  - AI is never required: every core feature works with no key configured.
 *  - The key lives only in this browser's IndexedDB. There is no build-time
 *    env var and nothing is committed to the repo.
 *  - Requests go from *this browser* straight to the endpoint the user typed.
 *    The product has no backend, so there is no proxy that could see the key.
 *  - Before the first call the UI shows exactly what will be sent, and requires
 *    an explicit confirmation each session.
 *  - AI output is labelled as a language-model suggestion, never as an
 *    assessment of the person.
 */

import type { AiSettings, DnaResult, Profile } from './types';

export const AI_DISCLOSURE = `The selected profile answers will be sent directly from your browser to the API endpoint you configured. Nothing is sent to us — this app has no server. Your API key is stored only in this browser's IndexedDB and can be removed at any time from Settings.`;

export interface AiRequestPayload {
  model: string;
  messages: { role: 'system' | 'user'; content: string }[];
  temperature: number;
  max_tokens: number;
}

export function buildAiPrompt(profile: Profile, result: DnaResult): AiRequestPayload['messages'] {
  const facts = {
    nickname: profile.nickname,
    role: profile.role,
    field: profile.field,
    bio: profile.bio,
    interests: profile.interests.map((i) => `${i.label} (${i.intensity}/5)`),
    skills: profile.skills.map((s) => `${s.label} (${s.level}, self-rated)`),
    creative: profile.creative,
    habits: profile.habits,
    visualStyle: profile.visualStyle,
    derivedTags: result.tags,
  };

  return [
    {
      role: 'system',
      content:
        'You write short, warm, concrete summaries of a person\'s self-reported interests for a digital-identity artwork. ' +
        'You must never diagnose, score, or claim to measure personality, intelligence or mental health. ' +
        'Never invent facts that are not in the input. Answer as JSON only.',
    },
    {
      role: 'user',
      content:
        `Here are the answers this person supplied themselves:\n${JSON.stringify(facts, null, 2)}\n\n` +
        'Write a 2-sentence summary (max 220 characters) in the same language as the nickname field, describing the combination of interests and skills. ' +
        'Then propose exactly 4 short identity tag suggestions (1–3 words each) that are clearly playful descriptors, not psychological claims. ' +
        'Reply with JSON: {"summary": string, "tags": string[4]}',
    },
  ];
}

export interface AiCallResult {
  summary: string;
  tags: string[];
}

/**
 * Call an OpenAI-compatible chat completions endpoint.
 * Throws with a readable message on any failure so the UI never fakes success.
 */
export async function callAi(
  settings: AiSettings,
  profile: Profile,
  result: DnaResult,
  signal?: AbortSignal
): Promise<AiCallResult> {
  if (!settings.enabled) throw new Error('AI features are disabled in Settings.');
  if (!settings.apiKey.trim()) throw new Error('No API key configured.');
  if (!settings.baseUrl.trim()) throw new Error('No API base URL configured.');
  if (!settings.model.trim()) throw new Error('No model name configured.');

  const base = settings.baseUrl.replace(/\/+$/, '');
  const endpoint = base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;

  const body: AiRequestPayload = {
    model: settings.model,
    messages: buildAiPrompt(profile, result),
    temperature: 0.7,
    max_tokens: 400,
  };

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw new Error('Request cancelled.');
    throw new Error(
      'Network request failed. The endpoint may be unreachable from this browser, or it may not allow direct browser calls (CORS).'
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`The API returned ${response.status}. ${detail.slice(0, 200)}`);
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('The API response contained no message content.');

  return parseAiContent(content);
}

export function parseAiContent(content: string): AiCallResult {
  const trimmed = content.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    const parsed = JSON.parse(trimmed) as { summary?: unknown; tags?: unknown };
    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim().slice(0, 400) : '';
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.filter((t): t is string => typeof t === 'string').map((t) => t.trim().slice(0, 40)).slice(0, 6)
      : [];
    if (!summary) throw new Error('empty');
    return { summary, tags };
  } catch {
    // A model that ignores the JSON instruction should not break the UI;
    // return the raw text as the summary and no tags.
    const plain = trimmed.replace(/\s+/g, ' ').slice(0, 400);
    if (!plain) throw new Error('The API returned an empty message.');
    return { summary: plain, tags: [] };
  }
}

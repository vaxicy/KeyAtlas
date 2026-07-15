import type { AllData, Shortcut, App } from './types';

interface SearchResult {
  type: 'shortcut' | 'app';
  item: Shortcut | App;
  score: number;
}

/** Normalize pinyin field (string | string[] | undefined) to a lowercased string array. */
function pinyinTokens(pinyin?: string | string[]): string[] {
  if (!pinyin) return [];
  if (Array.isArray(pinyin)) return pinyin.map(p => p.toLowerCase());
  return pinyin.toLowerCase().split(/\s+/).filter(Boolean);
}

export function search(query: string, data: AllData, limit = 50): SearchResult[] {
  if (!query.trim()) return [];
  if (!data || !Array.isArray(data.shortcuts) || !Array.isArray(data.apps)) return [];

  const q = query.trim().toLowerCase();
  const isKeyCombo = /ctrl|alt|shift|cmd|meta|\+/i.test(q);

  const results: SearchResult[] = [];

  // Search shortcuts
  for (const s of data.shortcuts) {
    let score = 0;
    const pinyinArr = pinyinTokens(s.pinyin);
    const fields = [
      s.name?.en,
      s.name?.zh,
      s.description?.en,
      s.description?.zh,
      ...(s.keywords || []),
      s.windows || '',
      s.mac || '',
      s.linux || '',
      ...pinyinArr,
    ].map(f => (f || '').toLowerCase());

    // Exact match
    if (fields.some(f => f === q)) score += 100;
    // Contains match
    else if (fields.some(f => f.includes(q))) score += 50;
    // Pinyin match against pre-computed pinyin fields in data
    else if (pinyinArr.some(p => p.includes(q) || q.includes(p))) score += 35;
    // Key combo partial match
    else if (isKeyCombo && fields.some(f => f.includes(q))) score += 60;
    // Partial fuzzy (each char of query appears in order somewhere in field)
    else {
      const bestField = fields.reduce((best, field) => {
        const s = fuzzyScore(q, field);
        return s > best ? s : best;
      }, 0);
      score = bestField * 20;
    }

    if (score > 0) {
      results.push({ type: 'shortcut', item: s, score });
    }
  }

  // Search apps
  for (const a of data.apps) {
    let score = 0;
    const fields = [a.name?.en, a.name?.zh, a.id].map(f => (f || '').toLowerCase());

    if (fields.some(f => f === q)) score += 100;
    else if (fields.some(f => f.includes(q))) score += 70;
    else {
      const bestField = fields.reduce((best, field) => {
        const s = fuzzyScore(q, field);
        return s > best ? s : best;
      }, 0);
      score = bestField * 15;
    }

    if (score > 0) {
      results.push({ type: 'app', item: a, score });
    }
  }

  // Sort by score desc, deduplicate apps when shortcuts already found
  results.sort((a, b) => b.score - a.score);

  const seenAppIds = new Set<string>();
  return results.filter(r => {
    if (r.type === 'shortcut') {
      seenAppIds.add((r.item as Shortcut).appId);
      return true;
    }
    return !seenAppIds.has((r.item as App).id);
  }).slice(0, limit);
}

export interface Suggestion {
  type: 'app' | 'shortcut';
  label: string;      // display text
  sub?: string;       // secondary text (app name / category)
  appId: string;      // navigation target
}

/** Lightweight suggestions for the search input dropdown. */
export function suggest(query: string, data: AllData, limit = 8): Suggestion[] {
  const q = query.trim().toLowerCase();
  if (!q || !data || !Array.isArray(data.apps)) return [];

  const out: Suggestion[] = [];
  const seen = new Set<string>();

  // 1) Matching apps first (name / id / pinyin)
  for (const a of data.apps) {
    const hay = [a.name?.en, a.name?.zh, a.id].map(f => (f || '').toLowerCase());
    if (hay.some(f => f.includes(q))) {
      const key = `app:${a.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ type: 'app', label: a.name?.zh || a.name?.en || a.id, sub: a.name?.en, appId: a.id });
      }
    }
    if (out.length >= limit) break;
  }

  // 2) Matching shortcut names
  if (out.length < limit) {
    for (const s of data.shortcuts) {
      const pinyinArr = pinyinTokens(s.pinyin);
      const hay = [
        s.name?.en, s.name?.zh,
        ...(s.keywords || []),
        ...pinyinArr,
      ].map(f => (f || '').toLowerCase());
      if (hay.some(f => f.includes(q))) {
        const label = s.name?.zh || s.name?.en || s.id;
        const key = `sc:${label}`;
        if (!seen.has(key)) {
          seen.add(key);
          const app = data.apps.find(a => a.id === s.appId);
          out.push({ type: 'shortcut', label, sub: app?.name?.en || s.appId, appId: s.appId });
        }
      }
      if (out.length >= limit) break;
    }
  }

  return out.slice(0, limit);
}

/** Simple fuzzy scoring */
function fuzzyScore(pattern: string, text: string): number {
  if (!pattern || !text) return 0;
  let pi = 0;
  let ti = 0;
  let consecutive = 0;
  while (pi < pattern.length && ti < text.length) {
    if (pattern[pi] === text[ti]) { pi++; ti++; consecutive++; } else ti++;
  }
  return pi === pattern.length ? consecutive / text.length : 0;
}

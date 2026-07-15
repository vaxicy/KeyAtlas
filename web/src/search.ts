import type { AllData, Shortcut, App } from './types';

interface SearchResult {
  type: 'shortcut' | 'app';
  item: Shortcut | App;
  score: number;
}

export function search(query: string, data: AllData, limit = 50): SearchResult[] {
  if (!query.trim()) return [];

  const q = query.trim().toLowerCase();
  const isKeyCombo = /[ctrl|alt|shift|cmd|meta|\+]/i.test(q);

  const results: SearchResult[] = [];

  // Search shortcuts
  for (const s of data.shortcuts) {
    let score = 0;
    const fields = [
      s.name.en,
      s.name.zh,
      s.description.en,
      s.description.zh,
      ...(s.keywords || []),
      s.windows || '',
      s.mac || '',
      s.linux || '',
      ...(s.pinyin || []),
    ].map(f => f.toLowerCase());

    // Exact match
    if (fields.some(f => f === q)) score += 100;
    // Contains match
    else if (fields.some(f => f.includes(q))) score += 50;
    // Pinyin match against pre-computed pinyin fields in data
    else if (s.pinyin && s.pinyin.some(p => p.includes(q) || q.includes(p.split(' ')[0]))) score += 35;
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
    const fields = [a.name.en, a.name.zh, a.id].map(f => f.toLowerCase());

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

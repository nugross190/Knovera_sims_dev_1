// Per-viewer progress in browser storage. Every access is guarded: storage
// can be missing or blocked, and the app must still work without it.

const KEY = 'rmk:v1';

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function write(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable; progress simply is not kept.
  }
}

export function getBest(mapId) {
  return read().best?.[mapId] || null;
}

export function saveBest(mapId, scores) {
  const data = read();
  data.best = data.best || {};
  const prev = data.best[mapId] || {};
  const next = { ...prev };
  for (const [k, v] of Object.entries(scores)) if (v !== null && v !== undefined) next[k] = Math.max(prev[k] ?? -1, v);
  data.best[mapId] = next;
  write(data);
}

export function getExplain(mapId) {
  return read().explain?.[mapId] || '';
}

export function saveExplain(mapId, text) {
  const data = read();
  data.explain = data.explain || {};
  data.explain[mapId] = text;
  write(data);
}

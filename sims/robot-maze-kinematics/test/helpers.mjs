import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function loadMap(id) {
  return JSON.parse(readFileSync(join(root, 'data/maps', `${id}.json`), 'utf8'));
}

// Builds a full answer sheet from plain values; vectors are [x, y].
export function sheet(values) {
  const units = { 1: 'cm/s', 2: 'cm/s', 3: 'cm', 4: 'cm', 5: 'cm', 6: 's', 7: 'cm/s', 8: 'cm/s' };
  const out = {};
  for (const [k, v] of Object.entries(values)) {
    if (k === '5') out[k] = { unit: units[k], ...v };
    else if (Array.isArray(v)) out[k] = { x: String(v[0]), y: String(v[1]), unit: units[k] };
    else out[k] = { value: String(v), unit: units[k] };
  }
  return out;
}

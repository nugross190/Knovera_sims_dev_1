// Validates every map listed in data/levels.json. Exits 1 on any error.
// Usage: node tools/validate-maps.mjs [--verbose]

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLevel, validateMap } from '../src/core/validate.js';
import { enumerateRoutes } from '../src/core/routes.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const verbose = process.argv.includes('--verbose');
const levels = JSON.parse(readFileSync(join(root, 'data/levels.json'), 'utf8'));
let failed = false;

for (const level of levels.levels) {
  const maps = level.maps.map((id) => JSON.parse(readFileSync(join(root, 'data/maps', `${id}.json`), 'utf8')));
  for (const map of maps) {
    const errors = validateMap(map);
    const routes = errors.length ? [] : enumerateRoutes(map);
    const summary = routes.map((r) => r.distance).join(', ');
    console.log(`${errors.length ? 'FAIL' : 'ok  '} ${map.id} (Level ${map.level}, ${map.mode})${summary ? `  routes: ${summary} cm` : ''}`);
    if (verbose) for (const r of routes) console.log(`       ${r.distance} cm  ${r.ids.join('-')}`);
    for (const e of errors) console.log(`       rule ${e.rule}: ${e.message}`);
    if (errors.length) failed = true;
    if (map.level !== level.level) {
      console.log(`       map says Level ${map.level} but is listed under Level ${level.level}`);
      failed = true;
    }
  }
  for (const w of validateLevel(level.level, maps)) console.log(`warn Level ${level.level}: rule ${w.rule}: ${w.message}`);
}
process.exit(failed ? 1 : 0);

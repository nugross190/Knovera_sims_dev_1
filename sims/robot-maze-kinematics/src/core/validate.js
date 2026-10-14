// Checks a map against the map design rules in spec v0.3 section 3.
// Returns a list of problems; an empty list means the map passes.

import { lcm, legKind, legsOf, routeDistance, routePoints, segmentLength, segmentsConflict } from './geometry.js';
import { enumerateRoutes, isValidRoute, sameRoute } from './routes.js';

export const MODES = ['path', 'measurement', 'graph', 'combined'];
const MODE_FROM_LEVEL = { path: 1, measurement: 1, graph: 2, combined: 2 };
const SPEEDS = [10, 20, 30];
const MAX_HYP = 150;

// Which robots' routes the student chooses in this map.
export function chosenRobots(map) {
  if (map.mode === 'path' || map.mode === 'combined') return map.level === 1 ? ['A'] : ['A', 'B'];
  return [];
}

export function usesGraphs(map) {
  return map.mode === 'graph' || map.mode === 'combined';
}

export function validateMap(map) {
  const errors = [];
  const err = (rule, msg) => errors.push({ rule, message: msg });

  if (!MODES.includes(map.mode)) err('mode', `Unknown mode "${map.mode}"`);
  else if (map.level < MODE_FROM_LEVEL[map.mode]) err('mode', `${map.mode} mode starts in Level ${MODE_FROM_LEVEL[map.mode]}`);
  if (map.level === 1 && map.mode === 'combined') err('mode', 'Level 1 has no combined mode');

  // Rule 1: grid points; Start at the origin.
  for (const [id, [x, y]] of Object.entries(map.nodes)) {
    if (x % 10 !== 0 || y % 10 !== 0) err(1, `Node ${id} (${x}, ${y}) is not on the 10 cm grid`);
    const b = map.bounds;
    if (x < b.xMin || x > b.xMax || y < b.yMin || y > b.yMax) err('bounds', `Node ${id} is outside the map bounds`);
  }
  const s = map.nodes[map.start];
  if (!s || s[0] !== 0 || s[1] !== 0) err(1, 'Start must be at (0, 0)');
  if (!map.nodes[map.finish]) err(1, 'Finish node is missing');

  // Rules 2-3: leg shapes.
  for (const [a, b] of map.edges) {
    if (!map.nodes[a] || !map.nodes[b]) {
      err('edges', `Edge ${a}-${b} names a missing node`);
      continue;
    }
    const dx = map.nodes[b][0] - map.nodes[a][0];
    const dy = map.nodes[b][1] - map.nodes[a][1];
    const kind = legKind(dx, dy);
    if (kind === 'other') err(3, `Edge ${a}-${b} is neither axis-aligned nor a 3-4-5 diagonal`);
    if (kind === 'diag345' && map.level < 3) err(2, `Edge ${a}-${b} is a diagonal; diagonals start in Level 3`);
    if (kind === 'diag345' && segmentLength(dx, dy) > MAX_HYP) err(3, `Diagonal ${a}-${b} is longer than 15 cells`);
  }
  // Corridors may only meet at nodes.
  for (let i = 0; i < map.edges.length; i += 1) {
    for (let j = i + 1; j < map.edges.length; j += 1) {
      const [a, b] = map.edges[i];
      const [c, d] = map.edges[j];
      if (![a, b, c, d].every((id) => map.nodes[id])) continue;
      if (segmentsConflict(map.nodes[a], map.nodes[b], map.nodes[c], map.nodes[d]))
        err('edges', `Corridors ${a}-${b} and ${c}-${d} cross or overlap away from a node`);
    }
  }
  if (errors.length) return errors;

  // Rule 5: speeds.
  const { A, B } = map.robots;
  for (const [id, r] of Object.entries(map.robots)) {
    if (!SPEEDS.includes(r.speed)) err(5, `Robot ${id} speed ${r.speed} is not 10, 20 or 30 cm/s`);
    if (!Number.isInteger(r.calibrationSeconds) || r.calibrationSeconds < 2 || r.calibrationSeconds > 4)
      err(6, `Robot ${id} calibration must take 2-4 whole seconds`);
  }
  if (A.speed === B.speed) err(5, 'The two robots must have different speeds');

  // Rule 8: routes.
  const routes = enumerateRoutes(map);
  const distances = [...new Set(routes.map((r) => r.distance))];
  if (distances.length < 3) err(8, `Needs at least three route distances, found ${distances.join(', ') || 'none'}`);
  if (routes.length > 1 && routes[0].distance === routes[1].distance) err(8, `Shortest route ${routes[0].distance} cm is tied`);

  const chosen = chosenRobots(map);
  const graphs = usesGraphs(map);

  for (const id of ['A', 'B']) {
    const r = map.robots[id];
    const isChosen = chosen.includes(id);
    if (isChosen && r.route) err('routes', `Robot ${id} is student-chosen in ${map.mode} mode, so it must not have a preset route`);
    if (!isChosen && !r.route) err('routes', `Robot ${id} needs a preset route in ${map.mode} mode`);
    if (r.route && !isValidRoute(map, r.route)) err('routes', `Robot ${id}'s preset route is not a valid route`);
    if (map.mode === 'measurement' && r.route && isValidRoute(map, r.route)) {
      const legs = legsOf(routePoints(map, r.route));
      if (!r.highlightLeg || r.highlightLeg < 1 || r.highlightLeg > legs.length) err('highlight', `Robot ${id} needs a highlightLeg between 1 and ${legs.length}`);
      else if (legs[r.highlightLeg - 1].kind !== 'axis' && !map.diagonalVelocity && legs.some((l) => l.kind === 'axis'))
        err('highlight', `Robot ${id}'s highlighted leg is a diagonal but diagonalVelocity is off`);
    }
  }
  if (errors.length) return errors;

  // Rule 6: whole seconds on totals; rule 7: whole seconds on legs with graphs.
  for (const id of ['A', 'B']) {
    const r = map.robots[id];
    const candidates = chosen.includes(id) ? routes.map((x) => x.ids) : [r.route];
    for (const ids of candidates) {
      const pts = routePoints(map, ids);
      const dist = routeDistance(pts);
      if (dist % r.speed !== 0) err(6, `Robot ${id}: route ${ids.join('-')} (${dist} cm) is not a whole number of seconds at ${r.speed} cm/s`);
      if (graphs) {
        for (const leg of legsOf(pts)) {
          if (leg.length % r.speed !== 0) err(7, `Robot ${id}: leg ${leg.index} of ${ids.join('-')} (${leg.length} cm) is not whole seconds at ${r.speed} cm/s`);
        }
      }
    }
  }
  if (graphs && chosen.length) {
    const spacing = lcm(A.speed, B.speed);
    for (const [id, [x, y]] of Object.entries(map.nodes)) {
      if (x % spacing !== 0 || y % spacing !== 0) err(7, `Node ${id} (${x}, ${y}) is off the ${spacing} cm lattice`);
    }
  }

  // Rule 9: different routes.
  if (A.route && B.route && sameRoute(A.route, B.route)) err(9, 'Preset routes for A and B are the same');

  // Rule 10: Level 1 path mode, preset B is not the shortest.
  if (map.level === 1 && map.mode === 'path' && B.route) {
    const d = routeDistance(routePoints(map, B.route));
    if (d === routes[0].distance) err(10, "Robot B's preset route must not be the shortest");
  }

  if (!map.prompt) err('prompt', 'Map needs an explain prompt');
  return errors;
}

// Rules that apply across a level's maps (13 and 14). Returns warnings.
export function validateLevel(level, maps) {
  const warnings = [];
  const n = maps.length;
  const need = Math.floor(n / 3);
  const negHighlight = maps.filter((m) => {
    for (const id of ['A', 'B']) {
      const r = m.robots[id];
      if (r.route && r.highlightLeg && m.mode === 'measurement') {
        const leg = legsOf(routePoints(m, r.route))[r.highlightLeg - 1];
        if (leg && (leg.dx < 0 || leg.dy < 0)) return true;
      }
    }
    if (m.mode === 'combined') return enumerateRoutes(m).some((r) => legsOf(routePoints(m, r.ids)).some((l) => l.kind === 'axis' && (l.dx < 0 || l.dy < 0)));
    return false;
  }).length;
  if (negHighlight < need) warnings.push({ rule: 14, message: `Level ${level}: only ${negHighlight} of ${n} maps highlight a left or down leg (need ${need})` });

  if (level === 2) {
    const graphMaps = maps.filter(usesGraphs);
    const withNeg = graphMaps.filter((m) => {
      const routes = chosenRobots(m).length ? enumerateRoutes(m).map((r) => r.ids) : [m.robots.A.route, m.robots.B.route];
      return routes.some((ids) => legsOf(routePoints(m, ids)).some((l) => l.dx < 0 || l.dy < 0));
    }).length;
    if (graphMaps.length && withNeg < Math.ceil(graphMaps.length / 2))
      warnings.push({ rule: 14, message: `Level 2: only ${withNeg} of ${graphMaps.length} graph maps have a left or down leg` });
  }

  if (level === 3) {
    // Rule 13: the diagonal on a longer route than the shortest.
    const decoys = maps.filter((m) => {
      const routes = enumerateRoutes(m);
      const hasDiag = (ids) => legsOf(routePoints(m, ids)).some((l) => l.kind === 'diag345');
      return routes.slice(1).some((r) => hasDiag(r.ids)) && routes.length > 1;
    }).length;
    if (decoys < need) warnings.push({ rule: 13, message: `Level 3: only ${decoys} of ${n} maps put a diagonal on a longer route (need ${need})` });
  }
  return warnings;
}

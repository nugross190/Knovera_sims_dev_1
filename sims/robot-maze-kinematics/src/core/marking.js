// True values for a robot's route and marking of the answer sheet, graphs and
// routes, following spec v0.3 section 7.

import { Frac } from './fraction.js';
import { isPerfectSquare, isqrt, legsOf, routeDistance, routePoints } from './geometry.js';
import { buildLog, breakpoints, totalTime } from './motion.js';
import { bestDistances } from './routes.js';
import { isFilled, isMixedForm, matchesAverage, matchesExact, parseNumber } from './answers.js';

export const ITEMS = {
  1: { name: 'Speed', unit: 'cm/s', vector: false, deps: [] },
  2: { name: 'Velocity on the highlighted leg', unit: 'cm/s', vector: true, deps: [1] },
  3: { name: 'Total distance', unit: 'cm', vector: false, deps: [] },
  4: { name: 'Displacement vector', unit: 'cm', vector: true, deps: [] },
  5: { name: 'Displacement magnitude', unit: 'cm', vector: false, deps: [4] },
  6: { name: 'Total time', unit: 's', vector: false, deps: [1, 3] },
  7: { name: 'Average speed', unit: 'cm/s', vector: false, deps: [3, 6] },
  8: { name: 'Average velocity', unit: 'cm/s', vector: true, deps: [4, 6] },
};

export const UNITS = ['cm', 'cm/s', 's', 'cm²'];

export function itemsForLevel(level) {
  return level >= 2 ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4, 5];
}

// Item 2's leg. Preset routes name it in the map; on a student-chosen route
// it is the first axis-aligned leg pointing left or down, else the first
// axis-aligned leg (or the first leg when the route has no axis-aligned leg).
export function pickHighlightLeg(legs, presetIndex) {
  if (presetIndex) return presetIndex;
  const axis = legs.filter((l) => l.kind === 'axis');
  const pool = axis.length ? axis : legs;
  const negative = pool.find((l) => l.dx < 0 || l.dy < 0);
  return (negative || pool[0]).index;
}

export function robotTruth(map, robotId, routeIds) {
  const robot = map.robots[robotId];
  const points = routePoints(map, routeIds);
  const legs = legsOf(points);
  const speed = robot.speed;
  const isPreset = !!robot.route;
  const highlightLeg = pickHighlightLeg(legs, isPreset ? robot.highlightLeg : null);
  const leg = legs[highlightLeg - 1];
  const distance = routeDistance(points);
  const end = points[points.length - 1];
  const start = points[0];
  const disp = [end[0] - start[0], end[1] - start[1]];
  const time = totalTime(points, speed);
  return {
    robotId,
    routeIds,
    points,
    legs,
    speed,
    highlightLeg,
    legVelocity: [new Frac(speed * leg.dx, leg.length), new Frac(speed * leg.dy, leg.length)],
    distance,
    disp,
    radicand: disp[0] ** 2 + disp[1] ** 2,
    time,
    avgSpeed: new Frac(distance).div(time),
    avgVel: [new Frac(disp[0]).div(time), new Frac(disp[1]).div(time)],
    pathSums: [legs.reduce((s, l) => s + Math.abs(l.dx), 0), legs.reduce((s, l) => s + Math.abs(l.dy), 0)],
    log: buildLog(points, speed, robotId),
  };
}

// Item 5 against a radicand: 'full', 'threeq' (bentuk akar on a perfect
// square) or 'wrong'.
export function judgeMagnitude(ans, radicand) {
  if (!ans) return 'wrong';
  if (ans.form === 'whole') {
    const p = parseNumber(ans.value);
    if (!p || p.form !== 'int' || p.value.n < 0) return 'wrong';
    return p.value.n * p.value.n === radicand ? 'full' : 'wrong';
  }
  if (ans.form === 'akar') {
    const k = isFilled(ans.k) ? parseNumber(ans.k) : { value: new Frac(1), form: 'int' };
    const r = parseNumber(ans.r);
    if (!k || !r || k.form !== 'int' || r.form !== 'int' || k.value.n <= 0 || r.value.n < 0) return 'wrong';
    if (k.value.n * k.value.n * r.value.n !== radicand) return 'wrong';
    return isPerfectSquare(radicand) ? 'threeq' : 'full';
  }
  return 'wrong';
}

const MARK_POINTS = { '✓': 1, '◐': 1, '¾': 0.75, '✗': 0 };

function vecParsed(a) {
  return [parseNumber(a?.x), parseNumber(a?.y)];
}

function vecEq(parsed, truth, matcher) {
  return parsed.every(Boolean) && matcher(parsed[0], truth[0]) && matcher(parsed[1], truth[1]);
}

// Marks one robot's sheet. `ans` maps item number to the student's entry.
export function markRobot(truth, ans, level) {
  const items = itemsForLevel(level);
  const allowMixed = level >= 3;
  const p = {};
  p[1] = parseNumber(ans[1]?.value);
  p[2] = vecParsed(ans[2]);
  p[3] = parseNumber(ans[3]?.value);
  p[4] = vecParsed(ans[4]);
  p[6] = parseNumber(ans[6]?.value);
  p[7] = parseNumber(ans[7]?.value);
  p[8] = vecParsed(ans[8]);

  // Whether each value (not the unit) equals the truth; drives ◐.
  const valueOK = {};
  const results = {};
  const leg = truth.legs[truth.highlightLeg - 1];
  const sqrtR = Math.sqrt(truth.radicand);

  const vecMatch = (parsed, t, avg) => {
    if (!parsed.every(Boolean)) return false;
    if (avg && !allowMixed && isMixedForm(parsed)) return false;
    return vecEq(parsed, t, avg ? matchesAverage : matchesExact);
  };

  // Student's own earlier values, when they parse.
  const own = {
    speed: p[1] && p[1].value.n !== 0 ? p[1].value : null,
    distance: p[3] ? p[3].value : null,
    disp: p[4].every(Boolean) ? [p[4][0].value, p[4][1].value] : null,
    time: p[6] && p[6].value.n !== 0 ? p[6].value : null,
  };

  for (const k of items) {
    const a = ans[k] || {};
    const unitOK = a.unit === ITEMS[k].unit;
    let ok = false; // value matches truth
    let half = false; // value matches the student's own earlier values
    let threeq = false;
    let label = null;
    const depsWrong = ITEMS[k].deps.some((d) => valueOK[d] === false);

    switch (k) {
      case 1:
        ok = matchesExact(p[1], truth.speed);
        break;
      case 2: {
        ok = vecMatch(p[2], truth.legVelocity, false);
        if (!ok && depsWrong && own.speed) {
          const ownV = [own.speed.mul(leg.dx).div(leg.length), own.speed.mul(leg.dy).div(leg.length)];
          half = vecMatch(p[2], ownV, true);
        }
        if (!ok && !half && p[2].every(Boolean)) {
          const t = truth.legVelocity;
          const sizeOK = p[2][0].value.abs().eq(t[0].abs()) && p[2][1].value.abs().eq(t[1].abs());
          if (sizeOK) label = 'Check the direction sign';
        }
        break;
      }
      case 3:
        ok = matchesExact(p[3], truth.distance);
        if (!ok && p[3] && Math.abs(p[3].value.toNumber() - sqrtR) < 0.5 && truth.distance !== Math.round(sqrtR))
          label = 'Distance and displacement mixed up';
        break;
      case 4: {
        const t = truth.disp.map((v) => new Frac(v));
        ok = vecMatch(p[4], t, false);
        if (!ok && p[4].every(Boolean)) {
          const [x, y] = p[4].map((q) => q.value);
          if (x.abs().eq(t[0].abs()) && y.abs().eq(t[1].abs())) label = 'Check the direction sign';
          else if (x.abs().eq(truth.pathSums[0]) && y.abs().eq(truth.pathSums[1])) label = 'Added path lengths instead of final − initial';
        }
        break;
      }
      case 5: {
        const j = judgeMagnitude(a, truth.radicand);
        ok = j === 'full';
        threeq = j === 'threeq';
        if (!ok && !threeq && depsWrong && own.disp && own.disp.every((v) => v.isInt())) {
          const ownR = own.disp[0].n ** 2 + own.disp[1].n ** 2;
          const jo = judgeMagnitude(a, ownR);
          half = jo === 'full';
          threeq = jo === 'threeq';
        }
        if (!ok && !half && !threeq) {
          const whole = a.form === 'whole' ? parseNumber(a.value) : null;
          if (whole && whole.value.eq(truth.distance) && truth.distance !== sqrtR) label = 'Distance and displacement mixed up';
          else if (a.form === 'whole' && !isPerfectSquare(truth.radicand)) label = 'Not a perfect square: use bentuk akar';
        }
        if (threeq) label = 'Perfect square: write it as bilangan bulat';
        break;
      }
      case 6:
        ok = matchesExact(p[6], truth.time);
        if (!ok && depsWrong && own.speed && own.distance) half = matchesAverage(p[6], own.distance.div(own.speed));
        if (!ok && !half && p[6] && own.speed && own.distance && p[6].value.eq(own.distance.mul(own.speed)))
          label = 'Multiplied instead of divided';
        break;
      case 7:
        ok = matchesAverage(p[7], truth.avgSpeed);
        if (!ok && depsWrong && own.distance && own.time) half = matchesAverage(p[7], own.distance.div(own.time));
        break;
      case 8: {
        ok = vecMatch(p[8], truth.avgVel, true);
        if (!ok && depsWrong && own.disp && own.time) half = vecMatch(p[8], [own.disp[0].div(own.time), own.disp[1].div(own.time)], true);
        if (!ok && !half && p[8].every(Boolean)) {
          const size = Math.hypot(p[8][0].value.toNumber(), p[8][1].value.toNumber());
          const straight = truth.legs.length === 1;
          if (!straight && Math.abs(size - truth.speed) < 0.2) label = 'Average velocity is not the speed';
          else if (!allowMixed && isMixedForm(p[8]) && vecEq(p[8], truth.avgVel, matchesAverage)) label = 'Use one form for both components';
        }
        break;
      }
      default:
        break;
    }

    valueOK[k] = ok || (k === 5 && threeq && !depsWrong);
    let mark;
    if (!unitOK) {
      mark = '✗';
      label = 'Unit missing or wrong';
    } else if (ok) mark = '✓';
    else if (threeq) mark = '¾';
    else if (half) mark = '◐';
    else mark = '✗';
    if (mark === '✗' && !label) label = `${ITEMS[k].name} is wrong`;
    if (mark === '✓' || mark === '◐') label = null;
    results[k] = { item: k, mark, points: MARK_POINTS[mark], label };
  }

  // Name the root errors behind each ◐: wrong-valued dependencies marked ✗.
  const roots = (k, acc = new Set()) => {
    for (const d of ITEMS[k].deps) {
      if (!results[d] || valueOK[d]) continue;
      if (results[d].mark === '✗') acc.add(d);
      else roots(d, acc);
    }
    return acc;
  };
  for (const k of items) {
    const r = results[k];
    if (r.mark === '◐' || (r.mark === '¾' && ITEMS[k].deps.some((d) => valueOK[d] === false))) r.causedBy = [...roots(k)];
  }
  return results;
}

export function predictionScore(sheets) {
  let pts = 0;
  let total = 0;
  for (const res of sheets) {
    for (const r of Object.values(res)) {
      pts += r.points;
      total += 1;
    }
  }
  return total ? Math.round((100 * pts) / total) : null;
}

// Marks one robot's sketch on one graph. `studentSpeed` (a Frac) enables ◐
// when the student's speed was wrong (combined mode).
export function markGraph(truth, kind, sketchPoints, studentSpeed) {
  const truePts = breakpoints(truth.log, kind);
  const has = (t, v) => sketchPoints.some((p) => p[0] === t && p[1] === v);
  const useOwn = studentSpeed && !studentSpeed.eq(truth.speed) && studentSpeed.n > 0;
  return truePts.map((bp) => {
    const t = bp.t.isInt() ? bp.t.n : null;
    if (t !== null && has(t, bp.v)) return { t: bp.t, v: bp.v, mark: '✓', points: 1 };
    if (useOwn) {
      const row = truth.log.find((r) => r.t.eq(bp.t));
      const ownT = new Frac(row.d).div(studentSpeed);
      // Nearest whole second, halves up.
      const rounded = Math.floor(ownT.toNumber() + 0.5 + 1e-9);
      if (has(rounded, bp.v)) return { t: bp.t, v: bp.v, mark: '◐', points: 1 };
    }
    return { t: bp.t, v: bp.v, mark: '✗', points: 0 };
  });
}

export function graphScore(markedLists) {
  const all = markedLists.flat();
  if (!all.length) return null;
  return Math.round((100 * all.reduce((s, m) => s + m.points, 0)) / all.length);
}

// Level 1: Robot A alone against the shortest route. Level 2 up: both robots
// against the two shortest routes, since the routes must differ.
export function routeScore(map, chosen) {
  const { shortest, second } = bestDistances(map);
  const ids = Object.keys(chosen);
  const dist = (id) => routeDistance(routePoints(map, chosen[id]));
  if (ids.length === 1) return Math.round((100 * shortest) / dist(ids[0]));
  return Math.round((100 * (shortest + second)) / ids.reduce((s, id) => s + dist(id), 0));
}

export { isqrt };

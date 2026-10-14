import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Frac } from '../src/core/fraction.js';
import { parseNumber, matchesAverage, isMixedForm } from '../src/core/answers.js';
import { routePoints, legsOf, segmentsConflict } from '../src/core/geometry.js';
import { buildLog, breakpoints, logToCSV } from '../src/core/motion.js';
import { enumerateRoutes, isValidRoute } from '../src/core/routes.js';
import { judgeMagnitude, markGraph, markRobot, pickHighlightLeg, predictionScore, robotTruth, routeScore } from '../src/core/marking.js';
import { validateMap } from '../src/core/validate.js';
import { loadMap, sheet } from './helpers.mjs';

test('fractions round to 1 decimal, halves away from zero', () => {
  assert.equal(new Frac(60, 7).round1().toString(), '43/5'); // 8.6
  assert.equal(new Frac(80, 7).round1().toDecimal(1), '11.4');
  assert.equal(new Frac(-60, 7).round1().toDecimal(1), '-8.6');
  assert.equal(new Frac(825, 100).round1().toDecimal(1), '8.3');
  assert.equal(new Frac(-825, 100).round1().toDecimal(1), '-8.3');
  assert.equal(new Frac(9, 2).toDecimal(), '4.5');
});

test('parses whole numbers, decimal commas and fractions', () => {
  assert.equal(parseNumber('20').form, 'int');
  assert.ok(parseNumber('8,6').value.eq(new Frac(43, 5)));
  assert.ok(parseNumber('−8.6').value.eq(new Frac(-43, 5)));
  assert.ok(parseNumber(' 60 / 7 ').value.eq(new Frac(60, 7)));
  assert.equal(parseNumber('+20').value.n, 20);
  assert.equal(parseNumber('abc'), null);
  assert.equal(parseNumber(''), null);
  assert.equal(parseNumber('1/0'), null);
});

test('average matching: exact fraction or 1-decimal rounding only', () => {
  const t = new Frac(60, 7);
  assert.ok(matchesAverage(parseNumber('60/7'), t));
  assert.ok(matchesAverage(parseNumber('8.6'), t));
  assert.ok(matchesAverage(parseNumber('8,6'), t));
  assert.ok(!matchesAverage(parseNumber('8.57'), t));
  assert.ok(!matchesAverage(parseNumber('9'), t));
  assert.ok(matchesAverage(parseNumber('10'), new Frac(10)));
  assert.ok(isMixedForm([parseNumber('60/7'), parseNumber('11.4')]));
  assert.ok(!isMixedForm([parseNumber('10'), parseNumber('13.3')]));
});

test('route points merge straight runs through junctions', () => {
  const map = loadMap('L1-2');
  assert.deepEqual(routePoints(map, ['S', 'q', 'x', 'u', 'v', 'F']), [[0, 0], [0, 90], [100, 90], [100, 60], [80, 60]]);
});

test('segments that cross away from nodes conflict', () => {
  assert.ok(segmentsConflict([0, 0], [10, 10], [0, 10], [10, 0]));
  assert.ok(!segmentsConflict([0, 0], [0, 10], [0, 10], [10, 10]));
  assert.ok(segmentsConflict([0, 0], [0, 20], [0, 10], [0, 30]));
  assert.ok(segmentsConflict([0, 0], [20, 0], [10, 0], [10, 10]));
});

test('Level 3 worked example log matches the spec', () => {
  const map = loadMap('L3-1');
  const rows = buildLog(routePoints(map, ['S', 'a', 'b', 'F']), 20, 'A');
  assert.equal(
    logToCSV(rows),
    ['t_s,robot,x_cm,y_cm,d_cm,vx_cm_s,vy_cm_s,leg', '0,A,0,0,0,0,20,1', '2,A,0,40,40,12,16,2', '4.5,A,30,80,90,20,0,3', '6,A,60,80,120,0,0,end'].join('\n'),
  );
});

test('Level 2 worked example breakpoints match the spec', () => {
  const map = loadMap('L2-2');
  const a = buildLog(routePoints(map, map.robots.A.route), 20, 'A');
  const b = buildLog(routePoints(map, map.robots.B.route), 10, 'B');
  const plain = (bps) => bps.map((p) => [p.t.toNumber(), p.v]);
  assert.deepEqual(plain(breakpoints(a, 'x')), [[0, 0], [4, 0], [7, 60]]);
  assert.deepEqual(plain(breakpoints(b, 'y')), [[0, 0], [2, -20], [8, -20], [18, 80]]);
  assert.deepEqual(plain(breakpoints(b, 'd')), [[0, 0], [2, 20], [8, 80], [18, 180]]);
});

test('route enumeration and validity', () => {
  const map = loadMap('L1-1');
  assert.deepEqual(enumerateRoutes(map).map((r) => r.distance), [140, 180, 260]);
  assert.ok(isValidRoute(map, ['S', 'a', 'g', 'F']));
  assert.ok(!isValidRoute(map, ['S', 'g', 'F']));
  assert.ok(!isValidRoute(map, ['S', 'a', 'g']));
});

test('item 5 forms', () => {
  assert.equal(judgeMagnitude({ form: 'whole', value: '100' }, 10000), 'full');
  assert.equal(judgeMagnitude({ form: 'akar', k: '', r: '10000' }, 10000), 'threeq');
  assert.equal(judgeMagnitude({ form: 'akar', k: '', r: '2900' }, 2900), 'full');
  assert.equal(judgeMagnitude({ form: 'akar', k: '10', r: '29' }, 2900), 'full');
  assert.equal(judgeMagnitude({ form: 'whole', value: '54' }, 2900), 'wrong');
  assert.equal(judgeMagnitude({ form: 'whole', value: '53.9' }, 2900), 'wrong');
});

const L2_A = { 1: 20, 2: [0, 20], 3: 140, 4: [60, 80], 5: { form: 'whole', value: '100' }, 6: 7, 7: 20, 8: ['60/7', '80/7'] };

test('Level 2 worked example sheet marks all correct', () => {
  const map = loadMap('L2-2');
  const truth = robotTruth({ ...map, robots: { ...map.robots, A: { ...map.robots.A, highlightLeg: 1 } } }, 'A', map.robots.A.route);
  const res = markRobot(truth, sheet(L2_A), 2);
  assert.deepEqual(Object.values(res).map((r) => r.mark), ['✓', '✓', '✓', '✓', '✓', '✓', '✓', '✓']);
  const dec = markRobot(truth, sheet({ ...L2_A, 8: ['8,6', '11.4'] }), 2);
  assert.equal(dec[8].mark, '✓');
});

test('mixed forms: wrong in Level 2, accepted in Level 3', () => {
  const map = loadMap('L2-2');
  const truth = robotTruth({ ...map, robots: { ...map.robots, A: { ...map.robots.A, highlightLeg: 1 } } }, 'A', map.robots.A.route);
  const l2 = markRobot(truth, sheet({ ...L2_A, 8: ['60/7', '11.4'] }), 2);
  assert.equal(l2[8].mark, '✗');
  assert.equal(l2[8].label, 'Use one form for both components');
  const l3 = markRobot(truth, sheet({ ...L2_A, 8: ['60/7', '11.4'] }), 3);
  assert.equal(l3[8].mark, '✓');
});

test('a wrong speed makes later items ◐ and is named as the root', () => {
  const map = loadMap('L2-2');
  const truth = robotTruth({ ...map, robots: { ...map.robots, A: { ...map.robots.A, highlightLeg: 1 } } }, 'A', map.robots.A.route);
  // Speed 10 instead of 20: time 14, average speed 10, average velocity (60/14, 80/14).
  const res = markRobot(truth, sheet({ ...L2_A, 1: 10, 2: [0, 10], 6: 14, 7: 10, 8: ['30/7', '40/7'] }), 2);
  assert.equal(res[1].mark, '✗');
  for (const k of [2, 6, 7, 8]) {
    assert.equal(res[k].mark, '◐', `item ${k}`);
    assert.deepEqual(res[k].causedBy, [1]);
  }
  assert.equal(predictionScore([res]), 88); // 7 of 8
});

test('misconception labels', () => {
  const map = loadMap('L1-4');
  const truth = robotTruth(map, 'B', map.robots.B.route);
  // B: right 30, up 90, left 70, down 30; displacement (-40, 60), leg 4 down at 20 cm/s.
  const res = markRobot(
    truth,
    sheet({ 1: 20, 2: [0, 20], 3: 220, 4: [100, 120], 5: { form: 'whole', value: '72' } }),
    1,
  );
  assert.equal(res[2].label, 'Check the direction sign');
  assert.equal(res[4].label, 'Added path lengths instead of final − initial');
  assert.equal(res[5].label, 'Not a perfect square: use bentuk akar');
  const unitless = markRobot(truth, { 1: { value: '20', unit: '' } }, 1);
  assert.equal(unitless[1].label, 'Unit missing or wrong');
  const mixed = markRobot(truth, sheet({ 3: 72 }), 1);
  assert.equal(mixed[3].label, 'Distance and displacement mixed up');
});

test('bentuk akar on a perfect square earns 3/4', () => {
  const map = loadMap('L1-2');
  const truth = robotTruth(map, 'A', map.robots.A.route);
  const res = markRobot(truth, sheet({ 1: 10, 2: [0, 10], 3: 140, 4: [80, 60], 5: { form: 'akar', k: '', r: '10000' } }), 1);
  assert.equal(res[5].mark, '¾');
  assert.equal(predictionScore([res]), 95);
});

test('highlight on student routes picks the first left or down leg', () => {
  const map = loadMap('L2-4');
  const legs = legsOf(routePoints(map, ['S', 'c', 'd', 'F']));
  assert.equal(pickHighlightLeg(legs, null), 3);
  const up = legsOf(routePoints(map, ['S', 'a', 'b', 'F']));
  assert.equal(pickHighlightLeg(up, null), 1);
});

test('graph ◐ follows the student speed in combined mode', () => {
  const map = loadMap('L2-2');
  const truth = robotTruth({ ...map, robots: { ...map.robots, A: { ...map.robots.A, highlightLeg: 1 } } }, 'A', map.robots.A.route);
  const own = markGraph(truth, 'x', [[0, 0], [8, 0], [14, 60]], new Frac(10));
  assert.deepEqual(own.map((m) => m.mark), ['✓', '◐', '◐']);
  const right = markGraph(truth, 'x', [[0, 0], [4, 0], [7, 60]], null);
  assert.deepEqual(right.map((m) => m.mark), ['✓', '✓', '✓']);
  const wrong = markGraph(truth, 'x', [[0, 0], [8, 0], [14, 60]], null);
  assert.deepEqual(wrong.map((m) => m.mark), ['✓', '✗', '✗']);
});

test('route scores', () => {
  const l1 = loadMap('L1-1');
  assert.equal(routeScore(l1, { A: ['S', 'a', 'g', 'F'] }), 100);
  assert.equal(routeScore(l1, { A: ['S', 'b', 'c', 'h', 'F'] }), 78);
  const l2 = loadMap('L2-3');
  assert.equal(routeScore(l2, { A: ['S', 'r', 's', 'F'], B: ['S', 'p', 'q', 'F'] }), 100);
  assert.equal(routeScore(l2, { A: ['S', 't', 'u', 'v', 'F'], B: ['S', 'p', 'q', 'F'] }), 86);
});

test('validator catches broken maps', () => {
  const map = loadMap('L1-1');
  assert.deepEqual(validateMap(map), []);
  // Two monotone routes of 40 cm around a square: a tied shortest route.
  const tie = {
    id: 'tie', level: 1, mode: 'path', start: 'S', finish: 'F', prompt: 'x',
    bounds: { xMin: -50, xMax: 50, yMin: -50, yMax: 50 },
    nodes: { S: [0, 0], a: [20, 0], b: [0, 20], F: [20, 20], c: [-20, 0], d: [-20, 40], e: [20, 40] },
    edges: [['S', 'a'], ['a', 'F'], ['S', 'b'], ['b', 'F'], ['S', 'c'], ['c', 'd'], ['d', 'e'], ['e', 'F']],
    robots: { A: { speed: 20, calibrationSeconds: 3, route: null }, B: { speed: 10, calibrationSeconds: 3, route: ['S', 'c', 'd', 'e', 'F'] } },
  };
  assert.ok(validateMap({ ...map, robots: { ...map.robots, B: { ...map.robots.B, speed: 20 } } }).some((e) => e.rule === 5));
  assert.ok(validateMap({ ...map, robots: { ...map.robots, B: { ...map.robots.B, route: ['S', 'a', 'g', 'F'] } } }).some((e) => e.rule === 10));
  assert.ok(validateMap(tie).some((e) => e.rule === 8));
  assert.ok(validateMap({ ...map, mode: 'combined' }).some((e) => e.rule === 'mode'));
  const diag = { ...map, edges: [...map.edges, ['S', 'h']] };
  assert.ok(validateMap(diag).some((e) => e.rule === 3 || e.rule === 2 || e.rule === 'edges'));
});

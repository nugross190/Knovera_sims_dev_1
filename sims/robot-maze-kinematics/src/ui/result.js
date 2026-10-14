// Result screen: marks only after run 1, the full reveal after the final run.

import { h, num } from './dom.js';
import { ROBOT_COLORS } from './mapView.js';
import { renderGraph } from './graphs.js';
import { truthOf, retry, reveal, bestScores, markClass } from './stage.js';
import { ITEMS, itemsForLevel } from '../core/marking.js';
import { isPerfectSquare, isqrt, routeDistance, routePoints } from '../core/geometry.js';
import { bestDistances } from '../core/routes.js';
import { breakpoints, logToCSV, GRAPH_LABELS } from '../core/motion.js';

const ROBOTS = ['A', 'B'];
const SCORE_NAMES = { route: 'Route', prediction: 'Prediction', graph: 'Graph' };

function frac(f) {
  return f.isInt() ? num(f.n) : `${num(f.n)}/${f.d} ≈ ${num(f.round1().toDecimal(1))}`;
}

function vec(v) {
  if (v.every((c) => (typeof c === 'number' ? true : c.isInt()))) return `(${v.map((c) => num(typeof c === 'number' ? c : c.n)).join(', ')})`;
  return `(${v.map((c) => `${num(c.n)}/${c.d}`).join(', ')}) ≈ (${v.map((c) => num(c.round1().toDecimal(1))).join(', ')})`;
}

function surd(R) {
  if (isPerfectSquare(R)) return `${isqrt(R)}`;
  let k = 1;
  for (let i = isqrt(R); i > 1; i -= 1) if (R % (i * i) === 0) {
    k = i;
    break;
  }
  return k > 1 ? `√${R} = ${k}√${R / (k * k)}` : `√${R}`;
}

export function trueValue(truth, k) {
  switch (k) {
    case 1: return `${truth.speed} cm/s`;
    case 2: return `${vec(truth.legVelocity)} cm/s`;
    case 3: return `${truth.distance} cm`;
    case 4: return `${vec(truth.disp)} cm`;
    case 5: return `${surd(truth.radicand)} cm`;
    case 6: return `${frac(truth.time)} s`;
    case 7: return `${frac(truth.avgSpeed)} cm/s`;
    case 8: return `${vec(truth.avgVel)} cm/s`;
    default: return '';
  }
}

function studentAnswer(k, a) {
  if (!a) return '—';
  const u = a.unit ? ` ${a.unit}` : ' (no unit)';
  if (k === 5) return a.form === 'whole' ? `${a.value}${u}` : a.form === 'akar' ? `${a.k || ''}√${a.r}${u}` : '—';
  if (ITEMS[k].vector) return `(${a.x}, ${a.y})${u}`;
  return `${a.value}${u}`;
}

function scoreTiles(st, att) {
  const keys = ['route', 'prediction', 'graph'].filter((k) => att[k] !== undefined);
  const best = bestScores(st);
  return h(
    'div',
    { class: 'score-tiles' },
    keys.map((k) =>
      h(
        'div',
        { class: 'tile' },
        h('div', { class: 'tile-label' }, `${SCORE_NAMES[k]} score`),
        h('div', { class: 'tile-value' }, String(st.final ? best[k] : att[k])),
        h('div', { class: 'tile-sub' }, st.final ? st.attempts.map((a, i) => `Run ${i + 1}: ${a[k]}`).join(' · ') : 'out of 100'),
      ),
    ),
  );
}

function sheetTable(st, att, id) {
  const truth = truthOf(st, id);
  const marks = att.sheets[id];
  const answers = att.answers[id];
  return h(
    'div',
    { class: 'card', style: { '--robot': ROBOT_COLORS[id] } },
    h('h3', {}, `Robot ${id}`),
    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'marks' },
        h('thead', {}, h('tr', {}, h('th', {}, '#'), h('th', {}, 'Item'), h('th', {}, 'Your answer'), st.final ? h('th', {}, 'True value') : null, h('th', {}, 'Mark'), h('th', {}, 'Note'))),
        h(
          'tbody',
          {},
          itemsForLevel(st.map.level).map((k) => {
            const m = marks[k];
            const note = [m.label, m.causedBy?.length ? `follows from item ${m.causedBy.join(', ')}` : null].filter(Boolean).join('; ');
            return h(
              'tr',
              {},
              h('td', {}, String(k)),
              h('td', {}, k === 2 ? `${ITEMS[k].name} (leg ${truth.highlightLeg})` : ITEMS[k].name),
              h('td', { class: 'mono' }, studentAnswer(k, answers[k])),
              st.final ? h('td', { class: 'mono' }, trueValue(truth, k)) : null,
              h('td', { class: `mark mark-${markClass(m.mark)}` }, m.mark),
              h('td', { class: 'small' }, note),
            );
          }),
        ),
      ),
    ),
  );
}

function routeSection(st, att) {
  const { shortest, second } = bestDistances(st.map);
  const parts = [h('h3', {}, 'Routes')];
  if (!st.final) {
    parts.push(h('p', {}, `Route score ${att.route}. 100 means ${st.chosen.length > 1 ? 'the two shortest routes (in either order)' : 'the shortest route'}.`));
  } else {
    parts.push(
      h(
        'ul',
        {},
        st.chosen.map((id) => h('li', {}, `Your route for Robot ${id}: ${routeDistance(routePoints(st.map, att.routes[id]))} cm`)),
        h('li', {}, st.chosen.length > 1 ? `The two shortest routes: ${shortest} cm and ${second} cm` : `The shortest route: ${shortest} cm`),
      ),
    );
  }
  return h('section', { class: 'card' }, parts);
}

function comparison(st) {
  const items = itemsForLevel(st.map.level);
  const t = { A: truthOf(st, 'A'), B: truthOf(st, 'B') };
  const rows = [[1, 'Speed'], [3, 'Distance'], [4, 'Displacement'], [5, 'Displacement magnitude'], [6, 'Total time'], [7, 'Average speed'], [8, 'Average velocity']].filter(([k]) => items.includes(k));
  return h(
    'section',
    { class: 'card' },
    h('h3', {}, 'Side by side'),
    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'compare' },
        h('thead', {}, h('tr', {}, h('th', {}, ''), ROBOTS.map((id) => h('th', { style: { color: ROBOT_COLORS[id] } }, `Robot ${id}`)))),
        h('tbody', {}, rows.map(([k, name]) => h('tr', {}, h('th', {}, name), ROBOTS.map((id) => h('td', { class: 'mono' }, trueValue(t[id], k)))))),
      ),
    ),
    h('p', { class: 'muted small' }, 'Same start, same finish: the displacement is the same for both robots, but the distance and time are not.'),
  );
}

function plainBreakpoints(truth, kind) {
  return breakpoints(truth.log, kind).map((b) => [b.t.toNumber(), b.v]);
}

function graphsSection(st, att) {
  const out = [];
  const kinds = att.sketch?.kinds || [];
  if (kinds.length) {
    out.push(h('h3', {}, st.final ? 'Your graphs and the true graphs' : 'Your graphs'));
    if (!st.final) out.push(h('p', { class: 'muted small' }, 'Green rings are breakpoints in the right place; red rings are not.'));
    for (const k of kinds) {
      const series = [];
      if (st.final) for (const id of ROBOTS) series.push({ robot: id, points: plainBreakpoints(truthOf(st, id), k), variant: 'true' });
      for (const id of ROBOTS) {
        const marks = att.graphs[k][id];
        const pts = [...att.sketch.points[k][id]].sort((a, b) => a[0] - b[0]);
        const right = marks.filter((m) => m.mark !== '✗').length;
        series.push({
          robot: id,
          points: pts,
          variant: 'student',
          pointMarks: pts.map((p) => marks.some((m) => m.mark !== '✗' && m.at === p[0] && m.v === p[1])),
          summary: `Robot ${id}: ${right} of ${marks.length} breakpoints right`,
        });
      }
      const box = h('div', { class: 'graph-box card' });
      renderGraph(box, { kind: k, ranges: st.ranges, series });
      box.append(h('p', { class: 'small muted' }, series.filter((x) => x.summary).map((x) => x.summary).join(' · ')));
      out.push(box);
    }
    if (st.final) out.push(h('p', { class: 'muted small' }, 'Thick faint lines are the true graphs; dots are your breakpoints.'));
  }
  if (st.final && st.map.level === 1) {
    out.push(h('h3', {}, 'True x-t and y-t graphs'), h('p', { class: 'muted small' }, 'Read-only: you will sketch these yourself from Level 2.'));
    for (const k of ['x', 'y']) {
      const box = h('div', { class: 'graph-box card' });
      renderGraph(box, { kind: k, ranges: st.ranges, series: ROBOTS.map((id) => ({ robot: id, points: plainBreakpoints(truthOf(st, id), k), variant: 'true-points' })) });
      out.push(box);
    }
  }
  return out.length ? h('section', {}, out) : null;
}

function logSection(st) {
  const rows = [...truthOf(st, 'A').log, ...truthOf(st, 'B').log];
  const csv = logToCSV(rows);
  const href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  const head = ['t (s)', 'robot', 'x (cm)', 'y (cm)', 'distance (cm)', 'vx (cm/s)', 'vy (cm/s)', 'leg'];
  return h(
    'section',
    { class: 'card' },
    h('h3', {}, 'Run log'),
    h('p', { class: 'muted small' }, 'One row per start, corner and end. The velocity is the one that begins at that row.'),
    h(
      'div',
      { class: 'table-wrap' },
      h(
        'table',
        { class: 'log' },
        h('thead', {}, h('tr', {}, head.map((x) => h('th', {}, x)))),
        h(
          'tbody',
          {},
          rows.map((r) =>
            h('tr', { style: { '--robot': ROBOT_COLORS[r.robot] }, class: 'log-row' }, [r.t.toDecimal(2), r.robot, r.x, r.y, r.d, r.vx.toDecimal(2), r.vy.toDecimal(2), r.leg].map((v) => h('td', { class: 'mono' }, num(v)))),
          ),
        ),
      ),
    ),
    h('a', { href, download: `${st.map.id}-run-log.csv`, class: 'button' }, 'Download CSV'),
  );
}

function explainSection(st) {
  return h(
    'section',
    { class: 'card explain' },
    h('h3', {}, 'Explain'),
    h('p', {}, st.map.prompt),
    h('textarea', { rows: 4, placeholder: 'Write your explanation (not graded).', 'aria-label': 'Your explanation', oninput: (e) => st.ctx.saveExplain(st.map.id, e.target.value) }, st.ctx.getExplain(st.map.id)),
  );
}

export function renderResult(st, panel) {
  const att = st.attempts[st.attempts.length - 1];
  const parts = [];
  if (!st.final) {
    parts.push(
      h('div', { class: 'intro' }, h('h2', {}, 'Run 1 marks'), h('p', {}, 'Marks only for now: no true values yet. Fix what you can and run again, or stop and see the answers. Each score keeps your better run.')),
    );
  } else {
    parts.push(h('div', { class: 'intro' }, h('h2', {}, 'Final result'), h('p', {}, st.attempts.length === 1 ? 'You stopped after run 1, so each score comes from that run.' : 'Each score is the better of your two runs.')));
  }
  parts.push(scoreTiles(st, att));
  if (att.route !== undefined) parts.push(routeSection(st, att));
  if (att.sheets) parts.push(h('section', {}, h('h3', {}, 'Answer sheet'), ROBOTS.map((id) => sheetTable(st, att, id))));
  parts.push(graphsSection(st, att));
  if (!st.final) {
    parts.push(
      h(
        'div',
        { class: 'nav-buttons' },
        h('button', { type: 'button', class: 'primary', onclick: () => retry(st) }, 'Correct and run again'),
        h('button', { type: 'button', onclick: () => reveal(st) }, 'Stop and see the answers'),
      ),
    );
  } else {
    parts.push(comparison(st), logSection(st), explainSection(st));
    const next = st.ctx.nextMapId(st.map.id);
    parts.push(
      h(
        'div',
        { class: 'nav-buttons' },
        next ? h('a', { href: `#/map/${next}`, class: 'button primary' }, `Next map: ${next} →`) : null,
        h('button', { type: 'button', onclick: () => st.ctx.restart(st.map.id) }, 'Play this map again'),
        h('a', { href: '#/', class: 'button' }, 'All levels'),
      ),
    );
  }
  panel.append(...parts.filter(Boolean));
}

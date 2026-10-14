// One stage (map): its state, the step bar and the step screens before the result.

import { h, s, clear, num } from './dom.js';
import { renderMap, ROBOT_COLORS } from './mapView.js';
import { renderGraph, graphRanges } from './graphs.js';
import { renderResult } from './result.js';
import { chosenRobots, usesGraphs } from '../core/validate.js';
import { ITEMS, UNITS, itemsForLevel, robotTruth, markRobot, markGraph, predictionScore, graphScore, routeScore } from '../core/marking.js';
import { isValidRoute, sameRoute } from '../core/routes.js';
import { routePoints } from '../core/geometry.js';
import { stateAt, GRAPH_KINDS, GRAPH_LABELS } from '../core/motion.js';
import { isFilled, parseNumber } from '../core/answers.js';

export const MODE_INFO = {
  path: { label: 'Path only', steps: ['route', 'run', 'result'], blurb: 'Choose the shortest route. No calculation.' },
  measurement: { label: 'Measurement', steps: ['calibrate', 'predict', 'run', 'result'], blurb: 'Calibrate, then predict both robots’ motion.' },
  graph: { label: 'Graph sketch', steps: ['sketch', 'run', 'result'], blurb: 'Speeds are given. Sketch the motion graphs.' },
  combined: { label: 'Combined', steps: ['calibrate', 'route', 'predict', 'sketch', 'run', 'result'], blurb: 'Every step, in order.' },
};

const STEP_LABELS = { calibrate: 'Calibrate', route: 'Choose routes', predict: 'Predict', sketch: 'Sketch graphs', run: 'Run', result: 'Result' };
const ROBOTS = ['A', 'B'];

let cancelAnim = null;

export function newStage(map, ctx) {
  const chosen = chosenRobots(map);
  const routes = {};
  for (const id of ROBOTS) routes[id] = map.robots[id].route ? [...map.robots[id].route] : [map.start];
  const emptyPoints = () => ({ A: [], B: [] });
  return {
    map,
    ctx,
    chosen,
    steps: MODE_INFO[map.mode].steps,
    step: MODE_INFO[map.mode].steps[0],
    runNo: 1,
    routes,
    activeRobot: chosen[0] || 'A',
    sheetRobot: 'A',
    calibrated: { A: false, B: false },
    answers: { A: {}, B: {} },
    sketch: { kinds: [], robot: 'A', points: { x: emptyPoints(), y: emptyPoints(), d: emptyPoints() } },
    attempts: [],
    final: false,
    message: null,
    ranges: usesGraphs(map) || map.level === 1 ? graphRanges(map) : null,
    truthCache: new Map(),
  };
}

export function truthOf(st, id) {
  const key = `${id}:${st.routes[id].join('>')}`;
  if (!st.truthCache.has(key)) st.truthCache.set(key, robotTruth(st.map, id, st.routes[id]));
  return st.truthCache.get(key);
}

function routesComplete(st) {
  return ROBOTS.every((id) => isValidRoute(st.map, st.routes[id])) && !sameRoute(st.routes.A, st.routes.B);
}

function sheetComplete(st, id) {
  const a = st.answers[id];
  return itemsForLevel(st.map.level).every((k) => {
    const e = a[k];
    if (!e || !e.unit) return false;
    if (k === 5) return e.form === 'whole' ? isFilled(e.value) : e.form === 'akar' && isFilled(e.r);
    return ITEMS[k].vector ? isFilled(e.x) && isFilled(e.y) : isFilled(e.value);
  });
}

function requiredBreakpoints(st, id) {
  return isValidRoute(st.map, st.routes[id]) ? routePoints(st.map, st.routes[id]).length : 0;
}

function stepDone(st, step) {
  switch (step) {
    case 'calibrate':
      return st.calibrated.A && st.calibrated.B;
    case 'route':
      return routesComplete(st);
    case 'predict':
      return ROBOTS.every((id) => sheetComplete(st, id));
    case 'sketch':
      return st.sketch.kinds.length > 0 && st.sketch.kinds.every((k) => ROBOTS.every((id) => st.sketch.points[k][id].length === requiredBreakpoints(st, id)));
    case 'run':
      return st.attempts.length >= st.runNo;
    default:
      return false;
  }
}

function canEnter(st, step) {
  if (step === 'result') return st.attempts.length >= st.runNo;
  if (st.attempts.length >= st.runNo) return false; // results are in; use the result buttons
  const i = st.steps.indexOf(step);
  return st.steps.slice(0, i).every((p) => stepDone(st, p));
}

function go(st, step) {
  st.step = step;
  st.message = null;
  renderStage(st);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextStep(st) {
  return st.steps[st.steps.indexOf(st.step) + 1];
}

// Rebuilds the stage screen.
export function renderStage(st) {
  if (cancelAnim) cancelAnim();
  cancelAnim = null;
  const { map } = st;
  const root = st.ctx.root;
  clear(root);

  const header = h(
    'header',
    { class: 'stage-header' },
    h('a', { href: '#/', class: 'back-link' }, '← All levels'),
    h('div', { class: 'stage-title' }, h('span', { class: 'map-id' }, map.id), h('h1', {}, map.title), h('span', { class: `mode-badge mode-${map.mode}` }, MODE_INFO[map.mode].label)),
    h('div', { class: 'run-indicator' }, st.final ? 'Final result' : `Run ${st.runNo} of 2`),
  );

  const stepper = h(
    'ol',
    { class: 'stepper' },
    st.steps.map((step, i) => {
      const current = step === st.step;
      const done = step !== 'result' && stepDone(st, step);
      const enabled = canEnter(st, step) && !current;
      return h(
        'li',
        { class: `${current ? 'current' : ''} ${done ? 'done' : ''}` },
        h('button', { type: 'button', disabled: !enabled, onclick: () => go(st, step), 'aria-current': current ? 'step' : null }, h('span', { class: 'step-num' }, done && !current ? '✓' : String(i + 1)), STEP_LABELS[step]),
      );
    }),
  );

  const mapPanel = h('div', { class: 'map-panel' });
  const stepPanel = h('div', { class: 'step-panel' });
  root.append(header, stepper, h('main', { class: 'stage-grid' }, mapPanel, stepPanel));

  const legend = h(
    'div',
    { class: 'map-legend' },
    ROBOTS.map((id) =>
      h('span', { class: 'legend-item' }, h('span', { class: `swatch ${st.chosen.includes(id) ? '' : 'dashed'}`, style: { borderColor: ROBOT_COLORS[id] } }), `Robot ${id} ${st.chosen.includes(id) ? '(your route)' : '(preset route)'}`),
    ),
  );

  const view = mapOptions(st);
  const mapHolder = h('div', { class: 'map-holder' });
  mapPanel.append(mapHolder, legend);
  const mapApi = renderMap(mapHolder, map, view);

  const screens = { calibrate: calibrateScreen, route: routeScreen, predict: predictScreen, sketch: sketchScreen, run: runScreen, result: renderResult };
  screens[st.step](st, stepPanel, mapApi);
}

function mapOptions(st) {
  const routes = {};
  for (const id of ROBOTS) routes[id] = { ids: st.routes[id], preset: !st.chosen.includes(id) };
  const opts = { routes };
  const complete = routesComplete(st);
  if (st.step === 'route') opts.building = { robot: st.activeRobot, onTap: (nodeId) => tapNode(st, nodeId) };
  if (['predict', 'sketch', 'result'].includes(st.step) && complete) opts.showLegs = true;
  if ((st.step === 'predict' || st.step === 'result') && complete && st.map.mode !== 'path' && st.map.mode !== 'graph') {
    opts.highlight = { A: truthOf(st, 'A').highlightLeg, B: truthOf(st, 'B').highlightLeg };
  }
  if (st.step === 'run') {
    const s0 = st.map.nodes[st.map.start];
    opts.robots = { A: { x: s0[0], y: s0[1] }, B: { x: s0[0], y: s0[1] } };
  }
  return opts;
}

function navButtons(st, { nextLabel, onNext, enabled } = {}) {
  const next = nextStep(st);
  const isRunNext = next === 'run';
  const ok = enabled ?? stepDone(st, st.step);
  return h(
    'div',
    { class: 'nav-buttons' },
    h(
      'button',
      { type: 'button', class: 'primary', disabled: !ok, onclick: onNext || (() => go(st, next)) },
      nextLabel || (isRunNext ? 'Go to the run →' : `Next: ${STEP_LABELS[next]} →`),
    ),
    !ok && isRunNext ? h('p', { class: 'muted small' }, 'Run stays locked until every earlier step is complete.') : null,
  );
}

function intro(title, ...lines) {
  return h('div', { class: 'intro' }, h('h2', {}, title), lines.filter(Boolean).map((l) => h('p', {}, l)));
}

// A status is '✓', '' or [text, done].
function tabStatus(status) {
  const [text, done] = Array.isArray(status) ? status : [status, status === '✓'];
  return h('span', { class: `tab-status ${done ? 'done' : ''}` }, text);
}

function robotToggle(current, onPick, statusOf) {
  return h(
    'div',
    { class: 'robot-toggle', role: 'tablist' },
    ROBOTS.map((id) =>
      h(
        'button',
        { type: 'button', role: 'tab', class: `robot-tab ${current === id ? 'active' : ''}`, 'aria-selected': current === id ? 'true' : 'false', style: { '--robot': ROBOT_COLORS[id] }, onclick: () => onPick(id) },
        h('span', { class: 'dot' }),
        `Robot ${id}`,
        statusOf ? tabStatus(statusOf(id)) : null,
      ),
    ),
  );
}

// ---------- Calibrate ----------

function calibrateScreen(st, panel) {
  panel.append(
    intro(
      'Calibrate',
      'Each robot drives a straight strip of known length. Read the length from the ruler and the time from the clock, then work out each robot’s speed.',
      'Press Play for both robots. You can replay them as often as you like.',
    ),
  );
  const nav = h('div');
  const refreshNav = () => {
    clear(nav).append(navButtons(st));
  };
  const maxLen = Math.max(...ROBOTS.map((id) => st.map.robots[id].speed * st.map.robots[id].calibrationSeconds));
  for (const id of ROBOTS) panel.append(calibrationStrip(st, id, maxLen, refreshNav));
  refreshNav();
  panel.append(nav);
}

function calibrationStrip(st, id, maxLen, onDone) {
  const r = st.map.robots[id];
  const L = r.speed * r.calibrationSeconds;
  const T = r.calibrationSeconds;
  const W = Math.max(130, maxLen + 14);
  const svg = s('svg', { viewBox: `-6 -16 ${W} 30`, class: 'strip-svg', role: 'img', 'aria-label': `Robot ${id} calibration strip` });
  svg.append(s('rect', { x: 0, y: -4, width: L, height: 8, class: 'strip' }));
  for (let x = 0; x <= L; x += 10) {
    svg.append(s('line', { x1: x, y1: 4, x2: x, y2: 7, class: 'tick' }));
    svg.append(s('text', { x, y: 12, 'text-anchor': 'middle', class: 'tick-label' }, String(x)));
  }
  svg.append(s('text', { x: L + 4, y: 12, class: 'tick-label' }, 'cm'));
  const token = s('g', { class: 'robot-token', transform: 'translate(0 0)' }, s('circle', { r: 4, fill: ROBOT_COLORS[id] }), s('text', { y: 1.4, 'text-anchor': 'middle' }, id));
  svg.append(token);
  const clock = h('div', { class: 'clock', 'aria-live': 'polite' }, '0 s');
  const status = h('span', { class: 'muted small' }, st.calibrated[id] ? 'Watched ✓' : 'Not played yet');
  let raf = null;
  const play = () => {
    if (raf) cancelAnimationFrame(raf);
    const t0 = performance.now();
    const tick = (now) => {
      const el = Math.min(T, (now - t0) / 1000);
      token.setAttribute('transform', `translate(${(el / T) * L} 0)`);
      clock.textContent = `${Math.floor(el + 1e-9)} s`;
      if (el < T) raf = requestAnimationFrame(tick);
      else {
        raf = null;
        st.calibrated[id] = true;
        status.textContent = 'Watched ✓';
        onDone();
      }
    };
    raf = requestAnimationFrame(tick);
  };
  return h(
    'div',
    { class: 'card calib-card', style: { '--robot': ROBOT_COLORS[id] } },
    h('div', { class: 'calib-head' }, h('strong', {}, `Robot ${id}`), status),
    h('div', { class: 'calib-body' }, svg, clock),
    h('button', { type: 'button', onclick: play }, '▶ Play'),
  );
}

// ---------- Choose routes ----------

function tapNode(st, nodeId) {
  const robot = st.activeRobot;
  const r = st.routes[robot];
  const before = r.join('>');
  if (r.length > 1 && r[r.length - 1] === nodeId) r.pop();
  else r.push(nodeId);
  if (r.join('>') !== before) clearSketch(st, robot);
  st.message = null;
  renderStage(st);
}

function clearSketch(st, robot) {
  for (const k of GRAPH_KINDS) st.sketch.points[k][robot] = [];
}

function routeScreen(st, panel) {
  const level1 = st.map.level === 1;
  panel.append(
    intro(
      'Choose routes',
      level1
        ? 'Build Robot A’s route from Start (S) to Finish (F). Tap a circled point to move there, or tap the last point again to undo. Robot B follows the dashed preset route.'
        : 'Build a route for each robot from Start (S) to Finish (F). Tap a circled point to move there, or tap the last point again to undo. The two robots must take different routes.',
      'Aim for the shortest route. The map does not add up lengths for you, so count the cm yourself.',
    ),
  );
  if (st.chosen.length > 1) {
    panel.append(
      robotToggle(st.activeRobot, (id) => {
        st.activeRobot = id;
        renderStage(st);
      }, (id) => (isValidRoute(st.map, st.routes[id]) ? '✓' : '')),
    );
  }
  const robot = st.activeRobot;
  const r = st.routes[robot];
  const complete = isValidRoute(st.map, r);
  panel.append(
    h(
      'div',
      { class: 'route-tools' },
      h('button', { type: 'button', disabled: r.length < 2, onclick: () => tapNode(st, r[r.length - 1]) }, '↶ Undo'),
      h('button', { type: 'button', disabled: r.length < 2, onclick: () => { st.routes[robot] = [st.map.start]; clearSketch(st, robot); renderStage(st); } }, 'Clear'),
    ),
  );
  let msg;
  if (complete && sameRoute(st.routes.A, st.routes.B)) msg = h('p', { class: 'notice warn' }, 'Both robots have the same route. Change one of them: the robots must take different routes.');
  else if (complete) msg = h('p', { class: 'notice ok' }, `Robot ${robot}’s route reaches the Finish.`);
  else msg = h('p', { class: 'notice' }, `Robot ${robot}: ${r.length - 1} step${r.length === 2 ? '' : 's'} so far. Keep going until you reach F.`);
  panel.append(msg, navButtons(st));
}

// ---------- Predict ----------

function unitSelect(value, onChange, label) {
  return h(
    'select',
    { class: 'unit', 'aria-label': `${label} unit`, onchange: (e) => onChange(e.target.value) },
    h('option', { value: '', selected: !value }, 'unit'),
    UNITS.map((u) => h('option', { value: u, selected: value === u }, u)),
  );
}

function textBox(value, onInput, label, cls = '') {
  return h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', class: `num ${cls}`, value: value || '', 'aria-label': label, oninput: (e) => onInput(e.target.value) });
}

function predictScreen(st, panel) {
  const level = st.map.level;
  panel.append(
    intro(
      'Predict',
      'Fill in the answer sheet for both robots. Every answer needs a unit, and signs matter for vectors (left and down are negative).',
      level >= 2 ? `Averages (items 7 and 8): write an exact fraction such as 60/7 or a decimal rounded to 1 place such as 8.6 or 8,6.${level < 3 ? ' Use the same form for both parts of a vector.' : ''}` : null,
    ),
  );
  const nav = h('div');
  const refresh = () => {
    clear(nav).append(navButtons(st));
    tabs.querySelectorAll('.robot-tab').forEach((b, i) => {
      const done = sheetComplete(st, ROBOTS[i]);
      const el = b.querySelector('.tab-status');
      el.textContent = done ? '✓' : '';
      el.classList.toggle('done', done);
    });
  };
  const tabs = robotToggle(st.sheetRobot, (id) => {
    st.sheetRobot = id;
    renderStage(st);
  }, (id) => (sheetComplete(st, id) ? '✓' : ''));
  panel.append(tabs);
  panel.append(answerSheet(st, st.sheetRobot, refresh));
  refresh();
  panel.append(nav);
}

function answerSheet(st, id, onChange) {
  const level = st.map.level;
  const truth = truthOf(st, id);
  const ans = st.answers[id];
  const prev = st.runNo > 1 ? st.attempts[0]?.sheets?.[id] : null;
  const set = (k, field, v) => {
    ans[k] = { ...(ans[k] || {}), [field]: v };
    onChange();
  };
  const rows = itemsForLevel(level).map((k) => {
    const a = ans[k] || {};
    const label = k === 2 ? `Velocity on leg ${truth.highlightLeg} (highlighted)` : ITEMS[k].name;
    let inputs;
    if (k === 5) {
      const formBox = h('div', { class: 'form-choice' });
      const drawInputs = () => {
        const cur = ans[5] || {};
        const box = formBox.querySelector('.form-inputs');
        clear(box);
        if (cur.form === 'whole') box.append(textBox(cur.value, (v) => set(5, 'value', v), 'Displacement magnitude, whole number'));
        else if (cur.form === 'akar') box.append(textBox(cur.k, (v) => set(5, 'k', v), 'Coefficient k', 'short'), h('span', { class: 'root' }, '√'), textBox(cur.r, (v) => set(5, 'r', v), 'Number under the root', 'short'));
      };
      const radio = (form, text) =>
        h('label', { class: 'radio' }, h('input', { type: 'radio', name: `form-${id}`, value: form, checked: a.form === form, onchange: () => { set(5, 'form', form); drawInputs(); } }), text);
      formBox.append(h('div', { class: 'radios' }, radio('whole', 'Bilangan bulat'), radio('akar', 'Bentuk akar (k√r)')), h('div', { class: 'form-inputs' }));
      drawInputs();
      inputs = formBox;
    } else if (ITEMS[k].vector) {
      inputs = h('div', { class: 'vector' }, '(', textBox(a.x, (v) => set(k, 'x', v), `${label} x component`), ',', textBox(a.y, (v) => set(k, 'y', v), `${label} y component`), ')');
    } else {
      inputs = textBox(a.value, (v) => set(k, 'value', v), label);
    }
    const p = prev?.[k];
    return h(
      'div',
      { class: 'sheet-row' },
      h('div', { class: 'item-label' }, h('span', { class: 'item-num' }, String(k)), label),
      h('div', { class: 'item-inputs' }, inputs, unitSelect(a.unit, (v) => set(k, 'unit', v), label)),
      p ? h('div', { class: `prev-mark mark-${markClass(p.mark)}` }, `Run 1: ${p.mark}`, p.label ? ` ${p.label}` : '', p.causedBy?.length ? ` (follows from item ${p.causedBy.join(', ')})` : '') : null,
    );
  });
  return h('div', { class: 'card sheet', style: { '--robot': ROBOT_COLORS[id] } }, h('h3', {}, `Robot ${id} answer sheet`), rows);
}

export function markClass(mark) {
  return { '✓': 'right', '◐': 'half', '¾': 'threeq', '✗': 'wrong' }[mark] || '';
}

// ---------- Sketch ----------

function sketchScreen(st, panel) {
  const given = st.map.mode === 'graph';
  panel.append(
    intro(
      'Sketch graphs',
      'Pick up to two graphs. For each robot, place one breakpoint at the start, at each corner and at the end. Points snap to 1 s and 10 cm, and the lines between them are drawn for you.',
      'Click a point again to remove it, or click above or below it to move it.',
    ),
  );
  if (given) {
    panel.append(
      h('p', { class: 'notice' }, 'Speeds are given: ', ROBOTS.map((id, i) => [i ? ' · ' : '', h('strong', { style: { color: ROBOT_COLORS[id] } }, `Robot ${id} ${st.map.robots[id].speed} cm/s`)])),
    );
  }
  const picker = h(
    'div',
    { class: 'graph-picker', role: 'group', 'aria-label': 'Choose graphs' },
    GRAPH_KINDS.map((k) => {
      const on = st.sketch.kinds.includes(k);
      return h(
        'button',
        {
          type: 'button',
          class: `toggle ${on ? 'on' : ''}`,
          'aria-pressed': on ? 'true' : 'false',
          onclick: () => {
            if (on) st.sketch.kinds = st.sketch.kinds.filter((x) => x !== k);
            else if (st.sketch.kinds.length >= 2) st.message = 'You can have at most two graphs. Turn one off first.';
            else st.sketch.kinds = [...st.sketch.kinds, k].sort((a, b) => GRAPH_KINDS.indexOf(a) - GRAPH_KINDS.indexOf(b));
            renderStage(st);
          },
        },
        GRAPH_LABELS[k],
      );
    }),
  );
  panel.append(picker);
  const counts = (id) => {
    const need = requiredBreakpoints(st, id);
    const placed = st.sketch.kinds.map((k) => st.sketch.points[k][id].length);
    return st.sketch.kinds.length ? [placed.map((n) => `${n}/${need}`).join(' · '), placed.every((n) => n === need)] : '';
  };
  panel.append(
    robotToggle(st.sketch.robot, (id) => {
      st.sketch.robot = id;
      renderStage(st);
    }, counts),
  );
  const msg = h('p', { class: 'notice warn', hidden: !st.message }, st.message || '');
  panel.append(msg);
  for (const k of st.sketch.kinds) {
    const box = h('div', { class: 'graph-box card' });
    panel.append(box);
    drawSketch(st, k, box, msg);
  }
  if (!st.sketch.kinds.length) panel.append(h('p', { class: 'muted' }, 'Choose a graph above to start sketching.'));
  panel.append(navButtons(st));
}

function drawSketch(st, kind, box, msg) {
  const robot = st.sketch.robot;
  renderGraph(box, {
    kind,
    ranges: st.ranges,
    series: ROBOTS.map((id) => ({ robot: id, points: st.sketch.points[kind][id], variant: 'student' })),
    edit: {
      robot,
      required: requiredBreakpoints(st, robot),
      points: st.sketch.points[kind][robot],
      onChange: (pts) => {
        st.sketch.points[kind][robot] = pts;
        st.message = null;
        renderStage(st);
      },
      onMessage: (text) => {
        msg.textContent = text;
        msg.hidden = false;
      },
    },
  });
}

// ---------- Run ----------

function runScreen(st, panel, mapApi) {
  const pts = { A: routePoints(st.map, st.routes.A), B: routePoints(st.map, st.routes.B) };
  const speeds = { A: st.map.robots.A.speed, B: st.map.robots.B.speed };
  const totals = { A: truthOf(st, 'A').time.toNumber(), B: truthOf(st, 'B').time.toNumber() };
  const end = Math.max(totals.A, totals.B);
  let t = 0;
  let rate = 1;
  let running = false;
  let raf = null;
  let last = 0;

  const clock = h('div', { class: 'clock big', 'aria-live': 'off' }, '0.0 s');
  const status = Object.fromEntries(ROBOTS.map((id) => [id, h('span', {}, 'waiting at Start')]));
  const startBtn = h('button', { type: 'button', class: 'primary', onclick: () => start() }, '▶ Start the run');
  const resultBtn = h('button', { type: 'button', class: 'primary', hidden: true, onclick: () => finishRun(st) }, 'See results →');
  const skipBtn = h('button', { type: 'button', disabled: true, onclick: () => { t = end; draw(); } }, 'Skip to end');
  const rateBtns = [1, 2, 4].map((r) =>
    h('button', { type: 'button', class: `toggle ${r === 1 ? 'on' : ''}`, onclick: (e) => { rate = r; rateBtns.forEach((b) => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, `${r}×`),
  );

  const draw = () => {
    clock.textContent = `${t.toFixed(1)} s`;
    for (const id of ROBOTS) {
      const p = stateAt(pts[id], speeds[id], t);
      mapApi.moveRobot(id, p.x, p.y);
      status[id].textContent = p.done ? `arrived at Finish (${totals[id].toFixed(1).replace(/\.0$/, '')} s)` : 'moving';
    }
    if (t >= end) {
      running = false;
      resultBtn.hidden = false;
      skipBtn.disabled = true;
    }
  };
  const frame = (now) => {
    if (!running) return;
    t = Math.min(end, t + ((now - last) / 1000) * rate);
    last = now;
    draw();
    if (running) raf = requestAnimationFrame(frame);
  };
  const start = () => {
    running = true;
    startBtn.hidden = true;
    skipBtn.disabled = false;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  cancelAnim = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
  };

  panel.append(
    intro('Run', `Both robots start together and follow their routes${st.map.mode === 'graph' ? '' : ' at their hidden speeds'}. Watch the clock.`),
    h('div', { class: 'card run-card' }, clock, h('ul', { class: 'run-status' }, ROBOTS.map((id) => h('li', {}, h('span', { class: 'dot', style: { background: ROBOT_COLORS[id] } }), h('strong', {}, `Robot ${id}: `), status[id])))),
    h('div', { class: 'run-controls' }, startBtn, h('div', { class: 'rate' }, h('span', { class: 'muted small' }, 'Playback'), rateBtns), skipBtn),
    resultBtn,
  );
}

function finishRun(st) {
  const { map } = st;
  const truths = { A: truthOf(st, 'A'), B: truthOf(st, 'B') };
  const att = {
    routes: { A: [...st.routes.A], B: [...st.routes.B] },
    answers: JSON.parse(JSON.stringify(st.answers)),
    sketch: JSON.parse(JSON.stringify(st.sketch)),
  };
  if (map.mode === 'path' || map.mode === 'combined') att.route = routeScore(map, Object.fromEntries(st.chosen.map((id) => [id, st.routes[id]])));
  if (map.mode === 'measurement' || map.mode === 'combined') {
    att.sheets = { A: markRobot(truths.A, st.answers.A, map.level), B: markRobot(truths.B, st.answers.B, map.level) };
    att.prediction = predictionScore([att.sheets.A, att.sheets.B]);
  }
  if (map.mode === 'graph' || map.mode === 'combined') {
    att.graphs = {};
    for (const k of st.sketch.kinds) {
      att.graphs[k] = {};
      for (const id of ROBOTS) {
        const own = map.mode === 'combined' ? parseNumber(st.answers[id][1]?.value)?.value || null : null;
        att.graphs[k][id] = markGraph(truths[id], k, st.sketch.points[k][id], own);
      }
    }
    att.graph = graphScore(Object.values(att.graphs).flatMap((g) => [g.A, g.B]));
  }
  st.attempts.push(att);
  if (st.runNo >= 2) st.final = true;
  st.ctx.saveBest(map.id, bestScores(st));
  go(st, 'result');
}

export function bestScores(st) {
  const out = {};
  for (const key of ['route', 'prediction', 'graph']) {
    const vals = st.attempts.map((a) => a[key]).filter((v) => v !== undefined && v !== null);
    if (vals.length) out[key] = Math.max(...vals);
  }
  return out;
}

export function retry(st) {
  st.runNo = 2;
  st.step = st.steps[0];
  st.message = null;
  renderStage(st);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function reveal(st) {
  st.final = true;
  renderStage(st);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export { num };

// Motion graphs: snap-grid sketching and true-graph overlays.

import { h, s, clear, svgPoint, num } from './dom.js';
import { ROBOT_COLORS } from './mapView.js';
import { GRAPH_LABELS } from '../core/motion.js';
import { enumerateRoutes } from '../core/routes.js';

const W = 600;
const H = 300;
const M = { left: 52, right: 14, top: 14, bottom: 40 };

const AXIS_TITLES = { x: 'x (cm)', y: 'y (cm)', d: 'distance (cm)' };

function niceStep(range, target) {
  const raw = range / target;
  for (const st of [1, 2, 5, 10, 20, 25, 50, 100]) if (st >= raw) return st;
  return 100;
}

// Axis ranges for a map, the same for every robot and independent of the
// hidden speeds (time axis assumes the slowest possible speed, 10 cm/s).
export function graphRanges(map) {
  const routes = enumerateRoutes(map);
  const maxDist = routes[routes.length - 1].distance;
  const b = map.bounds;
  return {
    tMax: Math.ceil(maxDist / 10 / 5) * 5,
    x: [Math.floor(b.xMin / 10) * 10, Math.ceil(b.xMax / 10) * 10],
    y: [Math.floor(b.yMin / 10) * 10, Math.ceil(b.yMax / 10) * 10],
    d: [0, Math.ceil(maxDist / 20) * 20],
  };
}

// opts: {
//   kind: 'x' | 'y' | 'd', ranges,
//   series: [{ robot, points: [[t, v]], variant: 'student' | 'true', pointMarks?: [bool] }],
//   edit: { robot, required, points, onChange(points), onMessage(text) }
// }
export function renderGraph(container, opts) {
  clear(container);
  const { kind, ranges } = opts;
  const [vMin, vMax] = ranges[kind];
  const tMax = ranges.tMax;
  const px = (t) => M.left + (t / tMax) * (W - M.left - M.right);
  const py = (v) => H - M.bottom - ((v - vMin) / (vMax - vMin)) * (H - M.top - M.bottom);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'graph-svg', role: 'img', 'aria-label': `${GRAPH_LABELS[kind]} graph` });

  const grid = s('g', { class: 'graph-grid' });
  const tStep = niceStep(tMax, 12);
  for (let t = 0; t <= tMax; t += 1) {
    grid.append(s('line', { x1: px(t), y1: py(vMin), x2: px(t), y2: py(vMax), class: t % tStep === 0 ? 'major' : 'minor' }));
    if (t % tStep === 0) grid.append(s('text', { x: px(t), y: H - M.bottom + 16, 'text-anchor': 'middle' }, String(t)));
  }
  const vStep = niceStep(vMax - vMin, 8);
  for (let v = vMin; v <= vMax; v += 10) {
    const major = v % vStep === 0;
    grid.append(s('line', { x1: px(0), y1: py(v), x2: px(tMax), y2: py(v), class: v === 0 ? 'zero' : major ? 'major' : 'minor' }));
    if (major) grid.append(s('text', { x: M.left - 6, y: py(v) + 4, 'text-anchor': 'end' }, num(v)));
  }
  grid.append(
    s('text', { x: (M.left + W - M.right) / 2, y: H - 6, 'text-anchor': 'middle', class: 'axis-title' }, 'time (s)'),
    s('text', { x: 14, y: (M.top + H - M.bottom) / 2, 'text-anchor': 'middle', class: 'axis-title', transform: `rotate(-90 14 ${(M.top + H - M.bottom) / 2})` }, AXIS_TITLES[kind]),
  );
  svg.append(grid);

  for (const ser of opts.series || []) {
    const pts = [...ser.points].sort((a, b) => a[0] - b[0]);
    const g = s('g', { class: `series ${ser.variant}` });
    if (pts.length > 1) g.append(s('polyline', { points: pts.map(([t, v]) => `${px(t)},${py(v)}`).join(' '), stroke: ROBOT_COLORS[ser.robot] }));
    pts.forEach(([t, v], i) => {
      const mark = ser.pointMarks ? ser.pointMarks[i] : null;
      const cls = mark === true ? 'pt right' : mark === false ? 'pt wrong' : 'pt';
      if (ser.variant === 'student' || ser.variant === 'true-points') g.append(s('circle', { cx: px(t), cy: py(v), r: ser.variant === 'student' ? 5 : 3, fill: ROBOT_COLORS[ser.robot], class: cls }));
    });
    svg.append(g);
  }

  if (opts.edit) {
    const { edit } = opts;
    const ghost = s('circle', { r: 6, class: 'ghost', stroke: ROBOT_COLORS[edit.robot], visibility: 'hidden' });
    svg.append(ghost);
    const snap = (evt) => {
      const p = svgPoint(svg, evt);
      const t = Math.round(((p.x - M.left) / (W - M.left - M.right)) * tMax);
      const v = Math.round((vMin + ((H - M.bottom - p.y) / (H - M.top - M.bottom)) * (vMax - vMin)) / 10) * 10;
      if (t < 0 || t > tMax || v < vMin || v > vMax) return null;
      return [t, v];
    };
    svg.addEventListener('pointermove', (e) => {
      const p = snap(e);
      if (!p) return ghost.setAttribute('visibility', 'hidden');
      ghost.setAttribute('cx', px(p[0]));
      ghost.setAttribute('cy', py(p[1]));
      ghost.setAttribute('visibility', 'visible');
    });
    svg.addEventListener('pointerleave', () => ghost.setAttribute('visibility', 'hidden'));
    svg.addEventListener('click', (e) => {
      const p = snap(e);
      if (!p) return;
      const pts = edit.points;
      const same = pts.findIndex((q) => q[0] === p[0]);
      if (same >= 0) {
        const next = pts[same][1] === p[1] ? pts.filter((_, i) => i !== same) : pts.map((q, i) => (i === same ? p : q));
        edit.onChange(next);
      } else if (pts.length < edit.required) {
        edit.onChange([...pts, p].sort((a, b) => a[0] - b[0]));
      } else {
        edit.onMessage?.(`All ${edit.required} breakpoints for Robot ${edit.robot} are placed. Click one to remove it, or click above or below it to move it.`);
      }
    });
    svg.classList.add('editable');
  }

  container.append(h('div', { class: 'graph-title' }, GRAPH_LABELS[kind]), svg);
  return svg;
}

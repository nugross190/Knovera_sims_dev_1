// Constant-speed motion along a route: run log, graph breakpoints, animation.

import { Frac } from './fraction.js';
import { legsOf } from './geometry.js';

// One row per start, corner and end. Velocity is the one that begins there.
export function buildLog(points, speed, robot) {
  const legs = legsOf(points);
  const rows = [];
  let t = new Frac(0);
  let d = 0;
  legs.forEach((leg) => {
    rows.push({
      robot,
      t,
      x: leg.from[0],
      y: leg.from[1],
      d,
      vx: new Frac(speed * leg.dx, leg.length),
      vy: new Frac(speed * leg.dy, leg.length),
      leg: leg.index,
    });
    t = t.add(new Frac(leg.length, speed));
    d += leg.length;
  });
  const end = points[points.length - 1];
  rows.push({ robot, t, x: end[0], y: end[1], d, vx: new Frac(0), vy: new Frac(0), leg: 'end' });
  return rows;
}

export const GRAPH_KINDS = ['x', 'y', 'd'];

export const GRAPH_LABELS = { x: 'x-t', y: 'y-t', d: 'distance-t' };

// Breakpoints for one graph: [{ t: Frac, v: number }].
export function breakpoints(rows, kind) {
  return rows.map((r) => ({ t: r.t, v: r[kind] }));
}

export function totalTime(points, speed) {
  return new Frac(legsOf(points).reduce((s, l) => s + l.length, 0), speed);
}

// Position at time t (seconds, a plain number), for animation.
export function stateAt(points, speed, t) {
  const legs = legsOf(points);
  let remaining = Math.max(0, t) * speed;
  let d = 0;
  for (const leg of legs) {
    if (remaining <= leg.length) {
      const f = remaining / leg.length;
      return { x: leg.from[0] + leg.dx * f, y: leg.from[1] + leg.dy * f, d: d + remaining, done: false, leg: leg.index };
    }
    remaining -= leg.length;
    d += leg.length;
  }
  const end = points[points.length - 1];
  return { x: end[0], y: end[1], d, done: true, leg: 'end' };
}

export const LOG_HEADER = 't_s,robot,x_cm,y_cm,d_cm,vx_cm_s,vy_cm_s,leg';

export function logToCSV(rows) {
  const lines = rows.map((r) => [r.t.toDecimal(2), r.robot, r.x, r.y, r.d, r.vx.toDecimal(2), r.vy.toDecimal(2), r.leg].join(','));
  return [LOG_HEADER, ...lines].join('\n');
}

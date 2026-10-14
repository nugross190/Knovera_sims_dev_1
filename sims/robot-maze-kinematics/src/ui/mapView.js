// The maze map: grid with cm axes, corridors, routes, legs and robots.

import { s, clear, num } from './dom.js';
import { legsOf, routePoints } from '../core/geometry.js';
import { adjacency } from '../core/routes.js';

export const ROBOT_COLORS = { A: 'var(--robot-a)', B: 'var(--robot-b)' };
const OFFSET = { A: [-1.6, 1.6], B: [1.6, -1.6] };
const PAD = { left: 16, right: 6, top: 6, bottom: 14 };

// opts: {
//   routes: { A: { ids, preset }, B: {...} }   ids may be partial while building
//   building: { robot, onTap(nodeId) }          makes reachable nodes tappable
//   showLegs: bool, highlight: { A: legIndex, B: legIndex }
//   robots: { A: {x, y}, B: {x, y} }            robot tokens
// }
export function renderMap(container, map, opts = {}) {
  clear(container);
  const b = map.bounds;
  const vbX = b.xMin - PAD.left;
  const vbY = -b.yMax - PAD.top;
  const vbW = b.xMax - b.xMin + PAD.left + PAD.right;
  const vbH = b.yMax - b.yMin + PAD.top + PAD.bottom;
  const Y = (y) => -y;
  const svg = s('svg', { viewBox: `${vbX} ${vbY} ${vbW} ${vbH}`, class: 'map-svg', role: 'img', 'aria-label': `Map ${map.title}` });

  // Walls fill the whole field; corridors are cut through them.
  svg.append(s('rect', { x: b.xMin, y: Y(b.yMax), width: b.xMax - b.xMin, height: b.yMax - b.yMin, class: 'wall' }));
  for (const [a, c] of map.edges) {
    const p = map.nodes[a];
    const q = map.nodes[c];
    svg.append(s('line', { x1: p[0], y1: Y(p[1]), x2: q[0], y2: Y(q[1]), class: 'corridor' }));
  }

  // Grid lines every 10 cm, labelled along the bottom and left edges.
  const grid = s('g', { class: 'grid' });
  const labels = s('g', { class: 'axis-labels' });
  const step = 10;
  for (let x = Math.ceil(b.xMin / step) * step; x <= b.xMax; x += step) {
    grid.append(s('line', { x1: x, y1: Y(b.yMin), x2: x, y2: Y(b.yMax), class: x === 0 ? 'axis-line' : '' }));
    labels.append(s('text', { x, y: Y(b.yMin) + 5, 'text-anchor': 'middle', class: x % 20 ? 'odd' : null }, num(x)));
  }
  for (let y = Math.ceil(b.yMin / step) * step; y <= b.yMax; y += step) {
    grid.append(s('line', { x1: b.xMin, y1: Y(y), x2: b.xMax, y2: Y(y), class: y === 0 ? 'axis-line' : '' }));
    labels.append(s('text', { x: b.xMin - 2, y: Y(y) + 1.2, 'text-anchor': 'end', class: y % 20 ? 'odd' : null }, num(y)));
  }
  labels.append(s('text', { x: (b.xMin + b.xMax) / 2, y: Y(b.yMin) + 11, 'text-anchor': 'middle', class: 'axis-title' }, 'x (cm)'));
  labels.append(
    s('text', { x: b.xMin - 13, y: Y((b.yMin + b.yMax) / 2), 'text-anchor': 'middle', class: 'axis-title', transform: `rotate(-90 ${b.xMin - 13} ${Y((b.yMin + b.yMax) / 2)})` }, 'y (cm)'),
  );
  svg.append(grid, labels);

  // Routes.
  const routes = opts.routes || {};
  for (const id of ['B', 'A']) {
    const r = routes[id];
    if (!r || !r.ids || r.ids.length < 1) continue;
    const [ox, oy] = OFFSET[id];
    const g = s('g', { class: `route route-${id}${r.preset ? ' preset' : ''}`, transform: `translate(${ox} ${oy})` });
    const pts = r.ids.length > 1 ? routePoints(map, r.ids) : [map.nodes[r.ids[0]]];
    if (pts.length > 1) {
      const legs = legsOf(pts);
      const hl = opts.highlight?.[id];
      if (hl && legs[hl - 1]) {
        const L = legs[hl - 1];
        g.append(s('line', { x1: L.from[0], y1: Y(L.from[1]), x2: L.to[0], y2: Y(L.to[1]), class: 'leg-highlight', stroke: ROBOT_COLORS[id] }));
      }
      g.append(s('polyline', { points: pts.map((p) => `${p[0]},${Y(p[1])}`).join(' '), class: 'route-line', stroke: ROBOT_COLORS[id] }));
      if (opts.showLegs) {
        for (const L of legs) {
          const mx = (L.from[0] + L.to[0]) / 2;
          const my = (L.from[1] + L.to[1]) / 2;
          const ang = (Math.atan2(-L.dy, L.dx) * 180) / Math.PI;
          g.append(s('path', { d: 'M -2.2 -1.8 L 2.2 0 L -2.2 1.8 Z', transform: `translate(${mx} ${Y(my)}) rotate(${ang})`, fill: ROBOT_COLORS[id], class: 'leg-arrow' }));
          // Label sits to the robot's side of the leg.
          const nx = (-L.dy / L.length) * 4.5 * (id === 'A' ? 1 : -1);
          const ny = (L.dx / L.length) * 4.5 * (id === 'A' ? 1 : -1);
          g.append(
            s('g', { class: `leg-label${hl === L.index ? ' is-highlight' : ''}`, transform: `translate(${mx + nx} ${Y(my + ny)})` },
              s('circle', { r: 2.8, fill: ROBOT_COLORS[id] }),
              s('text', { 'text-anchor': 'middle', y: 1.1 }, String(L.index)),
            ),
          );
        }
      }
    }
    svg.append(g);
  }

  // Nodes, with tappable ones while a route is being built.
  const tappable = new Set();
  if (opts.building) {
    const ids = routes[opts.building.robot]?.ids || [map.start];
    const last = ids[ids.length - 1];
    if (last !== map.finish) for (const n of adjacency(map).get(last)) if (!ids.includes(n)) tappable.add(n);
    if (ids.length > 1) tappable.add(last);
  }
  for (const [id, [x, y]] of Object.entries(map.nodes)) {
    if (id === map.start || id === map.finish) continue;
    svg.append(s('circle', { cx: x, cy: Y(y), r: 1.6, class: 'node' }));
  }
  const start = map.nodes[map.start];
  const finish = map.nodes[map.finish];
  svg.append(
    s('g', { class: 'marker start', transform: `translate(${start[0]} ${Y(start[1])})` }, s('circle', { r: 3.4 }), s('text', { y: 1.3, 'text-anchor': 'middle' }, 'S')),
    s('g', { class: 'marker finish', transform: `translate(${finish[0]} ${Y(finish[1])})` }, s('rect', { x: -3.4, y: -3.4, width: 6.8, height: 6.8, rx: 1 }), s('text', { y: 1.3, 'text-anchor': 'middle' }, 'F')),
  );
  if (opts.building) {
    const robot = opts.building.robot;
    const ids = routes[robot]?.ids || [map.start];
    const last = ids[ids.length - 1];
    for (const id of tappable) {
      const [x, y] = map.nodes[id];
      const isUndo = id === last;
      const target = s('g', {
        class: `tap-target${isUndo ? ' undo' : ''}`,
        transform: `translate(${x} ${Y(y)})`,
        tabindex: 0,
        role: 'button',
        'aria-label': isUndo ? 'Undo last point' : `Go to point (${x}, ${y})`,
        onclick: () => opts.building.onTap(id),
        onkeydown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            opts.building.onTap(id);
          }
        },
      });
      target.append(s('circle', { r: 7, class: 'hit' }), s('circle', { r: 3, class: 'ring', stroke: ROBOT_COLORS[robot] }));
      svg.append(target);
    }
  }

  // Robot tokens.
  const tokens = {};
  for (const id of ['B', 'A']) {
    const pos = opts.robots?.[id];
    if (!pos) continue;
    const t = s('g', { class: 'robot-token', transform: `translate(${pos.x} ${Y(pos.y)})` }, s('circle', { r: 4, fill: ROBOT_COLORS[id] }), s('text', { y: 1.4, 'text-anchor': 'middle' }, id));
    tokens[id] = t;
    svg.append(t);
  }
  container.append(svg);
  return {
    svg,
    moveRobot(id, x, y) {
      tokens[id]?.setAttribute('transform', `translate(${x} ${Y(y)})`);
    },
  };
}

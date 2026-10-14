// Grid geometry: routes, legs and lengths. All coordinates are in cm.

export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function lcm(a, b) {
  return (a / gcd(a, b)) * b;
}

export function isqrt(n) {
  if (n < 0) return NaN;
  let r = Math.floor(Math.sqrt(n));
  while (r * r > n) r -= 1;
  while ((r + 1) * (r + 1) <= n) r += 1;
  return r;
}

export function isPerfectSquare(n) {
  const r = isqrt(n);
  return r * r === n;
}

// 'axis', 'diag345' (any multiple of the 3-4-5 triple) or 'other'.
export function legKind(dx, dy) {
  if ((dx === 0) !== (dy === 0)) return 'axis';
  if (dx === 0 && dy === 0) return 'other';
  const g = gcd(dx, dy);
  const a = Math.abs(dx) / g;
  const b = Math.abs(dy) / g;
  if ((a === 3 && b === 4) || (a === 4 && b === 3)) return 'diag345';
  return 'other';
}

export function segmentLength(dx, dy) {
  const sq = dx * dx + dy * dy;
  const r = isqrt(sq);
  if (r * r !== sq) throw new Error(`Leg (${dx}, ${dy}) has no whole-number length`);
  return r;
}

function direction(dx, dy) {
  const g = gcd(dx, dy) || 1;
  return [dx / g, dy / g];
}

// Turns a list of node IDs into route points: a junction passed straight
// through is not a route point, so collinear edges merge into one leg.
export function routePoints(map, ids) {
  const pts = ids.map((id) => {
    const p = map.nodes[id];
    if (!p) throw new Error(`Unknown node ${id} in map ${map.id}`);
    return [p[0], p[1]];
  });
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i += 1) {
    const prev = out[out.length - 1];
    const cur = pts[i];
    if (out.length >= 2) {
      const before = out[out.length - 2];
      const [ax, ay] = direction(prev[0] - before[0], prev[1] - before[1]);
      const [bx, by] = direction(cur[0] - prev[0], cur[1] - prev[1]);
      if (ax === bx && ay === by) {
        out[out.length - 1] = cur;
        continue;
      }
    }
    out.push(cur);
  }
  return out;
}

export function legsOf(points) {
  const legs = [];
  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const dx = x1 - x0;
    const dy = y1 - y0;
    legs.push({ index: i, from: points[i - 1], to: points[i], dx, dy, length: segmentLength(dx, dy), kind: legKind(dx, dy) });
  }
  return legs;
}

export function routeDistance(points) {
  return legsOf(points).reduce((sum, leg) => sum + leg.length, 0);
}

// Proper crossing or overlap of two segments, ignoring shared endpoints.
export function segmentsConflict(p1, p2, q1, q2) {
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const onSeg = (a, b, p) =>
    Math.min(a[0], b[0]) <= p[0] && p[0] <= Math.max(a[0], b[0]) && Math.min(a[1], b[1]) <= p[1] && p[1] <= Math.max(a[1], b[1]);
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  const d1 = cross(q1, q2, p1);
  const d2 = cross(q1, q2, p2);
  const d3 = cross(p1, p2, q1);
  const d4 = cross(p1, p2, q2);
  if (d1 === 0 && d2 === 0) {
    // Collinear: conflict if they share more than a single endpoint.
    const pts = [p1, p2].filter((p) => onSeg(q1, q2, p)).concat([q1, q2].filter((q) => onSeg(p1, p2, q)));
    const unique = [];
    for (const p of pts) if (!unique.some((u) => same(u, p))) unique.push(p);
    return unique.length > 1;
  }
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  // Touching: an endpoint of one lies inside the other.
  const touches = (a, b, p, d) => d === 0 && onSeg(a, b, p) && !same(p, a) && !same(p, b);
  return touches(q1, q2, p1, d1) || touches(q1, q2, p2, d2) || touches(p1, p2, q1, d3) || touches(p1, p2, q2, d4);
}

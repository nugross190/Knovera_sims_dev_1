// Corridor graph: which routes exist from Start to Finish.

import { routeDistance, routePoints } from './geometry.js';

export function adjacency(map) {
  const adj = new Map(Object.keys(map.nodes).map((id) => [id, new Set()]));
  for (const [a, b] of map.edges) {
    adj.get(a).add(b);
    adj.get(b).add(a);
  }
  return adj;
}

// Every simple path (no point visited twice) from Start that stops at Finish.
export function enumerateRoutes(map) {
  const adj = adjacency(map);
  const routes = [];
  const path = [map.start];
  const seen = new Set(path);
  const walk = (id) => {
    if (id === map.finish) {
      routes.push([...path]);
      return;
    }
    for (const next of adj.get(id)) {
      if (seen.has(next)) continue;
      seen.add(next);
      path.push(next);
      walk(next);
      path.pop();
      seen.delete(next);
    }
  };
  walk(map.start);
  return routes.map((ids) => ({ ids, distance: routeDistance(routePoints(map, ids)) })).sort((a, b) => a.distance - b.distance);
}

export function isValidRoute(map, ids) {
  if (!ids || ids.length < 2 || ids[0] !== map.start || ids[ids.length - 1] !== map.finish) return false;
  if (new Set(ids).size !== ids.length) return false;
  const adj = adjacency(map);
  for (let i = 1; i < ids.length; i += 1) if (!adj.get(ids[i - 1])?.has(ids[i])) return false;
  return true;
}

export function sameRoute(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((id, i) => id === b[i]);
}

// The shortest and second-shortest distances among all valid routes.
export function bestDistances(map) {
  const routes = enumerateRoutes(map);
  return { shortest: routes[0]?.distance, second: routes[1]?.distance, routes };
}

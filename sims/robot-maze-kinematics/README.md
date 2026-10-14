# Robot Maze Kinematics Sandbox

A browser-based physics sandbox where students analyse how robots move through a maze. Students choose routes, calculate distance, displacement, speed, velocity and time, and sketch motion graphs. The robots already follow the track on their own; students never program them.

**Status:** Spec v0.3. Playable prototype of Levels 1-3 (12 maps, all four modes).

## Run it

The page loads its maps as JSON, so it has to be served rather than opened from disk:

```sh
cd sims/robot-maze-kinematics
npm run serve            # or: python3 -m http.server 8080
```

Then open <http://localhost:8080>. There is no build step and no dependencies.

```sh
npm test                 # core logic, checked against the spec's worked examples
npm run validate         # map design rules for every map (add -- --verbose for routes)
```

## Idea

Two robots with different speeds travel from the same Start to the same Finish along different routes. Students predict what will happen, watch the run, and compare their answers with the true motion. The two-robot setup makes the core contrasts visible: same displacement but different distance, time and average velocity.

## Levels

| Level | Segments | New physics | Maps |
| --- | --- | --- | --- |
| 1 | Up, down, left, right | Speed from a calibration strip, velocity on a leg, distance, displacement vector and magnitude | 2 path, 2 measurement |
| 2 | Same as Level 1 | Total time, average speed and velocity, and motion graphs (x-t, y-t, distance-t) | 1 each of path, measurement, graph sketch, combined |
| 3 | Adds diagonal legs | 3-4-5 family diagonals (Pythagoras only, no trigonometry) | 1 each of path, measurement, graph sketch, combined |
| 4-5 | Speed zones, then curves | Outside the current spec | |

## Modes

- **Path only:** choose the route, no calculation. Level 1: Robot A chosen, Robot B preset. Level 2 up: both chosen, always on different routes.
- **Measurement only:** calibrate, then fill in the answer sheet for preset routes.
- **Graph sketch only (Level 2 and up):** sketch graphs for preset routes with given speeds.
- **Combined (Level 2 and up):** all of the above in order.

## Core rules

- Units are cm. One grid cell is 10 cm. +x points right, +y points up, and the origin is the Start point.
- Robot speeds are 10, 20 or 30 cm/s and are hidden in measurement and combined modes.
- Displacement magnitude is 10√(a² + b²) cm for a finish offset of (10a, 10b) cm. Students choose bilangan bulat (whole number) or bentuk akar (surd form). Bentuk akar on a perfect square earns ¾ of the mark.
- Diagonals use the 3-4-5 family only (3-4-5, 6-8-10, 9-12-15 cells), so diagonal velocity components are whole numbers.
- Average speed and velocity are accepted as exact fractions or decimals rounded to 1 decimal (comma or point). One form per vector in Levels 1-2.

## Scoring

Up to three separate scores per stage: route, prediction and graph. A map allows two runs and each score takes its better value. After run 1 only marks are shown, with no true values, so run 2 is a real retry. A wrong speed does not cost marks twice: later items and graph breakpoints that follow correctly from it earn ◐.

## Code layout

| Path | What it is |
| --- | --- |
| [spec.md](spec.md) | The specification; the source of truth |
| `data/levels.json`, `data/maps/*.json` | Levels and maps as engine-neutral plain data |
| `src/core/` | Pure logic with no DOM: geometry, routes, run log, marking, map validator. Portable to Unity. |
| `src/ui/` | Browser UI: map, calibration, answer sheet, graph sketching, run and result screens |
| `test/` | `node --test` suite built from the spec's worked examples |
| `tools/validate-maps.mjs` | Command-line map validator |

### Map format

A map is a corridor graph: `nodes` are grid points in cm, `edges` are straight corridors between them, and a route is a list of node IDs from `start` to `finish`. A robot with `"route": null` is chosen by the student. In measurement maps each preset route names its `highlightLeg` for item 2. Run `npm run validate` after editing a map.

## Roadmap

1. ~~Define the data formats for maps and run logs.~~
2. ~~Hand-design Level 1 maps and check them against the map design rules.~~
3. ~~Build the Level 1 simulation: map screen, calibration, answer sheet, run and result.~~
4. ~~Add Level 2 (time, averages, graph modes), then Level 3 (diagonals).~~
5. Classroom trial; settle the UI (graph picker layout), the level unlock rule and the UI language.
6. More maps per level, then Levels 4-5.

## Platform

Browser (HTML) first. A fuller game pack in Unity is planned once enough simulations exist, so maps and logs stay as engine-neutral data and the core logic has no browser dependencies.

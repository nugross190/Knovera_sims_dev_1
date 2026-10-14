# Robot Maze Kinematics Sandbox

A browser-based physics sandbox where students analyse how robots move through a maze. Students choose routes, calculate distance, displacement, speed, velocity and time, and sketch motion graphs. The robots already follow the track on their own; students never program them.

**Status:** specification stage (Spec v0.2, Levels 1-3). No code yet.

## Idea

Two robots with different speeds travel from the same Start to the same Finish along different routes. Students predict what will happen, watch the run, and compare their answers with the true motion. The two-robot setup makes the core contrasts visible: same displacement but different distance, time and average velocity.

## Levels

| Level | Segments | New physics |
| --- | --- | --- |
| 1 | Up, down, left, right | Speed from a calibration strip, velocity on a leg, distance, displacement vector and magnitude |
| 2 | Same as Level 1 | Total time, average speed and velocity, and motion graphs (x-t, y-t, distance-t) |
| 3 | Adds diagonal legs | Pythagorean-triple diagonals (Pythagoras only, no trigonometry) |
| 4-5 | Speed zones, then curves | Outside the current spec |

## Modes

Every stage runs in one of four modes:

- **Path only:** choose the route, no calculation.
- **Measurement only:** calibrate, then fill in the answer sheet for preset routes.
- **Graph sketch only (Level 2 and up):** sketch graphs for preset routes with given speeds.
- **Combined:** all of the above in order.

In Level 1 Robot B's route is preset; from Level 2 students choose both routes.

## Core rules

- Units are cm. One grid cell is 10 cm. +x points right, +y points up, and the origin is the Start point.
- Robot speeds are 10, 20 or 30 cm/s and are hidden in measurement and combined modes.
- Displacement magnitude is 10√(a² + b²) cm for a finish offset of (10a, 10b) cm. Students choose bilangan bulat (whole number) or bentuk akar (surd form). Bentuk akar on a perfect square earns 3/4 of the mark.
- Every diagonal uses a Pythagorean triple (hypotenuse up to 17 cells, longest leg up to 15 cells).
- Average speed and velocity are accepted as exact fractions or decimals rounded to 1 decimal.

## Scoring

Up to three separate scores per stage: route, prediction and graph. A map allows two runs and each score takes its better value. After run 1 only marks are shown, with no true values, so run 2 is a real retry.

## Documentation

The full specification is in [spec.md](spec.md). It covers map design rules, the stage flow, answer sheets, scoring, the run log format, screens and worked examples, and it is the source of truth.

## Roadmap

1. Define the data formats for maps and run logs as plain data, so the engine can change later.
2. Hand-design two or three Level 1 maps and check them against the map design rules.
3. Build the Level 1 simulation: map screen, calibration, answer sheet, run and result.
4. Add Level 2 (time, averages, graph modes), then Level 3 (diagonals).
5. Settle the UI: graph picker, two-graph limit, level unlock rule.

## Platform

Browser (HTML) first. A fuller game pack in Unity is planned once enough simulations exist, so maps and logs stay as engine-neutral data.

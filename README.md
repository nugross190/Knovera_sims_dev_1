# Physics Sims

A collection of browser-based physics simulations for students. Each sim lives in its own folder under `sims/` with a README and a spec.

## Sims

| Sim | Topic | Status |
| --- | --- | --- |
| [Robot Maze Kinematics Sandbox](sims/robot-maze-kinematics/) | Distance, displacement, speed, velocity, motion graphs | Spec v0.3; playable prototype of Levels 1-3 |

## Conventions

- Browser (HTML) first. A Unity game pack is planned later, so maps, levels and logs stay as engine-neutral plain data.
- Each sim's `spec.md` is the source of truth for that sim.
- Sims are plain HTML and ES modules with no build step. Serve a sim's folder (for example `python3 -m http.server`) and open it in a browser.

# Physics Sims

A collection of browser-based physics simulations for students. Each sim lives in its own folder under `sims/` with a README and a spec.

## Sims

| Sim | Topic | Status |
| --- | --- | --- |
| [Robot Maze Kinematics Sandbox](sims/robot-maze-kinematics/) | Distance, displacement, speed, velocity, motion graphs | Spec v0.3; playable prototype of Levels 1-3 |

## Conventions

- Browser (HTML) first. A Unity game pack is planned later, so maps, levels and logs stay as engine-neutral plain data.
- Each sim's `spec.md` is the source of truth for that sim.
- Sims are plain HTML and ES modules with no build step.
- `index.html` at the repo root is the main menu, with one card per sim. Add a card when you add a sim.

## Run locally

Serve the repo root, then open <http://localhost:8080> for the main menu:

```sh
python3 -m http.server 8080
```

## Publish with GitHub Pages

Settings → Pages → Build and deployment → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`. The main menu is then at `https://<user>.github.io/<repo>/`. The empty `.nojekyll` file tells Pages to serve the files as they are.

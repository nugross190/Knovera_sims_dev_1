// Entry point: loads the level data, then routes between the level list and
// a stage.

import { h, clear } from './dom.js';
import { newStage, renderStage, MODE_INFO } from './stage.js';
import * as store from './store.js';

const root = document.getElementById('app');
let DATA = null;

async function load() {
  const levels = await (await fetch('data/levels.json')).json();
  const maps = {};
  await Promise.all(
    levels.levels.flatMap((l) => l.maps).map(async (id) => {
      maps[id] = await (await fetch(`data/maps/${id}.json`)).json();
    }),
  );
  return { levels: levels.levels, maps, order: levels.levels.flatMap((l) => l.maps) };
}

const ctx = {
  root,
  saveBest: store.saveBest,
  getExplain: store.getExplain,
  saveExplain: store.saveExplain,
  nextMapId: (id) => DATA.order[DATA.order.indexOf(id) + 1] || null,
  restart: (id) => startStage(id),
};

function scoreChips(best) {
  const names = { route: 'Route', prediction: 'Prediction', graph: 'Graph' };
  const keys = Object.keys(names).filter((k) => best[k] !== undefined);
  return keys.length ? keys.map((k) => h('span', { class: 'chip' }, `${names[k]} ${best[k]}`)) : 'Not played yet';
}

function renderHome() {
  clear(root);
  document.title = 'Robot Maze Kinematics';
  root.append(
    h(
      'header',
      { class: 'site-header' },
      h('h1', {}, 'Robot Maze Kinematics'),
      h('p', { class: 'lede' }, 'Two robots, one finish. Choose routes, measure, predict and sketch graphs, then run the robots and check your physics.'),
    ),
    h(
      'main',
      { class: 'home' },
      DATA.levels.map((level) =>
        h(
          'section',
          { class: 'level' },
          h('h2', {}, `Level ${level.level}: ${level.title}`),
          h('p', { class: 'muted' }, level.summary),
          h(
            'div',
            { class: 'map-cards' },
            level.maps.map((id) => {
              const map = DATA.maps[id];
              const best = store.getBest(id);
              return h(
                'a',
                { class: 'map-card', href: `#/map/${id}` },
                h('div', { class: 'map-card-top' }, h('span', { class: 'map-id' }, id), h('span', { class: `mode-badge mode-${map.mode}` }, MODE_INFO[map.mode].label)),
                h('div', { class: 'map-card-title' }, map.title),
                h('div', { class: 'map-card-blurb muted small' }, MODE_INFO[map.mode].blurb),
                h('div', { class: 'map-card-best' }, best ? scoreChips(best) : h('span', { class: 'muted small' }, 'Not played yet')),
              );
            }),
          ),
        ),
      ),
      h(
        'section',
        { class: 'card how' },
        h('h2', {}, 'How it works'),
        h(
          'ul',
          {},
          h('li', {}, 'Units are cm. One grid square is 10 cm. +x points right, +y points up, and Start is (0, 0).'),
          h('li', {}, 'Each map allows two runs. After run 1 you see marks only; the true values appear after the final run.'),
          h('li', {}, 'Turns are instant: a robot keeps its speed but changes its velocity at every corner.'),
        ),
      ),
    ),
  );
}

function startStage(id) {
  const map = DATA.maps[id];
  document.title = `${map.id} ${map.title} · Robot Maze Kinematics`;
  renderStage(newStage(map, ctx));
  window.scrollTo(0, 0);
}

function route() {
  const m = location.hash.match(/^#\/map\/([\w-]+)/);
  if (m && DATA.maps[m[1]]) startStage(m[1]);
  else renderHome();
}

load()
  .then((data) => {
    DATA = data;
    window.addEventListener('hashchange', route);
    route();
  })
  .catch((err) => {
    clear(root).append(
      h(
        'div',
        { class: 'card error' },
        h('h1', {}, 'Could not load the maps'),
        h('p', {}, 'Browsers block loading data files from a page opened straight from disk. Serve this folder instead, for example:'),
        h('pre', {}, 'npm run serve\n# or\npython3 -m http.server 8080'),
        h('p', { class: 'muted small' }, String(err)),
      ),
    );
  });

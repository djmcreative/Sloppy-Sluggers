import { PITCHERS } from '../data/encounters.js';
import { random, shuffle, pick } from './random.js';

export const MAP_VERSION = 2;
const RUN_TARGETS = [6, 6, 7, 7, 8, 8, 9, 9, 10];

// Adjacent layers share overlapping path bands. This produces splits and merges
// while guaranteeing that every node has an entrance and a route to the boss.
export function connectLayers(layers) {
  for (let row = 0; row < layers.length; row++) {
    const current = layers[row];
    const next = layers[row + 1];
    current.forEach((node, i) => {
      node.next = next
        ? next
            .filter((_, j) => {
              const overlap =
                Math.min((i + 1) / current.length, (j + 1) / next.length) -
                Math.max(i / current.length, j / next.length);
              return overlap > 0.00001;
            })
            .map((n) => n.id)
        : [];
    });
  }
}

export function generateMap(seed) {
  // Map generation never changes the encounter or card-draw random stream.
  const rng = { rng: (seed ^ 0x73a24b19) >>> 0 };
  let middle = shuffle(rng, [4, 2, 3, 4, 2, 3, 2]);
  for (
    let attempt = 0;
    attempt < 20 && middle.some((n, i) => n === (i ? middle[i - 1] : 3));
    attempt++
  ) {
    middle = shuffle(rng, middle);
  }
  const widths = [3, ...middle, 1];
  const layers = widths.map((count, row) => {
    const stops = shuffle(rng, ['event', 'shop', 'training', 'rest']);
    const spread =
      count === 2 ? 245 + random(rng) * 105 : count === 3 ? 380 + random(rng) * 90 : 500;
    const drift = (random(rng) - 0.5) * 35;
    return Array.from({ length: count }, (_, lane) => {
      const pitcher =
        row === 8 ? PITCHERS[6] : PITCHERS[Math.min(5, Math.floor(row / 2) + (lane % 2))];
      return {
        ...pitcher,
        id: `${row + 1}-${lane}`,
        inning: row + 1,
        lane,
        elite: false,
        target: RUN_TARGETS[row],
        stop: row === 2 || row === 5 ? 'rest' : stops[lane],
        next: [],
        x:
          row === 8
            ? 340
            : 340 +
              drift +
              (lane / Math.max(1, count - 1) - 0.5) * spread +
              (random(rng) - 0.5) * 16,
        y: 840 - row * 95 + (row === 8 ? 0 : (random(rng) - 0.5) * 14),
      };
    });
  });
  connectLayers(layers);
  for (let row = 1; row < 8; row++) {
    const candidates = layers[row].filter((node) =>
      layers[row - 1].every((parent) => !parent.next.includes(node.id) || parent.next.length > 1),
    );
    if (!candidates.length) continue;
    const elite = pick(rng, candidates);
    elite.elite = true;
    elite.target++;
    elite.art = 'Elite';
  }
  return layers;
}

// Keep an ongoing inning and every already chosen encounter intact when a player
// refreshes the original prototype. Only the road ahead receives the new layout.
export function migrateMap(run) {
  if (run.mapVersion === MAP_VERSION) return run;
  const generated = generateMap(run.seed);
  for (let row = 0; row < run.route.length; row++) {
    const old = run.map[row];
    if (!old) continue;
    generated[row] = old.map((node, i) => ({
      ...node,
      x: old.length === 1 ? 340 : 120 + (i * 440) / (old.length - 1),
      y: 840 - row * 95,
    }));
  }
  connectLayers(generated);
  run.map = generated;
  run.mapVersion = MAP_VERSION;
  return run;
}

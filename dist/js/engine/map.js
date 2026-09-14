import { TEAMS } from '../data/encounters.js';
import { random, shuffle } from './random.js';
export const MAP_VERSION = 3;
export function connectLayers(layers) {
  layers.forEach((row, r) =>
    row.forEach((node, i) => {
      node.next = (layers[r + 1] || [])
        .filter(
          (_, j) =>
            Math.min((i + 1) / row.length, (j + 1) / layers[r + 1].length) >
            Math.max(i / row.length, j / layers[r + 1].length) + 0.00001,
        )
        .map((n) => n.id);
    }),
  );
}
export function generateMap(seed, act = 1) {
  const rng = { rng: (seed ^ (0x73a24b19 + act * 101)) >>> 0 };
  const layers = [3, 2, 1].map((count, row) => {
    const stops = shuffle(rng, ['rest', 'training', 'shop']);
    return Array.from({ length: count }, (_, lane) => {
      const team = TEAMS[row === 2 ? act - 1 : (act - 1 + lane + row) % TEAMS.length];
      const boss = row === 2,
        elite = boss || (row === 0 && lane === 2) || (row === 1 && lane === 1);
      return {
        ...team,
        id: `${act}-${row + 1}-${lane}`,
        stage: row + 1,
        lane,
        boss,
        elite,
        name: boss
          ? `${TEAMS[act - 1].name} · Champions`
          : `${team.name}${elite ? ' · Enforcers' : ''}`,
        ...(boss
          ? {
              pitching: TEAMS[act - 1].pitching,
              batting: TEAMS[act - 1].batting,
              park: TEAMS[act - 1].park,
            }
          : {}),
        stop: stops[lane],
        x: count === 1 ? 340 : 125 + (lane * 430) / (count - 1) + (random(rng) - 0.5) * 24,
        y: 710 - row * 285,
        next: [],
      };
    });
  });
  connectLayers(layers);
  return layers;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { generateMap, migrateMap, MAP_VERSION } from '../dist/js/engine/map.js';
import { createRun, enterNode, reachable } from '../dist/js/engine/run.js';

test('Two hundred seeded maps branch, merge, and have no unreachable nodes or dead ends', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const map = generateMap(seed),
      nodes = map.flat();
    assert.equal(map.length, 9);
    assert.equal(map[8].length, 1);
    assert.ok(new Set(map.slice(0, 8).map((row) => row.length)).size >= 3);
    const incoming = new Map(nodes.map((n) => [n.id, 0]));
    let splits = 0;
    for (let row = 0; row < 8; row++)
      for (const node of map[row]) {
        assert.ok(node.next.length > 0);
        if (node.next.length > 1) splits++;
        assert.ok(node.next.some((id) => !map[row + 1].find((n) => n.id === id).elite));
        for (const id of node.next) {
          assert.ok(map[row + 1].some((n) => n.id === id));
          incoming.set(id, incoming.get(id) + 1);
        }
      }
    assert.ok(splits >= 2);
    assert.ok([...incoming.values()].filter((n) => n > 1).length >= 2);
    for (const node of nodes) {
      if (node.inning > 1) assert.ok(incoming.get(node.id) > 0);
      assert.ok(node.x >= 50 && node.x <= 630);
    }
    function paths(node) {
      return node.inning === 9
        ? 1
        : node.next.reduce((sum, id) => sum + paths(nodes.find((n) => n.id === id)), 0);
    }
    assert.ok(map[0].reduce((sum, n) => sum + paths(n), 0) > 3);
  }
});

test('Explicit edges control selection; screen adjacency cannot unlock an unconnected stop', () => {
  const run = createRun('dean', 7);
  enterNode(run, run.map[0][0].id);
  const previous = run.map[0][0];
  run.phase = 'map';
  run.inning = 2;
  for (const next of run.map[1])
    assert.equal(reachable(run, next), previous.next.includes(next.id));
  const disconnected = run.map[1].find((n) => !previous.next.includes(n.id));
  assert.ok(disconnected);
  assert.equal(enterNode(run, disconnected.id), false);
});

test('Map migration preserves current combat, deck, random stream, and chosen encounters', () => {
  const run = createRun('speed', 33);
  enterNode(run, '1-0');
  delete run.mapVersion;
  const original = structuredClone(run);
  migrateMap(run);
  assert.equal(run.mapVersion, MAP_VERSION);
  assert.deepEqual(run.battle, original.battle);
  assert.deepEqual(run.deck, original.deck);
  assert.deepEqual(run.route, original.route);
  assert.equal(run.rng, original.rng);
  assert.equal(run.stamina, original.stamina);
  assert.equal(run.map[0][0].name, original.map[0][0].name);
  const after = JSON.stringify(run);
  migrateMap(run);
  assert.equal(JSON.stringify(run), after);
});

test('Map generation is deterministic and differs between seeds', () => {
  assert.deepEqual(generateMap(87), generateMap(87));
  assert.notDeepEqual(generateMap(87), generateMap(88));
});

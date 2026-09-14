import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../dist/js/engine/run.js';
import { buildActRoute, ROUTE_HEIGHT } from '../dist/js/ui/route-layout.js';
import { routeScreen } from '../dist/js/ui/route.js';

test('The first map shows individual games and all four stop types across every series', () => {
  const r = R.createRun('dean', 42),
    { nodes, links } = buildActRoute(r);
  for (let stage = 1; stage <= 3; stage++) {
    assert.ok(nodes.some((n) => n.id === `game-${stage}-2`));
    assert.ok(nodes.some((n) => n.id === `game-${stage}-3`));
    for (let game = 1; game <= 3; game++)
      for (const stop of ['rest', 'training', 'shop', 'event']) {
        const n = nodes.find((n) => n.id === `stop-${stage}-${game}-${stop}`);
        assert.ok(n);
        assert.equal(n.active, false);
        assert.ok(links.some((l) => l.to === n));
      }
  }
  assert.equal(nodes.filter((n) => n.active).length, 3);
  assert.ok(nodes.filter((n) => n.active).every((n) => n.action === 'node'));
  assert.ok(nodes.every((n) => n.y > 0 && n.y < ROUTE_HEIGHT));
  const html = routeScreen(r);
  for (const name of ['Game 1', 'Game 2', 'Game 3', 'Rest site', 'Training', 'Shop', 'Event'])
    assert.ok(html.includes(name));
});

test('The same map progresses through game, stop and next game without moving its nodes', () => {
  const r = R.createRun('captain', 42),
    before = buildActRoute(r);
  R.enterNode(r, r.map[0][0].id);
  r.battle.status = 'won';
  R.finishBattle(r);
  R.chooseReward(r, 'skip');
  let map = buildActRoute(r);
  assert.equal(map.nodes.filter((n) => n.active).length, 4);
  assert.ok(map.nodes.filter((n) => n.active).every((n) => n.id.startsWith('stop-1-1-')));
  R.chooseStop(r, 'rest');
  R.takeRest(r, 'rest');
  map = buildActRoute(r);
  assert.deepEqual(
    map.nodes.filter((n) => n.active).map((n) => n.id),
    ['game-1-2'],
  );
  for (const node of map.nodes) {
    const old = before.nodes.find((n) => n.id === node.id);
    assert.equal(node.x, old.x);
    assert.equal(node.y, old.y);
  }
  assert.equal(r.stopHistory['1-1-1'], 'rest');
  R.nextGame(r);
  r.battle.status = 'won';
  R.finishBattle(r);
  R.chooseReward(r, 'skip');
  map = buildActRoute(r);
  assert.equal(map.nodes.find((n) => n.id === 'game-1-3').abandoned, true);
  assert.ok(map.links.some((l) => l.bypass));
  assert.ok(!map.nodes.some((n) => n.id.startsWith('stop-1-3-')));
  R.chooseStop(r, 'training');
  R.takeRest(r, 'rest');
  map = buildActRoute(r);
  assert.ok(map.nodes.find((n) => n.id === 'stop-1-1-rest').visited);
  const nextIds = r.map[1].filter((n) => R.reachable(r, n)).map((n) => n.id);
  assert.deepEqual(
    map.nodes.filter((n) => n.active).map((n) => n.actionId),
    nextIds,
  );
});

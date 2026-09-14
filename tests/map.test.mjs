import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../dist/js/engine/run.js';
import { generateMap } from '../dist/js/engine/map.js';
const begin = () => {
  const r = R.createRun('captain', 1);
  R.enterNode(r, r.map[0][0].id);
  return r;
};
const finish = (r, won) => {
  r.battle.score = { player: won ? 3 : 1, enemy: won ? 1 : 3 };
  r.battle.status = won ? 'won' : 'lost';
  R.finishBattle(r);
};
const recover = (r) => {
  R.chooseReward(r, 'skip');
  R.chooseStop(r, 'rest');
  R.takeRest(r, 'rest');
  R.nextGame(r);
};
test('One loss grants a comeback game against the same opponent; a second loss ends the run', () => {
  const r = begin(),
    id = r.opponent.id;
  finish(r, false);
  assert.equal(r.phase, 'reward');
  assert.equal(r.series.losses, 1);
  assert.equal(R.finishBattle(r), false);
  recover(r);
  assert.equal(r.phase, 'battle');
  assert.equal(r.battle.game, 2);
  assert.equal(r.battle.home, true);
  assert.equal(r.opponent.id, id);
  finish(r, false);
  assert.equal(r.phase, 'lost');
  assert.equal(r.stage, 1);
});
test('Win-loss-win takes a series and resets its record only when advancing', () => {
  const r = begin();
  finish(r, true);
  recover(r);
  finish(r, false);
  recover(r);
  assert.equal(r.battle.game, 3);
  assert.equal(r.battle.home, false);
  finish(r, true);
  assert.deepEqual(r.series, { wins: 2, losses: 1 });
  recover(r);
  assert.equal(r.stage, 2);
  assert.equal(r.phase, 'map');
  assert.deepEqual(r.series, { wins: 0, losses: 0 });
});
test('Nine best-of-three series progress through three acts to victory', () => {
  const r = R.createRun('dean', 44);
  for (let series = 0; series < 9; series++) {
    const node = r.map[r.stage - 1].find((n) => R.reachable(r, n));
    assert.ok(node);
    R.enterNode(r, node.id);
    finish(r, true);
    recover(r);
    finish(r, true);
    if (series < 8) recover(r);
  }
  assert.equal(r.phase, 'won');
  assert.equal(r.completed, 9);
  assert.equal(r.gamesWon, 18);
  assert.equal(r.act, 3);
});
test('Seeded maps split and merge, and have reachable regular alternatives before the boss', () => {
  for (let seed = 0; seed < 100; seed++)
    for (let act = 1; act <= 3; act++) {
      const map = generateMap(seed, act);
      assert.equal(map.length, 3);
      assert.equal(map[2].length, 1);
      for (let row = 0; row < 2; row++)
        for (const n of map[row]) {
          assert.ok(n.next.length);
          assert.ok(n.next.every((id) => map[row + 1].some((x) => x.id === id)));
        }
      for (let row = 1; row < 3; row++)
        for (const n of map[row]) assert.ok(map[row - 1].some((x) => x.next.includes(n.id)));
      assert.deepEqual(generateMap(seed, act), map);
      assert.ok(map[0].some((n) => !n.elite));
    }
});
test('Only connected nodes can be selected, and rewards/stops cannot be taken twice', () => {
  const r = begin();
  finish(r, true);
  const reward = r.rewards[0];
  const size = r.deck.length;
  R.chooseReward(r, reward.uid);
  assert.equal(R.chooseReward(r, reward.uid), false);
  assert.equal(r.deck.length, size + 1);
  assert.equal(R.chooseStop(r, 'shop'), true);
  assert.equal(R.chooseStop(r, 'rest'), false);
  r.cash = 100;
  const item = r.shop.cards[0];
  R.buy(r, 'card', item.card.uid);
  const money = r.cash;
  assert.equal(R.buy(r, 'card', item.card.uid), false);
  assert.equal(r.cash, money);
});

test('Every stop returns to a map phase; the next game requires selecting its node', () => {
  for (const stop of ['rest', 'training', 'shop', 'event']) {
    const r = begin();
    finish(r, false);
    assert.equal(R.nextGame(r), false);
    R.chooseReward(r, 'skip');
    assert.equal(R.nextGame(r), false);
    R.chooseStop(r, stop);
    assert.equal(R.nextGame(r), false);
    if (stop === 'shop') R.finishStop(r);
    else if (stop === 'event') R.takeEvent(r, 'safe');
    else R.takeRest(r, 'rest');
    assert.equal(r.phase, 'ready');
    assert.equal(r.battle.game, 1);
    assert.equal(r.seriesStops[0], stop);
    const stamina = r.stamina;
    assert.equal(R.finishStop(r), false);
    assert.equal(R.takeRest(r, 'rest'), false);
    assert.equal(R.nextGame(r), true);
    assert.equal(r.battle.game, 2);
    assert.equal(r.stamina, stamina - 10);
    assert.equal(R.nextGame(r), false);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRun,
  enterNode,
  finishBattle,
  chooseReward,
  buy,
  nextInning,
  reachable,
} from '../dist/js/engine/run.js';
import {
  addStrikes,
  addBalls,
  advanceRunners,
  hit,
  playCard,
  endTurn,
} from '../dist/js/engine/battle.js';
import { CARDS, definition, description, rewardPool } from '../dist/js/data/cards.js';
function setup(character = 'dean', seed = 13) {
  const run = createRun(character, seed);
  enterNode(run, '1-0');
  run.battle.target = 3;
  return { run, b: run.battle };
}

test('Strike overflow records outs and carries remaining strikes', () => {
  const { b } = setup();
  b.strikes = 2;
  addStrikes(b, 3);
  assert.equal(b.outs, 1);
  assert.equal(b.strikes, 2);
  assert.equal(b.balls, 0);
});
test('Three outs end play; additional strikes and turns cannot change state', () => {
  const { b } = setup();
  addStrikes(b, 12);
  assert.equal(b.status, 'lost');
  assert.equal(b.outs, 3);
  const before = JSON.stringify(b);
  assert.equal(endTurn(b), false);
  assert.equal(JSON.stringify(b), before);
});
test('A walk advances only forced runners and clears count', () => {
  const { b } = setup();
  b.bases = [false, true, true];
  b.strikes = 2;
  addBalls(b, 4);
  assert.deepEqual(b.bases, [true, true, true]);
  assert.equal(b.runs, 0);
  assert.equal(b.strikes, 0);
  addBalls(b, 4);
  assert.equal(b.runs, 1);
});
test('Singles and home runs move runners without overwriting', () => {
  const { b } = setup('captain');
  b.bases = [true, true, true];
  hit(b, 1);
  assert.equal(b.runs, 1);
  assert.deepEqual(b.bases, [true, true, true]);
  hit(b, 4);
  assert.equal(b.runs, 5);
  assert.deepEqual(b.bases, [false, false, false]);
  assert.equal(b.status, 'won');
});
test('A steal can score the lead runner while preserving trailing runners', () => {
  const { b } = setup();
  b.bases = [true, true, true];
  advanceRunners(b, 1, false);
  assert.equal(b.runs, 1);
  assert.deepEqual(b.bases, [true, true, false]);
});
test('Speedster perk fires only on the first single each turn', () => {
  const { b } = setup('speed');
  hit(b, 1);
  assert.deepEqual(b.bases, [false, true, false]);
  hit(b, 1);
  assert.deepEqual(b.bases, [true, false, true]);
});
test('Successful foul earns one draw next turn and resets foul', () => {
  const { b } = setup();
  b.pitch = { name: 'Test', strikes: 2 };
  b.foul = 2;
  endTurn(b);
  assert.equal(b.strikes, 0);
  assert.equal(b.hand.length, 6);
  assert.equal(b.foul, 0);
});
test('Unblockable pitches ignore foul and do not grant tempo', () => {
  const { b } = setup();
  b.pitch = { name: 'Corner', strikes: 1, pierce: true };
  b.foul = 50;
  endTurn(b);
  assert.equal(b.strikes, 1);
  assert.equal(b.hand.length, 5);
});
test('Bad Read stays out of the permanent deck', () => {
  const { run, b } = setup();
  b.pitch = { name: 'Curve', strikes: 0, junk: true };
  endTurn(b);
  assert.equal([...b.hand, ...b.drawPile].filter((c) => c.id === 'junk').length, 1);
  assert.equal(
    run.deck.some((c) => c.id === 'junk'),
    false,
  );
});
test('Winning hit resolves before later self-damage', () => {
  const { b } = setup();
  b.runs = 2;
  b.bases = [false, false, true];
  b.outs = 2;
  b.strikes = 2;
  b.hand = [{ id: 'muscle', uid: 'test' }];
  b.energy = 3;
  assert.equal(playCard(b, 'test'), true);
  assert.equal(b.status, 'won');
  assert.equal(b.outs, 2);
});
test('Illegal card IDs and insufficient energy have no side effects', () => {
  const { b } = setup();
  b.energy = 0;
  const before = JSON.stringify(b);
  assert.equal(playCard(b, 'missing'), false);
  const costly = b.hand.find((c) => definition(c).cost > 0);
  assert.equal(playCard(b, costly.uid), false);
  assert.equal(JSON.stringify(b), before);
});
test('Restoring serialized state preserves random draws and pitches', () => {
  const { b } = setup();
  const restored = JSON.parse(JSON.stringify(b));
  endTurn(b);
  endTurn(restored);
  assert.deepEqual(restored, b);
});
test('Every card and upgrade has valid display copy', () => {
  for (const id of Object.keys(CARDS)) {
    for (const upgraded of [false, true]) {
      const card = { id, upgraded };
      assert.ok(description(card).length > 0);
      assert.ok(Number.isFinite(definition(card).cost));
    }
  }
});
test('All character reward pools exclude other characters', () => {
  for (const c of ['dean', 'speed', 'captain'])
    for (const id of rewardPool(c)) {
      assert.ok(!CARDS[id].class || CARDS[id].class === c);
    }
});
test('Rewards are applied once and all legal routes contain exactly nine combats', () => {
  for (const lane of [0, 1, 2]) {
    const run = createRun('dean');
    for (let i = 1; i <= 9; i++) {
      const options = run.map[i - 1].filter((n) => reachable(run, n));
      const node = options[lane % options.length];
      assert.ok(reachable(run, node));
      assert.ok(enterNode(run, node.id));
      run.battle.status = 'won';
      run.battle.runs = node.target;
      assert.ok(finishBattle(run));
      assert.equal(finishBattle(run), false);
      if (i === 9) {
        assert.equal(run.phase, 'won');
        break;
      }
      chooseReward(run, 'skip');
      assert.equal(chooseReward(run, 'skip'), false);
      nextInning(run);
    }
    assert.equal(run.completed, 9);
  }
});
test('Shop purchases cannot duplicate and cannot spend unavailable cash', () => {
  const { run, b } = setup();
  b.node.stop = 'shop';
  b.status = 'won';
  finishBattle(run);
  chooseReward(run, 'skip');
  run.cash = 40;
  const uid = run.shop.cards[0].card.uid;
  const count = run.deck.length;
  assert.ok(buy(run, 'card', uid));
  assert.equal(run.cash, 0);
  assert.equal(run.deck.length, count + 1);
  assert.equal(buy(run, 'card', uid), false);
  assert.equal(buy(run, 'relic'), false);
});
test('Power card effects never stack beyond one', () => {
  const { b } = setup();
  b.hand = [
    { id: 'discipline', uid: 'a' },
    { id: 'discipline', uid: 'b' },
  ];
  playCard(b, 'a');
  playCard(b, 'b');
  assert.equal(b.powers.discipline, 1);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, enterNode } from '../dist/js/engine/run.js';
import {
  playCard,
  canPlay,
  endTurn,
  advanceHalf,
  recordOut,
  previewAtBat,
} from '../dist/js/engine/battle.js';
import { advance, baseHit, walk } from '../dist/js/engine/baseball.js';
import { CARDS, definition, description } from '../dist/js/data/cards.js';
const battle = (character = 'captain') => {
  const r = createRun(character, 123);
  enterNode(r, r.map[0][0].id);
  return r.battle;
};
const hold = (b, id) => {
  const c = { id, uid: 'fixture', upgraded: false };
  b.hand = [c];
  b.energy = 10;
  return c.uid;
};
test('Both teams use identical hit, walk and runner advancement rules', () => {
  const loaded = [true, true, true];
  assert.equal(baseHit(loaded, 4), 4);
  assert.deepEqual(loaded, [false, false, false]);
  const gap = [false, true, true];
  assert.equal(walk(gap), 0);
  assert.deepEqual(gap, [true, true, true]);
  assert.equal(walk(gap), 1);
  assert.deepEqual(gap, [true, true, true]);
  const lead = [true, true, true];
  assert.equal(advance(lead, 1, false), 1);
  assert.deepEqual(lead, [true, true, false]);
});
test('All 27 cards have fixed valid faces and meaningful upgrade copy', () => {
  assert.equal(Object.keys(CARDS).length, 27);
  for (const id of Object.keys(CARDS))
    for (const side of ['offense', 'defense'])
      for (const upgraded of [false, true]) {
        const c = { id, upgraded };
        assert.ok(definition(c, side).cost >= 0);
        assert.ok(description(c, side));
        assert.doesNotMatch(description(c, side), /undefined|NaN/);
      }
});
test('Three outs switch sides without ending the match; bases and exhausted cards reset', () => {
  const b = battle();
  b.score.player = 5;
  b.bases = [true, true, true];
  playCard(b, hold(b, 'load'));
  recordOut(b);
  recordOut(b);
  recordOut(b);
  assert.equal(b.status, 'switch');
  assert.equal(endTurn(b), false);
  advanceHalf(b);
  assert.equal(b.side, 'defense');
  assert.equal(b.inning, 1);
  assert.equal(b.outs, 0);
  assert.equal(b.score.player, 5);
  assert.deepEqual(b.bases, [false, false, false]);
  assert.equal(b.exhausted.length, 0);
  assert.equal(b.hand.length + b.drawPile.length, 12);
});
test('The same card uses the defensive face and its own energy cost after a side switch', () => {
  const b = battle();
  b.side = 'defense';
  const uid = hold(b, 'drive');
  b.energy = 1;
  assert.equal(canPlay(b, uid), true);
  playCard(b, uid);
  assert.equal(b.energy, 0);
  assert.equal(b.pitch, 1);
  assert.equal(b.contact, 0);
  const before = JSON.stringify(b);
  assert.equal(playCard(b, 'missing'), false);
  assert.equal(JSON.stringify(b), before);
});
test('An at-bat resolves one hit, not one hit per card; contact thresholds yield extra bases', () => {
  const b = battle();
  b.intent.strength = 4;
  b.contact = 6;
  assert.equal(previewAtBat(b).bases, 2);
  b.bases = [true, false, false];
  endTurn(b);
  assert.equal(b.score.player, 0);
  assert.deepEqual(b.bases, [false, true, true]);
  assert.equal(b.halfTurn, 2);
});
test('Pitch reduces Contact and Field removes hit bases; prediction matches scoring', () => {
  const b = battle();
  b.side = 'defense';
  b.intent.strength = 8;
  b.pitch = 3;
  b.field = 1;
  assert.equal(previewAtBat(b).bases, 2);
  b.bases = [false, false, true];
  endTurn(b);
  assert.equal(b.score.enemy, 1);
  b.intent.strength = 4;
  b.pitch = 2;
  b.field = 1;
  const outs = b.outs;
  assert.equal(previewAtBat(b).kind, 'out');
  endTurn(b);
  assert.equal(b.outs, outs + 1);
});
test('Double plays remove the runner on first and never record a fourth out', () => {
  const b = battle();
  b.side = 'defense';
  b.pitch = 99;
  b.doubleplay = true;
  b.bases = [true, false, false];
  b.outs = 1;
  endTurn(b);
  assert.equal(b.outs, 3);
  assert.equal(b.status, 'switch');
  assert.equal(b.bases[0], false);
  const c = battle();
  c.side = 'defense';
  c.pitch = 99;
  c.doubleplay = true;
  c.bases = [true, false, false];
  c.outs = 2;
  endTurn(c);
  assert.equal(c.outs, 3);
});
test('Pickoff can end a half immediately and further card effects cannot cross the transition', () => {
  const b = battle('speed');
  b.side = 'defense';
  b.outs = 2;
  b.bases = [false, true, false];
  playCard(b, hold(b, 'steal'));
  assert.equal(b.status, 'switch');
  assert.equal(b.outs, 3);
  assert.equal(b.bases[1], false);
});
test('Final-inning home advantage skips an unnecessary bottom half', () => {
  const b = battle();
  b.home = true;
  b.inning = 3;
  b.half = 0;
  b.side = 'defense';
  b.score = { player: 5, enemy: 3 };
  b.outs = 2;
  recordOut(b);
  assert.equal(b.status, 'won');
});
test('A home walk-off ends the game immediately, even when an advance card scores it', () => {
  const b = battle('speed');
  b.home = true;
  b.inning = 3;
  b.half = 1;
  b.lines = [
    { player: 0, enemy: 0 },
    { player: 0, enemy: 0 },
    { player: 0, enemy: 0 },
  ];
  b.score = { player: 2, enemy: 2 };
  b.bases = [false, false, true];
  playCard(b, hold(b, 'steal'));
  assert.equal(b.status, 'won');
  assert.equal(b.score.player, 3);
  assert.equal(endTurn(b), false);
});
test('A tied three-inning game gets exactly one bases-loaded showdown at-bat per team', () => {
  const b = battle();
  b.inning = 3;
  b.half = 1;
  b.side = 'defense';
  b.lines = [
    { player: 0, enemy: 0 },
    { player: 0, enemy: 0 },
    { player: 0, enemy: 0 },
  ];
  b.outs = 2;
  recordOut(b);
  assert.equal(b.status, 'switch');
  advanceHalf(b);
  assert.equal(b.showdown, true);
  assert.deepEqual(b.bases, [true, true, true]);
  b.contact = b.intent.strength + 6;
  endTurn(b);
  assert.equal(b.score.player, 4);
  assert.equal(b.status, 'switch');
  advanceHalf(b);
  b.pitch = b.intent.strength;
  endTurn(b);
  assert.equal(b.status, 'won');
  assert.equal(b.inning, 4);
});
test('Exact showdown ties use the published home-field rule without an endless loop', () => {
  const b = battle();
  b.inning = 4;
  b.lines.push({ player: 0, enemy: 0 }, { player: 0, enemy: 0 }, { player: 0, enemy: 0 });
  b.showdown = true;
  b.half = 1;
  b.side = 'defense';
  b.score = { player: 0, enemy: 0 };
  b.showdownMargins.player = 0;
  b.pitch = b.intent.strength;
  endTurn(b);
  assert.equal(b.status, 'lost');
  assert.match(b.log.join(' '), /Home field/);
});
test('Seeded saves resume exactly across a side switch and later random draws', () => {
  const a = battle();
  recordOut(a);
  recordOut(a);
  recordOut(a);
  const b = JSON.parse(JSON.stringify(a));
  advanceHalf(a);
  advanceHalf(b);
  endTurn(a);
  endTurn(b);
  assert.deepEqual(a, b);
});

test('Sacrifice advances resolve with the out, and cannot score on the third out', () => {
  const a = battle();
  a.bases = [false, false, true];
  playCard(a, hold(a, 'sacrifice'));
  assert.equal(a.score.player, 0);
  endTurn(a);
  assert.equal(a.score.player, 1);
  assert.equal(a.outs, 1);
  const b = battle();
  b.outs = 2;
  b.bases = [false, false, true];
  playCard(b, hold(b, 'sacrifice'));
  endTurn(b);
  assert.equal(b.score.player, 0);
  assert.equal(b.status, 'switch');
});
test('Defensive reductions are consumed only when applied; preview is read-only', () => {
  const b = battle('speed');
  b.side = 'defense';
  b.intent.strength = 7;
  b.pitch = 5;
  const before = JSON.stringify(b);
  assert.equal(previewAtBat(b).bases, 1);
  assert.equal(JSON.stringify(b), before);
  endTurn(b);
  assert.equal(b.speedUsed, false);
  b.intent.strength = 8;
  b.pitch = 5;
  b.relics = ['glove'];
  assert.equal(previewAtBat(b).bases, 0);
  endTurn(b);
  assert.equal(b.speedUsed, true);
  assert.equal(b.gloveUsed, true);
});
test('A walk-off single stops before the Speedster can score an extra runner', () => {
  const b = battle('speed');
  b.home = true;
  b.inning = 3;
  b.half = 1;
  b.side = 'offense';
  b.lines = [
    { player: 0, enemy: 0 },
    { player: 0, enemy: 0 },
    { player: 0, enemy: 0 },
  ];
  b.bases = [false, true, true];
  b.contact = b.intent.strength;
  endTurn(b);
  assert.equal(b.status, 'won');
  assert.equal(b.score.player, 1);
});
test('Forced outcomes use the same displayed Contact margin in a showdown', () => {
  const b = battle();
  b.contact = 5;
  b.intent.strength = 8;
  b.forced = 'walk';
  assert.equal(previewAtBat(b).margin, -3);
  b.side = 'defense';
  b.pitch = 6;
  assert.equal(previewAtBat(b).margin, 2);
});

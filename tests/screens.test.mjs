import test from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../dist/js/ui/screens.js';
import { deckContent, helpContent } from '../dist/js/ui/modals.js';
import * as R from '../dist/js/engine/run.js';
import { recordOut, advanceHalf } from '../dist/js/engine/battle.js';
const check = (s) => {
  assert.doesNotMatch(s, /undefined|NaN/);
  assert.ok(s.length > 100);
};
test('Title, roster, route, paired deck and help render with new mechanics', () => {
  check(S.titleScreen('dean', null));
  check(helpContent());
  for (const c of ['dean', 'speed', 'captain']) {
    const r = R.createRun(c, 1);
    check(S.rosterScreen(c));
    check(S.mapScreen(r));
    const d = deckContent(r);
    check(d);
    assert.match(d, /OFFENSE/);
    assert.match(d, /DEFENSE/);
  }
});
test('Field swaps player and enemy poses after three outs and exposes the new active card face', () => {
  const r = R.createRun('dean', 1);
  R.enterNode(r, r.map[0][0].id);
  let s = S.battleScreen(r);
  check(s);
  assert.match(s, /YOU BAT/);
  assert.match(s, /bruiser-pitching/);
  assert.doesNotMatch(s, /card-reverse|Reverse:/);
  assert.match(s, /Scrapyard Bruisers \(H\)/);
  assert.match(s, /player-unit at-plate/);
  recordOut(r.battle);
  recordOut(r.battle);
  recordOut(r.battle);
  check(S.battleScreen(r));
  assert.match(S.battleScreen(r), /SWITCH SIDES/);
  advanceHalf(r.battle);
  s = S.battleScreen(r);
  check(s);
  assert.match(s, /YOU PITCH/);
  assert.match(s, /dean-pitching/);
  assert.match(s, /bruiser-batting/);
  assert.doesNotMatch(s, /card-reverse|Reverse:/);
  assert.match(s, /player-unit at-mound/);
  assert.match(S.battleScreen(r, true, true), /side-transition/);
  assert.doesNotMatch(deckContent(r, 'view', 'drawPile'), /card-reverse/);
});
test('Every reward, dugout, service and result screen renders from its public phase', () => {
  for (const stop of ['rest', 'training', 'shop', 'event']) {
    const r = R.createRun('captain', 1);
    R.enterNode(r, r.map[0][0].id);
    r.battle.status = 'won';
    R.finishBattle(r);
    check(S.rewardScreen(r));
    assert.match(S.rewardScreen(r), /card-reverse/);
    R.chooseReward(r, 'skip');
    check(S.mapScreen(r));
    assert.match(S.mapScreen(r), /Games and branching stops map/);
    assert.equal(
      (S.mapScreen(r).match(/class="journey-node route-stop available/g) || []).length,
      4,
    );
    R.chooseStop(r, stop);
    check(
      { rest: S.restScreen, training: S.restScreen, shop: S.shopScreen, event: S.eventScreen }[
        stop
      ](r),
    );
  }
  const r = R.createRun('speed', 1);
  R.enterNode(r, r.map[0][0].id);
  r.phase = 'lost';
  check(S.endScreen(r));
  r.phase = 'won';
  check(S.endScreen(r));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, enterNode, finishBattle, chooseReward } from '../dist/js/engine/run.js';
import * as Screens from '../dist/js/ui/screens.js';
import { deckContent, helpContent } from '../dist/js/ui/modals.js';

function checkMarkup(markup) {
  assert.ok(markup.length > 100);
  assert.doesNotMatch(markup, /\bundefined\b|\bNaN\b/);
  assert.equal(
    (markup.match(/<button\b/g) || []).length,
    (markup.match(/<\/button\s*>/g) || []).length,
  );
}

test('Title, each roster, deck inspection, and route render from their public state', () => {
  checkMarkup(Screens.titleScreen('dean', null));
  checkMarkup(helpContent());
  for (const id of ['dean', 'speed', 'captain']) {
    const run = createRun(id, 19);
    checkMarkup(Screens.rosterScreen(id));
    checkMarkup(deckContent(run));
    checkMarkup(Screens.mapScreen(run));
    enterNode(run, '1-0');
    const battle = Screens.battleScreen(run);
    checkMarkup(battle);
    assert.equal((battle.match(/--fan-x:/g) || []).length, 5);
  }
});

test('Reward and every between-inning screen render valid choices', () => {
  for (const stop of ['rest', 'training', 'event', 'shop']) {
    const run = createRun('dean', 4);
    enterNode(run, '1-0');
    run.battle.node.stop = stop;
    run.battle.status = 'won';
    run.battle.runs = run.battle.target;
    finishBattle(run);
    checkMarkup(Screens.rewardScreen(run));
    chooseReward(run, 'skip');
    checkMarkup(
      stop === 'shop'
        ? Screens.shopScreen(run)
        : stop === 'event'
          ? Screens.eventScreen(run)
          : Screens.restScreen(run),
    );
  }
});

test('Final result and pile inspection tolerate empty piles', () => {
  const run = createRun('speed', 8);
  enterNode(run, '1-0');
  for (const pile of ['drawPile', 'discard', 'exhausted'])
    checkMarkup(deckContent(run, 'view', pile));
  run.battle.status = 'lost';
  finishBattle(run);
  checkMarkup(Screens.endScreen(run));
  run.phase = 'won';
  run.completed = 9;
  checkMarkup(Screens.endScreen(run));
});

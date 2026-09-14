import { writeFile } from 'node:fs/promises';
import * as R from '../dist/js/engine/run.js';
import { canPlay, playCard, endTurn, advanceHalf, previewAtBat } from '../dist/js/engine/battle.js';
import { baseHit, walk } from '../dist/js/engine/baseball.js';
import { definition } from '../dist/js/data/cards.js';

// A deterministic one-card lookahead. It cannot see future draws or enemy intents.
function value(b) {
  if (b.status === 'won') return 100000;
  if (b.status === 'lost') return -100000;
  const offense = b.side === 'offense',
    result = previewAtBat(b),
    bases = [...b.bases];
  const projected =
    result.kind === 'hit' ? baseHit(bases, result.bases) : result.kind === 'walk' ? walk(bases) : 0;
  const runners = bases.reduce((v, on, i) => v + (on ? [2, 4, 6][i] : 0), 0);
  const outcome =
    result.kind === 'out'
      ? -12
      : projected * 26 + runners + (result.kind === 'walk' ? 5 : 6 + result.bases * 4);
  const progress = offense
    ? Math.min(b.contact, b.intent.strength + 6)
    : Math.min(b.pitch, b.intent.strength);
  return (
    (b.score.player - b.score.enemy) * 30 +
    (offense ? outcome : -outcome) +
    progress * 0.8 +
    b.field * 0.2 +
    b.energy * 0.9 +
    b.hand.length * 0.7 +
    b.nextContact * 1.7 +
    b.nextPitch * 1.7 +
    (b.powers.rhythm ? Math.max(1, 6 - b.halfTurn) : 0) +
    (offense ? -b.totalOuts : b.totalEnemyOuts) * 4
  );
}
export function selectCard(b, policy = 'tactical') {
  const legal = b.hand.filter((c) => canPlay(b, c.uid));
  if (!legal.length || (policy === 'offense-only' && b.side === 'defense')) return null;
  if (policy === 'random') return legal[(b.rng >>> 8) % legal.length].uid;
  let best = null,
    score = value(b) + 0.01;
  for (const c of legal) {
    const copy = structuredClone(b);
    playCard(copy, c.uid);
    const next = value(copy);
    if (next > score) {
      score = next;
      best = c.uid;
    }
  }
  return best;
}
const ranks = {
  ace: 9,
  wall: 7,
  double: 8,
  homer: 7,
  dig: 8,
  opposite: 9,
  loaded: 8,
  rally: 8,
  rhythm: 8,
  gamble: 7,
  squeeze: 6,
  reset: 7,
  walk: 4,
  sacrifice: 4,
  muscle: 8,
  load: 6,
  bunt: 8,
  steal: 5,
  study: 9,
  patient: 5,
  fireworks: 8,
  wheels: 7,
  work: 9,
};
export function simulate(character, seed, policy = 'tactical') {
  const run = R.createRun(character, seed);
  let actions = 0,
    atBats = 0;
  while (!['won', 'lost'].includes(run.phase) && actions++ < 20000) {
    if (run.phase === 'map') {
      const nodes = run.map[run.stage - 1].filter((n) => R.reachable(run, n));
      R.enterNode(run, (nodes.find((n) => !n.elite) || nodes[0]).id);
    } else if (run.phase === 'battle') {
      if (run.battle.status === 'switch') advanceHalf(run.battle);
      else {
        const uid = selectCard(run.battle, policy);
        if (uid) playCard(run.battle, uid);
        else {
          endTurn(run.battle);
          atBats++;
        }
      }
      R.finishBattle(run);
    } else if (run.phase === 'reward') {
      const c = run.rewards.slice().sort((a, b) => (ranks[b.id] || 0) - (ranks[a.id] || 0))[0];
      R.chooseReward(run, run.deck.length < 18 && (ranks[c.id] || 0) >= 7 ? c.uid : 'skip');
    } else if (run.phase === 'dugout') R.chooseStop(run, 'rest');
    else if (run.phase === 'rest') {
      const card = run.deck
        .filter((c) => !c.upgraded)
        .sort(
          (a, b) =>
            (b.id === 'contact' ? 10 : ranks[b.id] || 5) -
            (a.id === 'contact' ? 10 : ranks[a.id] || 5),
        )[0];
      if (run.stamina < 50 || !card) R.takeRest(run, 'rest');
      else R.takeRest(run, 'upgrade', card.uid);
    } else if (run.phase === 'ready') R.nextGame(run);
    else throw new Error(`Unexpected simulation phase ${run.phase}`);
  }
  if (actions >= 20000) throw new Error('Simulation action guard exceeded');
  return {
    won: run.phase === 'won',
    series: run.completed,
    games: run.history.length,
    atBats,
    history: run.history,
  };
}
if (process.argv[1]?.endsWith('balance.mjs')) {
  const samples = Number(process.argv[2] || 100),
    results = [];
  for (const character of ['dean', 'speed', 'captain'])
    for (const policy of ['tactical', 'random', 'offense-only']) {
      let wins = 0,
        series = 0,
        games = 0,
        atBats = 0,
        gameWins = 0,
        runs = 0,
        allowed = 0;
      const acts = [1, 2, 3].map((act) => ({ act, games: 0, wins: 0 }));
      for (let i = 0; i < samples; i++) {
        const r = simulate(character, 10000 + i, policy);
        wins += r.won;
        series += r.series;
        games += r.games;
        atBats += r.atBats;
        for (const g of r.history) {
          gameWins += g.won;
          runs += g.player;
          allowed += g.enemy;
          acts[g.act - 1].games++;
          acts[g.act - 1].wins += g.won;
        }
      }
      const row = {
        character,
        policy,
        samples,
        wins,
        winRate: +((100 * wins) / samples).toFixed(1),
        averageSeries: +(series / samples).toFixed(2),
        games,
        gameWinRate: +((100 * gameWins) / games).toFixed(1),
        runsPerGame: +(runs / games).toFixed(2),
        allowedPerGame: +(allowed / games).toFixed(2),
        atBatsPerGame: +(atBats / games).toFixed(1),
        acts,
      };
      results.push(row);
      console.log(JSON.stringify(row));
    }
  await writeFile(
    new URL('../docs/balance-results.json', import.meta.url),
    JSON.stringify(
      {
        date: new Date().toISOString(),
        seedStart: 10000,
        notes:
          'One-card lookahead on regular routes, with shared reward rankings and rest/upgrade choices. Not human win rates.',
        results,
      },
      null,
      2,
    ),
  );
}

import { writeFile } from 'node:fs/promises';
import {
  createRun,
  enterNode,
  finishBattle,
  chooseReward,
  takeRest,
  takeEvent,
  nextInning,
  buy,
  reachable,
} from '../dist/js/engine/run.js';
import { playCard, endTurn, canPlay, incoming } from '../dist/js/engine/battle.js';
import { definition } from '../dist/js/data/cards.js';

// These are deliberately limited agents, not an estimate of human win rates.
// Tactical evaluates one card ahead; greedy ignores defense; random picks legal plays.
function value(b, policy) {
  if (b.status === 'won') return 10000;
  if (b.status === 'lost') return -10000;
  const offense = b.runs * 22 + b.bases.reduce((v, on, i) => v + (on ? [4, 7, 10][i] : 0), 0);
  if (policy === 'greedy')
    return offense + b.focus * 3 + b.energy * 1.2 + b.hand.length * 0.6 - b.outs * 4 - b.strikes;
  const damage = incoming(b);
  const reserve = (3 - b.outs) * 3 - b.strikes;
  const danger = damage >= reserve ? 60 : 0;
  const fullyBlocked = b.pitch.strikes > 0 && !b.pitch.pierce && damage === 0 ? 4 : 0;
  return (
    offense -
    b.outs * 15 -
    b.strikes * 4 -
    damage * 5 -
    danger +
    fullyBlocked +
    b.balls * 2.7 +
    b.focus * 3 +
    b.energy * 1.4 +
    b.hand.length * 1.1 +
    (b.powers.discipline ? Math.max(2, 10 - b.turn) : 0) +
    (b.powers.rhythm ? Math.max(2, 8 - b.turn) : 0)
  );
}
export function selectCard(b, policy) {
  const playable = b.hand.filter((c) => canPlay(b, c.uid));
  if (!playable.length) return null;
  if (policy === 'random') return playable[(b.rng >>> 4) % playable.length].uid;
  const baseline = value(b, policy);
  let best = null,
    bestScore = baseline + 0.05;
  for (const c of playable) {
    const copy = structuredClone(b);
    playCard(copy, c.uid);
    const score = value(copy, policy);
    if (score > bestScore) {
      bestScore = score;
      best = c.uid;
    }
  }
  return best;
}
const rewardRanks = {
  double: 10,
  protect: 8,
  battle: 9,
  discipline: 10,
  rhythm: 6,
  reset: 6,
  squeeze: 7,
  dig: 8,
  homer: 6,
  payoff: 8,
  fireworks: 7,
  chin: 4,
  wheels: 9,
  slash: 8,
  insurance: 9,
  work: 9,
  opposite: 9,
  read: 8,
  rally: 7,
  sacrifice: 2,
  muscle: 7,
  load: 5,
  bunt: 8,
  steal: 7,
  study: 9,
  patient: 8,
};
export function simulate(character, seed, policy = 'tactical') {
  const run = createRun(character, seed);
  let turns = 0,
    guard = 0;
  while (!['won', 'lost'].includes(run.phase) && guard++ < 5000) {
    if (run.phase === 'map') {
      // Low-risk route for controlled comparison. Aces are tested separately.
      const nodes = run.map[run.inning - 1].filter((n) => reachable(run, n) && !n.elite);
      enterNode(
        run,
        (
          nodes.find((n) => n.stop === 'rest') ||
          nodes.find((n) => n.stop === 'training') ||
          nodes[0]
        ).id,
      );
    } else if (run.phase === 'battle') {
      const uid = selectCard(run.battle, policy);
      if (uid) playCard(run.battle, uid);
      else {
        endTurn(run.battle);
        turns++;
      }
      finishBattle(run);
    } else if (run.phase === 'reward') {
      const sorted = run.rewards
        .slice()
        .sort((a, b) => (rewardRanks[b.id] || 0) - (rewardRanks[a.id] || 0));
      const chosen = sorted[0];
      chooseReward(
        run,
        run.deck.length < 19 && (rewardRanks[chosen.id] || 0) >= 6 ? chosen.uid : 'skip',
      );
    } else if (['rest', 'training'].includes(run.phase)) {
      const card = run.deck
        .filter((c) => !c.upgraded)
        .sort(
          (a, b) =>
            (b.id === 'contact' ? 12 : rewardRanks[b.id] || 5) -
            (a.id === 'contact' ? 12 : rewardRanks[a.id] || 5),
        )[0];
      if (run.stamina < 58 || !card) takeRest(run, 'rest');
      else takeRest(run, 'upgrade', card.uid);
    } else if (run.phase === 'event') takeEvent(run, 'safe');
    else if (run.phase === 'shop') {
      if (run.cash >= 65) buy(run, 'relic');
      if (run.stamina < 65) buy(run, 'recover');
      const good = run.shop.cards.find((i) => (rewardRanks[i.card.id] || 0) >= 9);
      if (good && run.deck.length < 19) buy(run, 'card', good.card.uid);
      nextInning(run);
    }
  }
  if (guard >= 5000) throw new Error('Simulation exceeded its action guard');
  return {
    won: run.phase === 'won',
    reached: run.inning,
    turns,
    outs: run.totalOuts,
    runs: run.totalRuns,
  };
}
if (process.argv[1] && process.argv[1].endsWith('balance.mjs')) {
  const samples = Number(process.argv[2] || 300),
    results = [];
  for (const character of ['dean', 'speed', 'captain'])
    for (const policy of ['tactical', 'greedy', 'random']) {
      let wins = 0,
        innings = 0,
        turns = 0;
      for (let i = 0; i < samples; i++) {
        const s = simulate(character, 10000 + i, policy);
        wins += s.won;
        innings += s.reached;
        turns += s.turns;
      }
      const row = {
        character,
        policy,
        samples,
        wins,
        winRate: +((wins / samples) * 100).toFixed(1),
        averageInning: +(innings / samples).toFixed(2),
        averageTurns: +(turns / samples).toFixed(1),
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
          'One-card lookahead agents on low-risk routes with deterministic upgrade and shopping choices. Not human win rates.',
        results,
      },
      null,
      2,
    ),
  );
}

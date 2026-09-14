import { CHARACTERS } from '../data/characters.js';
import { CARDS, rewardPool } from '../data/cards.js';
import { RELICS } from '../data/encounters.js';
import { createBattle } from './battle.js';
import { pick, shuffle } from './random.js';
import { generateMap, MAP_VERSION } from './map.js';
export function makeCard(run, id, upgraded = false) {
  return { id, uid: `card-${run.nextUid++}`, upgraded };
}
export function createRun(character, seed = Date.now() >>> 0) {
  if (!CHARACTERS[character]) throw new Error('Unknown character');
  const run = {
    version: 2,
    character,
    seed,
    rng: seed,
    nextUid: 1,
    act: 1,
    stage: 1,
    stamina: 100,
    cash: 35,
    relics: [],
    deck: [],
    phase: 'map',
    battle: null,
    route: [],
    map: generateMap(seed, 1),
    mapVersion: MAP_VERSION,
    series: { wins: 0, losses: 0 },
    opponent: null,
    rewards: [],
    shop: null,
    totalRuns: 0,
    totalAllowed: 0,
    totalOuts: 0,
    completed: 0,
    gamesWon: 0,
    gamesLost: 0,
    history: [],
  };
  run.deck = CHARACTERS[character].deck.map((id) => makeCard(run, id));
  return run;
}
export function reachable(run, node) {
  if (run.phase !== 'map' || node.stage !== run.stage) return false;
  if (run.stage === 1) return true;
  return !!run.map[run.stage - 2].find((n) => n.id === run.route.at(-1))?.next.includes(node.id);
}
export function enterNode(run, id) {
  const node = run.map[run.stage - 1]?.find((n) => n.id === id);
  if (!node || !reachable(run, node)) return false;
  run.opponent = node;
  run.route.push(id);
  run.series = { wins: 0, losses: 0 };
  run.seriesStops = [];
  beginGame(run);
  return true;
}
function beginGame(run) {
  run.stamina = Math.max(0, run.stamina - 10);
  run.battle = createBattle(run, run.opponent);
  run.phase = 'battle';
}
export function finishBattle(run) {
  const b = run.battle;
  if (run.phase !== 'battle' || !['won', 'lost'].includes(b.status)) return false;
  const won = b.status === 'won';
  run.totalRuns += b.score.player;
  run.totalAllowed += b.score.enemy;
  run.totalOuts += b.totalOuts;
  run.series[won ? 'wins' : 'losses']++;
  run[won ? 'gamesWon' : 'gamesLost']++;
  run.history.push({
    act: run.act,
    stage: run.stage,
    opponent: b.node.name,
    game: b.game,
    player: b.score.player,
    enemy: b.score.enemy,
    won,
    showdown: b.showdown,
  });
  run.lastRelic = null;
  run.lastCash = won ? (b.node.elite ? 35 : 25) : 15;
  run.cash += run.lastCash;
  if (run.series.losses === 2) {
    run.phase = 'lost';
    return true;
  }
  if (run.series.wins === 2) {
    run.completed++;
    if (b.node.elite) {
      const pool = Object.keys(RELICS).filter((id) => !run.relics.includes(id));
      if (pool.length) {
        run.lastRelic = pick(run, pool);
        run.relics.push(run.lastRelic);
      }
    }
    if (run.act === 3 && run.stage === 3) {
      run.phase = 'won';
      return true;
    }
  }
  const pool = rewardPool(run.character).filter(
    (id) => !CARDS[id].limit || !run.deck.some((c) => c.id === id),
  );
  run.rewards = shuffle(run, pool)
    .slice(0, 3)
    .map((id) => makeCard(run, id));
  run.phase = 'reward';
  return true;
}
export function chooseReward(run, uid) {
  if (run.phase !== 'reward') return false;
  if (uid !== 'skip') {
    const chosen = run.rewards.find((c) => c.uid === uid);
    if (!chosen) return false;
    run.deck.push(chosen);
  }
  run.rewards = [];
  run.phase = 'dugout';
  return true;
}
export function chooseStop(run, choice) {
  if (run.phase !== 'dugout' || !['rest', 'training', 'shop', 'event'].includes(choice))
    return false;
  run.phase = choice;
  (run.seriesStops ??= [])[run.battle.game - 1] = choice;
  (run.stopHistory ??= {})[`${run.act}-${run.stage}-${run.battle.game}`] = choice;
  if (choice === 'shop') prepareShop(run);
  if (choice === 'event') run.event = pick(run, ['cage', 'hotdog', 'trade']);
  return true;
}
export function finishStop(run) {
  if (!['shop', 'rest', 'training', 'event'].includes(run.phase)) return false;
  run.phase = 'ready';
  if (run.series.wins === 2) return nextGame(run);
  return true;
}
export function nextGame(run) {
  if (run.phase !== 'ready') return false;
  if (run.series.wins < 2) {
    beginGame(run);
    return true;
  }
  run.stage++;
  if (run.stage > 3) {
    run.act++;
    run.stage = 1;
    run.route = [];
    run.map = generateMap(run.seed, run.act);
    recover(run, 25);
  }
  run.series = { wins: 0, losses: 0 };
  run.opponent = null;
  run.battle = null;
  run.phase = 'map';
  return true;
}
export function recover(run, amount) {
  run.stamina = Math.min(100, run.stamina + amount);
}
export function upgrade(run, uid) {
  const card = run.deck.find((c) => c.uid === uid);
  if (!card || card.upgraded) return false;
  card.upgraded = true;
  return true;
}
export function takeRest(run, choice, uid) {
  if (!['rest', 'training'].includes(run.phase)) return false;
  if (choice === 'rest') recover(run, run.phase === 'rest' ? 28 : 16);
  else if (choice === 'upgrade') {
    if (!upgrade(run, uid)) return false;
  } else return false;
  finishStop(run);
  return true;
}
export function takeEvent(run, choice) {
  if (run.phase !== 'event' || !['safe', 'risk'].includes(choice)) return false;
  if (run.event === 'hotdog') {
    if (choice === 'safe') recover(run, 18);
    else {
      run.cash += 35;
      run.stamina = Math.max(0, run.stamina - 10);
    }
  } else if (run.event === 'cage') {
    if (choice === 'safe') run.cash += 15;
    else {
      const options = run.deck.filter((c) => !c.upgraded);
      if (options.length) upgrade(run, pick(run, options).uid);
      run.stamina = Math.max(0, run.stamina - 8);
    }
  } else {
    if (choice === 'safe') run.cash += 20;
    else {
      const index = run.deck.findIndex((c) => c.id === 'contact' && !c.upgraded);
      if (index >= 0) run.deck.splice(index, 1);
      run.deck.push(makeCard(run, pick(run, rewardPool(run.character))));
    }
  }
  finishStop(run);
  return true;
}
function prepareShop(run) {
  const relics = Object.keys(RELICS).filter((id) => !run.relics.includes(id));
  const pool = rewardPool(run.character).filter(
    (id) => !CARDS[id].limit || !run.deck.some((c) => c.id === id),
  );
  run.shop = {
    cards: shuffle(run, pool)
      .slice(0, 3)
      .map((id) => ({ card: makeCard(run, id), price: 40, sold: false })),
    relic: relics.length ? pick(run, relics) : null,
    relicSold: false,
    recoverySold: false,
    removalSold: false,
  };
}
export function buy(run, kind, uid) {
  if (run.phase !== 'shop') return false;
  const shop = run.shop;
  if (kind === 'card') {
    const item = shop.cards.find((i) => i.card.uid === uid);
    if (!item || item.sold || run.cash < item.price) return false;
    run.cash -= item.price;
    item.sold = true;
    run.deck.push(item.card);
  } else if (kind === 'relic') {
    if (!shop.relic || shop.relicSold || run.cash < 65) return false;
    run.cash -= 65;
    run.relics.push(shop.relic);
    shop.relicSold = true;
  } else if (kind === 'recover') {
    if (shop.recoverySold || run.cash < 20 || run.stamina === 100) return false;
    run.cash -= 20;
    recover(run, 20);
    shop.recoverySold = true;
  } else if (kind === 'remove') {
    const i = run.deck.findIndex((c) => c.uid === uid);
    if (shop.removalSold || run.cash < 35 || run.deck.length <= 8 || i < 0) return false;
    run.cash -= 35;
    run.deck.splice(i, 1);
    shop.removalSold = true;
  } else return false;
  return true;
}

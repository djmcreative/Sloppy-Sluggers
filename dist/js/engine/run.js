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
    version: 1,
    character,
    seed,
    rng: seed,
    nextUid: 1,
    inning: 1,
    stamina: 100,
    cash: 35,
    relics: [],
    deck: [],
    phase: 'map',
    battle: null,
    route: [],
    lane: 1,
    map: [],
    mapVersion: MAP_VERSION,
    rewards: [],
    shop: null,
    totalRuns: 0,
    totalOuts: 0,
    completed: 0,
  };
  run.deck = CHARACTERS[character].deck.map((id) => makeCard(run, id));
  run.map = generateMap(seed);
  return run;
}

export function reachable(run, node) {
  if (run.phase !== 'map' || node.inning !== run.inning) return false;
  if (run.inning === 1) return true;
  const previous = run.map[run.inning - 2].find((n) => n.id === run.route.at(-1));
  return !!previous?.next.includes(node.id);
}
export function enterNode(run, id) {
  const node = run.map[run.inning - 1].find((n) => n.id === id);
  if (!node || !reachable(run, node)) return false;
  run.stamina = Math.max(0, run.stamina - 8);
  run.lane = node.lane;
  run.route.push(id);
  run.battle = createBattle(run, node);
  run.phase = 'battle';
  return true;
}
export function finishBattle(run) {
  if (run.phase !== 'battle' || run.battle.status === 'playing') return false;
  const b = run.battle;
  run.totalRuns += b.runs;
  run.totalOuts += b.totalOuts;
  run.stamina = Math.max(0, run.stamina - b.totalOuts * 4);
  if (b.status === 'lost') {
    run.phase = 'lost';
    return true;
  }
  run.completed++;
  const money = b.node.elite ? 40 : 24;
  run.cash += money;
  run.lastCash = money;
  if (b.node.elite) {
    const pool = Object.keys(RELICS).filter((id) => !run.relics.includes(id));
    run.lastRelic = pool.length ? pick(run, pool) : null;
    if (run.lastRelic) run.relics.push(run.lastRelic);
  } else run.lastRelic = null;
  if (run.inning === 9) {
    run.phase = 'won';
    return true;
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
  run.phase = run.battle.node.stop;
  if (run.phase === 'shop') prepareShop(run);
  if (run.phase === 'event') run.event = pick(run, ['cage', 'hotdog', 'trade']);
  return true;
}
export function nextInning(run) {
  run.inning++;
  run.battle = null;
  run.phase = 'map';
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
  nextInning(run);
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
  nextInning(run);
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

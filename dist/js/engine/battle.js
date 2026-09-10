import { definition } from '../data/cards.js';
import { PITCHES } from '../data/encounters.js';
import { pick, random, shuffle } from './random.js';

export function log(battle, message) {
  battle.log.push(message);
  if (battle.log.length > 40) battle.log.shift();
}
export function createBattle(run, node) {
  const b = {
    rng: Math.floor(random(run) * 0xffffffff),
    character: run.character,
    relics: [...run.relics],
    inning: run.inning,
    node,
    target: node.target,
    runs: 0,
    outs: 0,
    strikes: 0,
    balls: run.character === 'captain' ? 1 : 0,
    bases: [run.relics.includes('cleats'), false, false],
    drawPile: [],
    discard: [],
    hand: [],
    exhausted: [],
    turn: 0,
    energy: 0,
    foul: 0,
    focus: run.relics.includes('gloves') ? 1 : 0,
    tempo: false,
    powers: {},
    firstHit: false,
    usedSingle: false,
    capUsed: false,
    gloveUsed: false,
    tired: run.stamina < 30,
    status: 'playing',
    pitch: null,
    log: [],
    totalOuts: 0,
  };
  b.drawPile = shuffle(
    b,
    run.deck.map((c) => ({ ...c })),
  );
  log(b, `${node.name} takes the mound. Score ${b.target} runs.`);
  startTurn(b);
  return b;
}

export function draw(b, count) {
  for (let i = 0; i < count && b.hand.length < 10; i++) {
    if (!b.drawPile.length) {
      b.drawPile = shuffle(b, b.discard);
      b.discard = [];
    }
    if (!b.drawPile.length) return;
    b.hand.push(b.drawPile.pop());
  }
}

export function choosePitch(b) {
  const style = b.node.style;
  const runners = b.bases.filter(Boolean).length;
  const roll = random(b);
  let key;
  if (b.turn === 1) key = style === 'junk' ? 'curve' : 'fastball';
  else if (runners >= 2 && roll < (style === 'runners' ? 0.33 : 0.16)) key = 'two';
  else if (runners && roll < 0.23) key = 'pickoff';
  else {
    const pools = {
      heat: ['fastball', 'fastball', 'heat', 'heat', 'curve', 'waste'],
      junk: ['curve', 'curve', 'fastball', 'heat', 'waste', 'corner'],
      control: ['fastball', 'fastball', 'corner', 'curve', 'waste', 'waste'],
      runners: ['fastball', 'curve', 'heat', 'waste'],
      closer: ['fastball', 'heat', 'heat', 'curve', 'corner', 'waste'],
    };
    key = pick(b, pools[style]);
  }
  const pitch = { ...PITCHES[key], key };
  // The ramp is bounded; late innings remain winnable with defensive decks.
  const ramp = Math.min(2, Math.floor((b.turn - 1) / 4));
  pitch.strikes +=
    pitch.strikes && !pitch.pierce
      ? ramp + Math.floor((b.inning - 1) / 3) + (b.node.elite ? 1 : 0)
      : 0;
  return pitch;
}

export function startTurn(b) {
  b.turn++;
  b.firstHit = false;
  b.usedSingle = false;
  b.energy = 3 + (b.turn === 1 && b.relics.includes('drink') ? 1 : 0);
  b.foul = (b.powers.discipline ? 1 : 0) + (b.turn === 1 && b.relics.includes('rosin') ? 1 : 0);
  const bonus = b.tempo ? 1 : 0;
  b.tempo = false;
  draw(b, (b.tired ? 4 : 5) + bonus);
  if (bonus) log(b, 'Good read. Draw an extra card.');
  b.pitch = choosePitch(b);
}

function checkWin(b) {
  if (b.runs >= b.target && b.status === 'playing') {
    b.status = 'won';
    log(b, 'Ballgame! You got the runs.');
  }
}

export function advanceRunners(b, amount, all = true) {
  for (let i = 2; i >= 0; i--) {
    if (!b.bases[i]) continue;
    const next = i + amount;
    // Never overwrite an occupied base when advancing only the lead runner.
    if (next < 3 && b.bases[next]) continue;
    b.bases[i] = false;
    if (next >= 3) {
      b.runs++;
      log(b, 'A runner comes home!');
    } else b.bases[next] = true;
    if (!all) break;
  }
}

export function hit(b, amount) {
  const bonus = b.character === 'dean' && b.strikes === 2 && !b.firstHit ? 1 : 0;
  const distance = Math.min(4, amount + b.focus + bonus);
  if (b.character === 'dean' && distance > 1 && !b.firstHit) b.foul++;
  b.focus = 0;
  advanceRunners(b, distance);
  if (distance === 4) b.runs++;
  else b.bases[distance - 1] = true;
  log(b, ['', 'Single!', 'Double!', 'Triple!', 'HOME RUN!'][distance]);
  if (b.powers.rhythm && !b.firstHit) b.foul++;
  b.firstHit = true;
  if (b.character === 'speed' && distance === 1 && !b.usedSingle) {
    b.usedSingle = true;
    advanceRunners(b, 1, false);
    log(b, 'Turf Shoes: take the extra base.');
  }
  // Hits intentionally preserve the count: cards are tactical plays, not literal at-bats.
  checkWin(b);
}

export function recordOut(b) {
  b.outs++;
  b.totalOuts++;
  b.strikes = 0;
  b.balls = 0;
  log(b, `Out ${b.outs} of 3.`);
  if (b.outs >= 3) {
    b.status = 'lost';
    log(b, 'Three outs. The run ends here.');
    return;
  }
  if (b.relics.includes('cap') && !b.capUsed) {
    b.capUsed = true;
    draw(b, 2);
    log(b, 'Rally Cap: draw 2.');
  }
}

export function addStrikes(b, count) {
  for (let i = 0; i < count && b.status === 'playing'; i++) {
    b.strikes++;
    if (b.strikes === 3) recordOut(b);
  }
}

export function addBalls(b, count) {
  for (let i = 0; i < count && b.status === 'playing'; i++) {
    b.balls++;
    if (b.balls < 4) continue;
    if (b.bases[0]) {
      if (b.bases[1]) {
        if (b.bases[2]) b.runs++;
        b.bases[2] = true;
      }
      b.bases[1] = true;
    }
    b.bases[0] = true;
    b.balls = 0;
    b.strikes = 0;
    if (b.character === 'captain') draw(b, 1);
    log(b, 'Ball four! Runner on first. Count cleared.');
    checkWin(b);
  }
}

function applyEffect(b, { op, amount }) {
  switch (op) {
    case 'hit':
      hit(b, amount);
      break;
    case 'block':
      b.foul += amount;
      break;
    case 'ball':
      addBalls(b, amount);
      break;
    case 'advance':
      advanceRunners(b, amount, false);
      break;
    case 'advanceAll':
      advanceRunners(b, amount);
      break;
    case 'strike':
      addStrikes(b, amount);
      break;
    case 'out':
      recordOut(b);
      break;
    case 'focus':
      b.focus = Math.min(3, b.focus + amount);
      break;
    case 'draw':
      draw(b, amount);
      break;
    case 'energy':
      b.energy += amount;
      break;
    case 'clear':
      b.strikes = Math.max(0, b.strikes - amount);
      break;
    case 'clutch':
      hit(b, b.outs === 2 ? 4 : amount);
      break;
    case 'payoff':
      hit(b, b.strikes === 2 ? 4 : amount);
      break;
    case 'discipline':
      b.powers.discipline = 1;
      break;
    case 'rhythm':
      b.powers.rhythm = 1;
      break;
    default:
      throw new Error(`Unknown card effect: ${op}`);
  }
  checkWin(b);
}

export function canPlay(b, uid) {
  const instance = b.hand.find((c) => c.uid === uid);
  if (!instance || b.status !== 'playing') return false;
  const c = definition(instance);
  return !c.unplayable && c.cost <= b.energy;
}

export function playCard(b, uid) {
  if (!canPlay(b, uid)) return false;
  const index = b.hand.findIndex((c) => c.uid === uid);
  const instance = b.hand.splice(index, 1)[0];
  const c = definition(instance);
  b.energy -= c.cost;
  log(b, `${c.name}.`);
  // A winning effect ends the inning before later self-damage is applied.
  for (const effect of c.effects) {
    if (b.status !== 'playing') break;
    applyEffect(b, effect);
  }
  (c.exhaust ? b.exhausted : b.discard).push(instance);
  return true;
}

export function incoming(b) {
  return b.pitch.pierce ? b.pitch.strikes : Math.max(0, b.pitch.strikes - b.foul);
}

export function endTurn(b) {
  if (b.status !== 'playing') return false;
  b.discard.push(...b.hand);
  b.hand = [];
  const p = b.pitch;
  const damage = incoming(b);
  if (p.strikes > 0 && !damage && !p.pierce) b.tempo = true;
  log(
    b,
    `${p.name}: ${damage ? `${damage} strike${damage === 1 ? '' : 's'}.` : 'no strikes through.'}`,
  );
  addStrikes(b, damage);
  if (b.status !== 'playing') return true;
  if (p.balls) addBalls(b, p.balls);
  if (b.status !== 'playing') return true;
  if (p.junk) {
    b.drawPile.push({ id: 'junk', uid: `junk-${b.turn}`, upgraded: false });
    b.drawPile = shuffle(b, b.drawPile);
  }
  if (p.runners && b.bases.some(Boolean)) {
    if (b.relics.includes('glove') && !b.gloveUsed) {
      b.gloveUsed = true;
      log(b, 'Old Glove saves your runners.');
    } else {
      for (let n = 0; n < p.runners; n++) {
        const i = b.bases.lastIndexOf(true);
        if (i >= 0) {
          b.bases[i] = false;
          log(b, 'Lead runner removed.');
        }
      }
    }
  }
  if (b.turn >= 40) {
    b.status = 'lost';
    log(b, 'Stadium curfew. The inning is called after 40 turns.');
  } else startTurn(b);
  return true;
}

import { definition } from '../data/cards.js';
import { random, shuffle, pick } from './random.js';
import { advance, baseHit, walk } from './baseball.js';

export const log = (b, message) => {
  b.log.push(message);
  if (b.log.length > 100) b.log.shift();
};
export const battingTeam = (b) => (b.side === 'offense' ? 'player' : 'enemy');
export function createBattle(run, node) {
  const b = {
    rng: Math.floor(random(run) * 0xffffffff),
    character: run.character,
    relics: [...run.relics],
    node: { ...node },
    act: run.act,
    game: run.series.wins + run.series.losses + 1,
    home: run.series.wins + run.series.losses === 1,
    inning: 1,
    half: 0,
    side: 'offense',
    score: { player: 0, enemy: 0 },
    lines: [{ player: 0, enemy: 0 }],
    outs: 0,
    bases: [false, false, false],
    turn: 0,
    halfTurn: 0,
    energy: 0,
    contact: 0,
    pitch: 0,
    field: 0,
    deck: run.deck.map((c) => ({ ...c })),
    hand: [],
    drawPile: [],
    discard: [],
    exhausted: [],
    tired: run.stamina < 30,
    status: 'playing',
    showdown: false,
    showdownMargins: { player: 0, enemy: 0 },
    nextContact: 0,
    nextPitch: 0,
    powers: {},
    log: [],
    totalOuts: 0,
    totalEnemyOuts: 0,
  };
  log(b, `${node.name}: game ${b.game}. Outscore them over three innings.`);
  startHalf(b);
  return b;
}
export function draw(b, count) {
  for (let i = 0; i < count && b.hand.length < 10; i++) {
    if (!b.drawPile.length) {
      b.drawPile = shuffle(b, b.discard);
      b.discard = [];
    }
    if (!b.drawPile.length) break;
    b.hand.push(b.drawPile.pop());
  }
}
function chooseIntent(b) {
  const level = b.act - 1 + (b.node.elite ? 1 : 0);
  if (b.side === 'offense') {
    const style = pick(b, [0, 0, 1, 2]);
    const scouting = b.showdown ? 0 : b.halfTurn - 1;
    return {
      name: ['Fastball', 'Changeup', 'Heavy Sinker'][style],
      icon: ['fastball', 'curveball', 'high heat'][style],
      strength: 4 + level + style + scouting,
      scouting,
      text: 'Match Pitch with Contact for a single. Each 2 extra Contact adds a base.',
    };
  }
  const routine = !b.showdown && b.halfTurn % 4 === 0;
  const strength = routine ? 0 : (b.showdown ? 8 : 7 + pick(b, [0, 1, 2, 3])) + level + (b.act - 1);
  return {
    name: routine ? 'Routine Pop-Up' : strength >= 7 ? 'Big Swing' : 'Line-Drive Swing',
    icon: routine ? 'glove' : 'high heat',
    strength,
    routine,
    text: routine
      ? 'An unforced out. Set up your next at-bat.'
      : 'Pitch removes Contact. Each 2 Contact left is 1 hit base; Field removes bases. Zero bases is an out.',
  };
}
function startHalf(b) {
  b.side = (b.half === 0) !== b.home ? 'offense' : 'defense';
  b.status = 'playing';
  b.outs = 0;
  b.halfTurn = 0;
  b.powers = {};
  b.nextContact = 0;
  b.nextPitch = 0;
  b.firstHit = false;
  b.speedUsed = false;
  b.gloveUsed = false;
  b.capUsed = false;
  b.bonusDraw = 0;
  b.bases = b.showdown
    ? [true, true, true]
    : [b.side === 'offense' && b.relics.includes('cleats'), false, false];
  b.hand = [];
  b.discard = [];
  b.exhausted = [];
  b.drawPile = shuffle(
    b,
    b.deck.map((c) => ({ ...c })),
  );
  log(
    b,
    `${b.showdown ? 'Showdown' : `Inning ${b.inning}`} ${b.half === 0 ? 'top' : 'bottom'}: ${b.side === 'offense' ? 'Sluggers batting' : 'Sluggers pitching'}.`,
  );
  startTurn(b);
}
export function startTurn(b) {
  b.turn++;
  b.halfTurn++;
  b.energy = 3 + (b.halfTurn === 1 && b.relics.includes('drink') ? 1 : 0);
  b.contact = b.nextContact + (b.powers.rhythm && b.side === 'offense' ? 1 : 0);
  b.pitch = b.nextPitch + (b.powers.rhythm && b.side === 'defense' ? 1 : 0);
  b.nextContact = 0;
  b.nextPitch = 0;
  b.field = 0;
  b.risk = false;
  b.doubleplay = false;
  b.forced = null;
  b.sacrificeAdvance = 0;
  if (b.halfTurn === 1) {
    if (b.side === 'offense' && b.relics.includes('gloves')) b.contact++;
    if (b.side === 'defense')
      b.pitch += (b.character !== 'speed' ? 1 : 0) + (b.relics.includes('rosin') ? 2 : 0);
  }
  draw(
    b,
    (b.tired ? 4 : 5) + b.bonusDraw + (b.character === 'captain' && b.halfTurn === 1 ? 1 : 0),
  );
  b.bonusDraw = 0;
  b.intent = chooseIntent(b);
}
function scoreRuns(b, count) {
  if (!count) return;
  const team = battingTeam(b);
  b.score[team] += count;
  b.lines[b.inning - 1][team] += count;
  log(b, `${team === 'player' ? 'Sluggers' : b.node.name} score ${count}!`);
  // The home side can walk off only in the bottom of the last regular inning.
  const home = b.home ? 'player' : 'enemy',
    away = b.home ? 'enemy' : 'player';
  if (!b.showdown && b.inning === 3 && b.half === 1 && b.score[home] > b.score[away]) finishGame(b);
}
function finishGame(b, winner = null) {
  winner ??= b.score.player > b.score.enemy ? 'player' : 'enemy';
  b.status = winner === 'player' ? 'won' : 'lost';
  log(
    b,
    `${winner === 'player' ? 'Sluggers win' : 'Game lost'} ${b.score.player}–${b.score.enemy}.`,
  );
}
function finishHalf(b) {
  if (b.status !== 'playing') return;
  if (b.showdown && b.half === 1) {
    if (b.score.player !== b.score.enemy) finishGame(b);
    else {
      const margin = b.showdownMargins.player - b.showdownMargins.enemy;
      const winner = margin ? (margin > 0 ? 'player' : 'enemy') : b.home ? 'player' : 'enemy';
      log(
        b,
        `Showdown tied: contact margins ${b.showdownMargins.player}–${b.showdownMargins.enemy}.${margin === 0 ? ' Home field breaks the exact tie.' : ' Higher margin wins.'}`,
      );
      finishGame(b, winner);
    }
    return;
  }
  if (!b.showdown && b.inning === 3) {
    const home = b.home ? 'player' : 'enemy',
      away = b.home ? 'enemy' : 'player';
    if (b.half === 0 && b.score[home] > b.score[away]) {
      finishGame(b);
      return;
    }
    if (b.half === 1 && b.score.player !== b.score.enemy) {
      finishGame(b);
      return;
    }
  }
  b.status = 'switch';
  log(
    b,
    b.half === 1 && b.inning === 3
      ? 'Tied after three. One bases-loaded at-bat per side decides it.'
      : 'Side retired. Switch the field.',
  );
}
export function advanceHalf(b) {
  if (b.status !== 'switch') return false;
  if (b.half === 0) b.half = 1;
  else {
    b.half = 0;
    b.inning++;
    b.lines.push({ player: 0, enemy: 0 });
    if (b.inning === 4) b.showdown = true;
  }
  startHalf(b);
  return true;
}
export function recordOut(b) {
  if (b.status !== 'playing') return;
  b.outs++;
  if (b.side === 'offense') {
    b.totalOuts++;
    if (b.relics.includes('cap') && !b.capUsed) {
      b.capUsed = true;
      b.bonusDraw++;
    }
  } else b.totalEnemyOuts++;
  log(b, `Out ${b.outs} of 3.`);
  if (b.outs >= 3) finishHalf(b);
}
export function previewAtBat(b) {
  const margin = b.side === 'offense' ? b.contact - b.intent.strength : b.intent.strength - b.pitch;
  if (b.forced === 'walk') return { kind: 'walk', bases: 0, margin, label: 'Walk' };
  if (b.forced === 'out') return { kind: 'out', bases: 0, margin, label: 'Sacrifice out' };
  let bases,
    speedSaved = false,
    gloveSaved = false;
  if (b.side === 'offense') {
    bases = margin < 0 ? 0 : Math.min(4, 1 + Math.floor(margin / 2));
    if (bases && b.character === 'dean' && !b.firstHit) bases = Math.min(4, bases + 1);
  } else {
    bases = Math.max(0, Math.min(4, Math.ceil(margin / 2)) - b.field);
    if (bases && b.risk) bases = Math.min(4, bases + 1);
    if (bases > 1 && b.character === 'speed' && !b.speedUsed) {
      bases--;
      speedSaved = true;
    }
    if (bases && b.relics.includes('glove') && !b.gloveUsed) {
      bases--;
      gloveSaved = true;
    }
  }
  return {
    kind: bases > 0 ? 'hit' : 'out',
    bases,
    margin,
    speedSaved,
    gloveSaved,
    label:
      ['', 'Single', 'Double', 'Triple', 'Home run'][bases] ||
      (b.side === 'offense'
        ? 'Batter out'
        : b.doubleplay && b.bases[0] && b.outs < 2
          ? 'Double play'
          : 'Batter retired'),
  };
}
export const incoming = (b) => previewAtBat(b).bases;
export function canPlay(b, uid) {
  const card = b.hand.find((c) => c.uid === uid);
  return b.status === 'playing' && !!card && definition(card, b.side).cost <= b.energy;
}
function applyEffect(b, { op, amount }) {
  switch (op) {
    case 'contact':
      b.contact += amount;
      break;
    case 'pitch':
      b.pitch += amount;
      break;
    case 'field':
      b.field += amount;
      break;
    case 'draw':
      draw(b, amount);
      break;
    case 'energy':
      b.energy += amount;
      break;
    case 'focus':
      b.nextContact += amount;
      break;
    case 'aim':
      b.nextPitch += amount;
      break;
    case 'advance':
      scoreRuns(b, advance(b.bases, amount, false));
      break;
    case 'advanceAll':
      scoreRuns(b, advance(b.bases, amount));
      break;
    case 'sacrifice':
      b.forced = 'out';
      b.sacrificeAdvance = amount;
      break;
    case 'walk':
      b.forced = 'walk';
      break;
    case 'doubleplay':
      b.doubleplay = true;
      break;
    case 'pickoff': {
      const i = b.bases.lastIndexOf(true);
      if (i >= 0) {
        b.bases[i] = false;
        recordOut(b);
      }
      break;
    }
    case 'clutch':
      b.contact += amount + (b.outs === 2 ? 3 : 0);
      break;
    case 'closer':
      b.pitch += amount + (b.outs === 2 ? 3 : 0);
      break;
    case 'rhythm':
      b.powers.rhythm = true;
      break;
    case 'risk':
      b.risk = true;
      break;
    case 'loaded':
      b.contact += amount + b.bases.filter(Boolean).length;
      break;
    case 'pressure':
      b.pitch += amount + b.bases.filter(Boolean).length;
      break;
    default:
      throw new Error(`Unknown effect: ${op}`);
  }
}
export function playCard(b, uid) {
  if (!canPlay(b, uid)) return false;
  const instance = b.hand.splice(
    b.hand.findIndex((c) => c.uid === uid),
    1,
  )[0];
  const c = definition(instance, b.side);
  b.energy -= c.cost;
  log(b, c.name);
  for (const effect of c.effects) {
    if (b.status !== 'playing') break;
    applyEffect(b, effect);
  }
  (c.exhaust ? b.exhausted : b.discard).push(instance);
  return true;
}
export function endTurn(b) {
  if (b.status !== 'playing') return false;
  const result = previewAtBat(b),
    side = b.side;
  b.showdownMargins[battingTeam(b)] = result.margin;
  log(b, `${side === 'offense' ? 'Your at-bat' : 'Enemy at-bat'}: ${result.label}.`);
  if (side === 'defense') {
    if (result.speedSaved) b.speedUsed = true;
    if (result.gloveSaved) b.gloveUsed = true;
  }
  if (result.kind === 'walk') scoreRuns(b, walk(b.bases));
  else if (result.kind === 'hit') {
    scoreRuns(b, baseHit(b.bases, result.bases));
    if (side === 'offense' && b.status === 'playing') {
      b.firstHit = true;
      if (b.character === 'speed' && !b.speedUsed && result.bases === 1) {
        b.speedUsed = true;
        scoreRuns(b, advance(b.bases, 1, false));
      }
    }
  } else {
    if (side === 'offense' && b.forced === 'out' && b.outs < 2 && b.sacrificeAdvance)
      scoreRuns(b, advance(b.bases, b.sacrificeAdvance));
    const turnTwo = side === 'defense' && b.doubleplay && b.bases[0];
    if (side === 'offense' && b.risk) {
      const i = b.bases.lastIndexOf(true);
      if (i >= 0) {
        b.bases[i] = false;
        recordOut(b);
      }
    }
    if (turnTwo) b.bases[0] = false;
    recordOut(b);
    if (turnTwo && b.status === 'playing') recordOut(b);
  }
  b.discard.push(...b.hand);
  b.hand = [];
  if (b.status === 'playing') {
    if (b.showdown) finishHalf(b);
    else startTurn(b);
  }
  return true;
}

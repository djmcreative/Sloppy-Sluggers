// Player policies.
//
// Cards no longer change state when played - they change how the at-bat
// will RESOLVE at end of turn. So the AI can't score a card by diffing the
// board; it has to project the resolution. That projection is this file.
//
// `offenseOnly` is the load-bearing policy: if it wins as often as
// `balanced`, defense is skippable and the double-sided premise has failed.

var R = require("./rules");

// Board state is worth something on its own, independent of this swing.
// Without this the AI cannot see walks or steals at all - they change no
// margin - so it never plays them and a small-ball deck looks worthless.
function boardValue(G, w) {
  var s = G.state;
  var v = 0;
  for (var i = 0; i < 3; i++) if (s.bases[i]) v += w.baseRunner * (i + 1);
  // balls are progress toward a free runner, and the last one is worth most
  v += s.balls * w.ball * (s.balls >= 3 ? 2.5 : 1);
  v -= s.strikes * w.strike * 0.4;
  return G.onOffense() ? v : -v;
}

// What the at-bat is worth, given the modifiers accumulated so far.
function projectValue(G, w) {
  var s = G.state, it = s.intent;
  if (!it) return boardValue(G, w);

  var runners = s.bases.filter(Boolean).length;
  var onThird = s.bases[2] ? 1 : 0;
  var margin, power;

  if (G.onOffense()) {
    if (it.outOfZone || it.reactive === "risp") return 0;
    margin = R.BASE_CONTACT + s.contactMod - (it.stuff + s.settled);
    power = s.powerMod;
  } else {
    if (it.takes || it.steals || it.sacFly) return 0;
    margin = it.contact - (R.BASE_STUFF + s.stuffMod + s.settled);
    power = Math.max(0, it.power - s.gloveMod);
  }

  var v;
  if (margin <= 0) {
    v = -w.strike * (s.strikes >= 2 ? 2.2 : 1);          // swing and miss
  } else if (margin === 1) {
    // ball in play: an out, but it can be productive
    v = -w.out;
    if (s.outs < 2) {
      v += runners * w.advance;
      if (s.tagUpActive && onThird) v += w.run;
      else if (onThird) v += w.run * 0.25;
    }
    if (s.bases[0] && s.outs < 2) v -= w.dpRisk;
  } else {
    var bases = Math.min(4, 1 + power);
    v = w.hit + bases * w.baseValue;
    // rough value of the runners this drives in
    var scored = 0;
    for (var i = 2; i >= 0; i--) if (s.bases[i] && i + bases >= 3) scored++;
    v += scored * w.run;
  }

  // on defense every sign flips: their good outcome is your bad one
  return (G.onOffense() ? v : -v) + boardValue(G, w);
}

var WEIGHTS = {
  balanced:    { strike: 3, foulSave: 2.5, out: 7, run: 12, hit: 5, baseValue: 1.5,
                 advance: 1.2, dpRisk: 2.5, draw: 1.2, stamina: 0.10, baseRunner: 1.8, ball: 1.1 },
  offenseOnly: { strike: 3, foulSave: 2.5, out: 7, run: 12, hit: 5, baseValue: 1.5,
                 advance: 1.2, dpRisk: 2.5, draw: 1.2, stamina: 0.10, baseRunner: 1.8, ball: 1.1 },
  defenseOnly: { strike: 3, foulSave: 2.5, out: 7, run: 12, hit: 5, baseValue: 1.5,
                 advance: 1.2, dpRisk: 2.5, draw: 1.2, stamina: 0.10, baseRunner: 1.8, ball: 1.1 },
  hoardStamina:{ strike: 3, foulSave: 2.5, out: 7, run: 12, hit: 5, baseValue: 1.5,
                 advance: 1.2, dpRisk: 2.5, draw: 1.2, stamina: 0.55, baseRunner: 1.8, ball: 1.1 }
};

// how much of each phase the policy actually engages with
var ENGAGE = {
  balanced:     { offense: 1.0, defense: 1.0 },
  offenseOnly:  { offense: 1.0, defense: 0.0 },   // never spends on defense
  defenseOnly:  { offense: 0.0, defense: 1.0 },
  hoardStamina: { offense: 1.0, defense: 1.0 }
};

// Reaching a hit costs three Contact, and the intermediate steps look WORSE
// than stopping short (a foul beats a ground-out). Greedy hill-climbing gets
// stuck in that valley and fouls away every at-bat, so this searches whole
// combinations instead. Hand is <= 5, so the subset space is tiny.
function takeTurn(G, policy) {
  var w = WEIGHTS[policy];
  var engage = ENGAGE[policy][G.onOffense() ? "offense" : "defense"];
  if (engage <= 0) return;
  if (G.halfOver || G.state.over) return;

  var hand = G.state.hand;
  var playable = [];
  for (var i = 0; i < hand.length; i++) {
    var c = R.CARDS[hand[i]];
    if (c && !c.unplayable) playable.push(i);
  }
  if (!playable.length) return;

  var bestSet = null, bestVal = projectValue(G, w);   // doing nothing

  var n = playable.length;
  for (var mask = 1; mask < (1 << n); mask++) {
    var ids = [], cost = 0, ok = true;
    for (var b = 0; b < n; b++) {
      if (!(mask & (1 << b))) continue;
      var id = hand[playable[b]];
      cost += R.CARDS[id].cost;
      if (cost > G.state.energy) { ok = false; break; }
      ids.push(id);
    }
    if (!ok) continue;

    var probe = clone(G);
    for (var k = 0; k < ids.length; k++) {
      var at = probe.state.hand.indexOf(ids[k]);
      if (at >= 0) probe.playCard(at);
    }
    var v = projectValue(probe, w);
    v += (probe.state.energy) * w.stamina * R.STAMINA.takePitch;  // banked stamina
    if (v > bestVal) { bestVal = v; bestSet = ids; }
  }

  if (!bestSet) return;
  for (var j = 0; j < bestSet.length; j++) {
    var idx = G.state.hand.indexOf(bestSet[j]);
    if (idx >= 0) G.playCard(idx);
  }
}

function clone(G) {
  var p = Object.create(R.Game.prototype);
  p.rng = function () { return 0.5; };
  p.innings = G.innings; p.modifiers = G.modifiers;
  p.run = { stamina: G.run.stamina, deck: G.run.deck };
  p.stats = {}; for (var k in G.stats) p.stats[k] = G.stats[k];
  p.halfOver = G.halfOver;
  var s = G.state;
  p.state = {
    inning: s.inning, batting: s.batting,
    score: { player: s.score.player, ai: s.score.ai },
    outs: s.outs, strikes: s.strikes, balls: s.balls,
    bases: s.bases.slice(),
    energy: s.energy, maxEnergy: s.maxEnergy,
    hand: s.hand.slice(), draw: s.draw.slice(),
    discard: s.discard.slice(), exhausted: s.exhausted.slice(),
    contactMod: s.contactMod, powerMod: s.powerMod,
    stuffMod: s.stuffMod, gloveMod: s.gloveMod,
    tagUpActive: s.tagUpActive, dpArmed: s.dpArmed,
    forceFoul: s.forceFoul, tookPitch: s.tookPitch,
    turn: s.turn, powers: Object.assign({}, s.powers),
    intent: s.intent, over: s.over
  };
  return p;
}

module.exports = { takeTurn: takeTurn, WEIGHTS: WEIGHTS, projectValue: projectValue, boardValue: boardValue };

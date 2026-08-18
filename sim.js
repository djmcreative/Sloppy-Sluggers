// Sloppy Sluggers v2 simulation harness.
//
// Answers, in order of how much they matter:
//   1. Does the stamina system spiral?  (drain vs the recovery valves)
//   2. Is defense skippable?            (offenseOnly vs balanced win rate)
//   3. Are the three characters close?
//
// Usage:  node sim.js [trials]

var R = require("./rules");
var AI = require("./ai");

var TRIALS = parseInt(process.argv[2], 10) || 400;

// deterministic per-trial rng so results are reproducible
function makeRng(seed) {
  var x = seed >>> 0;
  return function () {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5;  x >>>= 0;
    return (x >>> 0) / 4294967296;
  };
}

function playGame(run, policy, rng, opts) {
  opts = opts || {};
  var G = new R.Game({
    rng: rng,
    innings: opts.innings || 3,
    modifiers: opts.modifiers || {},
    run: run
  });

  run.stamina = Math.max(0, run.stamina - R.STAMINA.perGame);

  var inning = 1;
  var guard = 0;
  while (guard++ < 200) {
    G.state.inning = inning;

    ["player", "ai"].forEach(function (team) {
      G.startHalf(team);
      var turnGuard = 0;
      while (!G.halfOver && turnGuard++ < 60) {
        G.startTurn();
        AI.takeTurn(G, policy);
        G.endTurn();
      }
    });

    if (inning >= G.innings) {
      if (G.state.score.player !== G.state.score.ai) break;
      run.stamina = Math.max(0, run.stamina - R.STAMINA.perExtraInning);
      G.innings++;          // extra innings
    }
    inning++;
  }

  return {
    won: G.state.score.player > G.state.score.ai,
    score: G.state.score,
    stats: G.stats
  };
}

// Pick 1 of 3 from the character's pool, or skip. The policy decides by a
// crude read of what the deck is short of, which is a weak proxy for a real
// player's draft but at least is not random.
function draftReward(run, character, policy, rng) {
  var pool = R.REWARD_POOLS[character].slice();
  var offered = [];
  for (var i = 0; i < 3 && pool.length; i++) {
    offered.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  if (!offered.length) return;

  // offenseOnly refuses anything whose value is mostly defensive
  var best = null, bestScore = 0.6;      // below this, skip the pick
  for (var j = 0; j < offered.length; j++) {
    var id = offered[j];
    var probe = new R.Game({ rng: rng, innings: 1, run: run });
    probe.startHalf("player");
    probe.state.intent = R.PITCHES.fastball;
    probe.state.energy = 9;
    var before = AI.projectValue(probe, AI.WEIGHTS[policy]);
    probe.state.hand = [id];
    probe.playCard(0);
    var offVal = AI.projectValue(probe, AI.WEIGHTS[policy]) - before;

    var probeD = new R.Game({ rng: rng, innings: 1, run: run });
    probeD.startHalf("ai");
    probeD.state.intent = R.SWINGS.contact_swing;
    probeD.state.energy = 9;
    var beforeD = AI.projectValue(probeD, AI.WEIGHTS[policy]);
    probeD.state.hand = [id];
    probeD.playCard(0);
    var defVal = AI.projectValue(probeD, AI.WEIGHTS[policy]) - beforeD;

    var score = (offVal + defVal) / 2 - R.CARDS[id].cost * 0.2;
    if (score > bestScore) { bestScore = score; best = id; }
  }
  if (best) run.deck.push(best);
}

// an act = best-of-3 series, with a rest node between games
function playAct(character, policy, rng, actIndex) {
  var run = { stamina: R.STAMINA.start, deck: R.CHARACTERS[character].deck.slice() };
  var wins = 0, losses = 0, games = 0;
  var agg = { cardsPlayed: 0, offenseCards: 0, defenseCards: 0,
              takenPitches: 0, staminaGained: 0, staminaSpent: 0,
              hits: 0, strikeouts: 0, ballsInPlay: 0, doublePlays: 0, walks: 0 };
  var runsFor = 0, runsAgainst = 0;
  var staminaAtGame = [];

  while (wins < 2 && losses < 2) {
    staminaAtGame.push(run.stamina);
    var isBoss = false;
    var res = playGame(run, policy, rng, { innings: isBoss ? 9 : 3 });
    games++;
    if (res.won) wins++; else losses++;
    for (var k in agg) agg[k] += res.stats[k];
    runsFor += res.score.player; runsAgainst += res.score.ai;
    if (wins < 2 && losses < 2) {
      run.stamina = Math.min(R.STAMINA.start, run.stamina + R.STAMINA.restNode);
      draftReward(run, character, policy, rng);
    }
  }

  return { won: wins >= 2, games: games, endStamina: run.stamina,
           staminaAtGame: staminaAtGame, stats: agg,
           runsFor: runsFor, runsAgainst: runsAgainst };
}

function runTrials(character, policy) {
  var out = { seriesWon: 0, gamesPlayed: 0, endStamina: [], lowStamina: [],
              off: 0, def: 0, taken: 0, gained: 0, spent: 0,
              hits: 0, strikeouts: 0, bip: 0, dps: 0, walks: 0,
              runsFor: 0, runsAgainst: 0 };

  for (var t = 0; t < TRIALS; t++) {
    var rng = makeRng(t * 7919 + characters.indexOf(character) * 104729 +
                      policies.indexOf(policy) * 1299709);
    var a = playAct(character, policy, rng, 0);
    if (a.won) out.seriesWon++;
    out.gamesPlayed += a.games;
    out.endStamina.push(a.endStamina);
    out.lowStamina.push(Math.min.apply(null, a.staminaAtGame));
    out.off += a.stats.offenseCards;
    out.def += a.stats.defenseCards;
    out.taken += a.stats.takenPitches;
    out.gained += a.stats.staminaGained;
    out.spent += a.stats.staminaSpent;
    out.hits += a.stats.hits; out.strikeouts += a.stats.strikeouts;
    out.bip += a.stats.ballsInPlay; out.dps += a.stats.doublePlays;
    out.walks += a.stats.walks;
    out.runsFor += a.runsFor; out.runsAgainst += a.runsAgainst;
  }
  return out;
}

function mean(list) {
  return list.reduce(function (a, b) { return a + b; }, 0) / list.length;
}

// ---------------------------------------------------------------- report

var characters = ["dean_kean", "speedster", "all_purpose"];
var policies = ["balanced", "offenseOnly", "defenseOnly", "hoardStamina"];

console.log("Sloppy Sluggers v2 - " + TRIALS + " series per cell\n");

console.log("SERIES WIN RATE (best of 3, 3-inning games)");
console.log("character      " + policies.map(function (p) {
  return p.padEnd(13);
}).join(""));

var results = {};
characters.forEach(function (c) {
  var row = c.padEnd(15);
  results[c] = {};
  policies.forEach(function (p) {
    var r = runTrials(c, p);
    results[c][p] = r;
    row += ((r.seriesWon / TRIALS * 100).toFixed(0) + "%").padEnd(13);
  });
  console.log(row);
});

console.log("\nIS DEFENSE SKIPPABLE?");
console.log("  If offenseOnly matches balanced, the double-sided premise fails.");
characters.forEach(function (c) {
  var b = results[c].balanced.seriesWon / TRIALS * 100;
  var o = results[c].offenseOnly.seriesWon / TRIALS * 100;
  var gap = b - o;
  var verdict = gap >= 12 ? "defense matters" :
                gap >= 5  ? "marginal" : "DEFENSE SKIPPABLE";
  console.log("  " + c.padEnd(14) + "balanced " + b.toFixed(0) + "%  vs  offenseOnly " +
              o.toFixed(0) + "%   gap " + gap.toFixed(0) + "pts  -> " + verdict);
});

console.log("\nSTAMINA: does it spiral?");
console.log("  character      end   worst   gained  drained   net");
characters.forEach(function (c) {
  var r = results[c].balanced;
  var net = (r.gained - r.spent) / TRIALS;
  console.log("  " + c.padEnd(14) +
    mean(r.endStamina).toFixed(0).padStart(4) +
    mean(r.lowStamina).toFixed(0).padStart(7) +
    (r.gained / TRIALS).toFixed(0).padStart(9) +
    (r.spent / TRIALS).toFixed(0).padStart(9) +
    (net >= 0 ? "+" : "") + net.toFixed(0).padStart(5));
});

console.log("\nBOX SCORE per game (balanced policy)");
characters.forEach(function (c) {
  var r = results[c].balanced, g = r.gamesPlayed;
  console.log("  " + c.padEnd(14) +
    "hits " + (r.hits / g).toFixed(1).padStart(4) +
    "   K " + (r.strikeouts / g).toFixed(1).padStart(4) +
    "   BIP " + (r.bip / g).toFixed(1).padStart(4) +
    "   DP " + (r.dps / g).toFixed(2).padStart(5) +
    "   BB " + (r.walks / g).toFixed(1).padStart(4) +
    "   avg score " + (r.runsFor / g).toFixed(1) + "-" + (r.runsAgainst / g).toFixed(1));
});

console.log("\nCARD SPLIT (balanced policy) - offense vs defense cards played");
characters.forEach(function (c) {
  var r = results[c].balanced;
  var total = r.off + r.def;
  console.log("  " + c.padEnd(14) +
    "offense " + (r.off / total * 100).toFixed(0) + "%   defense " +
    (r.def / total * 100).toFixed(0) + "%   pitches taken/series " +
    (r.taken / TRIALS).toFixed(1));
});

// Sloppy Sluggers v2 - headless rules engine.
//
// No DOM anywhere in here; the browser build loads this same file.
//
// THE AT-BAT MODEL
// Each turn is one at-bat, resolved once at end of turn by comparing two
// numbers. Cards no longer produce hits directly - they modify the swing.
//
//   batting:  your Contact (base 1) vs the pitch's Stuff
//   fielding: their Contact         vs your Stuff (base 1)
//
//   margin < 1   swing and miss   -> strike
//   margin = 1   ball in play     -> OUT, runners advance
//   margin >= 2  base hit         -> 1 base, +1 per Power
//
// There used to be a foul rung at margin 0, and it broke the incentive
// curve: spending a card to go from foul to ball-in-play made your position
// WORSE, so the middle of the ladder was a trap and the only sane plays were
// "stop short" or "go all the way". Every point of Contact is now strictly
// better than the last. Fouling survives as the Foul Off card, where it is a
// deliberate choice rather than an accident of arithmetic.
//
// The ball-in-play rung is what makes this a baseball game rather than a
// scoring exhibition - most contact is an out, as in the real sport. Two
// real rules do heavy lifting and must not be "simplified" away:
//   - if the ball in play is the third out, nothing advances, nobody scores
//   - a runner on first with under two outs can be doubled off
//
// Three mirrored pairs:
//   Contact <-> Stuff        the binary: do you connect at all
//   Power   <-> Glove        the magnitude: how far it goes
//   Tag Up  <-> Double Play  converting outs - yours to runs, theirs to more outs

var STAMINA_TIERS = [
  { min: 70, hand: 5, label: "Fresh" },
  { min: 35, hand: 4, label: "Worn" },
  { min: 0,  hand: 3, label: "Gassed" }
];

var STAMINA = {
  start: 100,
  perGame: 18,
  perOut: 5,
  perExtraInning: 5,
  takePitch: 1,
  foulOff: 4,
  restNode: 20
};

var ENERGY_PER_TURN = 3;

// Baselines, swept rather than guessed. At 3/1 the two sides come out close
// to even before card rewards, which is where a roguelike should start.
// These two numbers set the entire difficulty curve - change them and
// re-sweep, don't nudge card values to compensate.
var BASE_CONTACT = 3;   // your Contact at the plate before any cards
var BASE_STUFF   = 1;   // your Stuff on the mound before any cards

// He settles in against the batter he is facing - +1 to his side every
// couple of turns, so a long at-bat turns against you and stalling loses.
//
// Crucially this RESETS when a new batter steps in (see recordOut). It used
// to be a clock on the whole half, which meant that once he reached +3 no
// hand could reach a hit and the back half of every inning was dead - the
// hit rate after the first out was around 1-14%.
var SETTLE_EVERY = 2;
var OUTS_PER_HALF = 3;
var DOUBLE_PLAY_CHANCE = 0.30;

// ---------------------------------------------------------------- intents

// Stuff is the number your Contact has to beat.
var PITCHES = {
  fastball:       { name: "Fastball",       stuff: 2, weight: 5, tag: "heat" },
  high_heat:      { name: "High Heat",      stuff: 3, weight: 3, tag: "heat", minTurn: 2 },
  painted_corner: { name: "Painted Corner", stuff: 3, weight: 2, tag: "breaking" },
  curveball:      { name: "Curveball",      stuff: 2, weight: 3, tag: "breaking", junk: true },
  waste_pitch:    { name: "Waste Pitch",    stuff: 0, weight: 2, tag: "junk", outOfZone: true },
  pickoff:        { name: "Pickoff",        stuff: 0, weight: 0, tag: "junk", reactive: "risp" },
  turn_two:       { name: "Turn Two",       stuff: 2, weight: 0, tag: "junk", reactive: "two_on", forcesDP: true }
};

// Their Contact is the number your Stuff has to beat.
// Their Contact sits one tier above the pitches' Stuff, because on defense
// you start at Stuff 1 against a batter who is already swinging - doing
// nothing has to mean they hit. That is the automatic clock on that side.
var SWINGS = {
  contact_swing: { name: "Contact Swing",  contact: 3, power: 0, weight: 5, tag: "contact" },
  gap_shot:      { name: "Gap Shot",       contact: 4, power: 1, weight: 3, tag: "power" },
  big_cut:       { name: "Big Cut",        contact: 5, power: 2, weight: 2, tag: "power" },
  bunt:          { name: "Bunt",           contact: 3, power: 0, weight: 2, tag: "contact", advancesAll: true },
  work_count:    { name: "Work the Count", contact: 0, power: 0, weight: 2, tag: "contact", takes: true },
  steal_attempt: { name: "Steal Attempt",  contact: 0, power: 0, weight: 0, tag: "contact", reactive: "runner", steals: true },
  sac_fly:       { name: "Sac Fly",        contact: 0, power: 0, weight: 0, tag: "contact", reactive: "third", sacFly: true }
};

// ------------------------------------------------------------------ cards
// `o` runs while batting, `d` while fielding. Cost is shared - that is the
// whole tension of the double-sided design.

var CARDS = {

  // ---- shared basics ----
  sloppy_single: { name: "Sloppy Single", cost: 1,
    o: function (G) { G.contact(1); }, d: function (G) { G.stuff(1); } },

  // Costs 1. Free Power is the same trap as free Contact: it turns every
  // hit into an extra-base hit and inflates scoring by half again.
  dig_in: { name: "Dig In", cost: 1,
    o: function (G) { G.power(1); }, d: function (G) { G.glove(1); } },

  // Now that the ladder has no foul rung, this is the ONLY way to survive a
  // pitch without a result - which makes it a genuine two-strike card rather
  // than a worse version of something free. It also refills your hand, so
  // spending your swing on it isn't pure tempo loss.
  foul_off: { name: "Foul Off", cost: 0,
    o: function (G) { G.state.forceFoul = true; G.draw(1); G.gainStamina(STAMINA.foulOff); },
    d: function (G) { G.stuff(1); G.draw(1); G.gainStamina(STAMINA.foulOff); } },

  // ---- Dean Kean: power. less contact, more damage, more strikeouts ----
  rip_it: { name: "Rip It", cost: 1,
    o: function (G) { G.contact(1); G.power(1); },
    d: function (G) { G.stuff(1); G.glove(1); } },

  uppercut: { name: "Uppercut", cost: 2,
    o: function (G) { G.power(3); }, d: function (G) { G.glove(2); G.stuff(1); } },

  sween: { name: "Sween", cost: 1,
    o: function (G) { G.power(3); G.takeStrike(); },
    d: function (G) { G.stuff(2); G.giveBall(); } },

  golf_swing: { name: "Golf Swing", cost: 1,
    o: function (G) { G.contact(1); G.power(1); G.takeStrike(); },
    d: function (G) { G.stuff(1); G.glove(1); G.giveBall(); } },

  brushback: { name: "Brushback", cost: 1,
    o: function (G) { G.contact(1); G.takeBall(); },
    d: function (G) { G.stuff(1); G.glove(1); } },

  gas: { name: "Gas", cost: 2,
    o: function (G) { G.contact(2); G.draw(1); },
    d: function (G) { G.stuff(2); G.draw(1); } },

  deaner: { name: "DEANER", cost: 3, exhaust: true,
    o: function (G) { G.contact(3); G.power(3); },
    d: function (G) { G.stuff(3); G.armDoublePlay(); } },

  // ---- Speedster: manufactures runs WITHOUT hits ----
  // He can't win the Contact race - three points in one turn is beyond his
  // curve. So he doesn't try. He reaches base on walks, moves runners with
  // steals, and cashes them in on Tag Up sacrifices. Cheap cards, many per
  // turn, and productive outs are upside rather than failure.

  leg_it_out: { name: "Leg It Out", cost: 1,
    o: function (G) { G.contact(1); G.steal(); },
    d: function (G) { G.stuff(1); G.hold(); } },

  slide: { name: "Slide", cost: 0,
    o: function (G) { G.steal(); }, d: function (G) { G.hold(); } },

  good_eye: { name: "Good Eye", cost: 0,
    o: function (G) { G.takeBall(); G.draw(1); },
    d: function (G) { G.stuff(1); G.draw(1); } },

  sac_bunt: { name: "Sac Bunt", cost: 0,
    o: function (G) { G.tagUp(); },
    d: function (G) { G.armDoublePlay(); } },

  small_ball: { name: "Small Ball", cost: 1,
    o: function (G) { G.takeBall(); G.steal(); },
    d: function (G) { G.stuff(1); G.hold(); } },

  dribbler: { name: "Dribbler", cost: 1,
    o: function (G) { G.contact(1); G.tagUp(); },
    d: function (G) { G.stuff(1); G.armDoublePlay(); } },

  hustle: { name: "Hustle", cost: 1,
    o: function (G) { G.contact(1); G.steal(); },
    d: function (G) { G.stuff(1); G.pickoff(); } },

  // Answers his specific problem: he cannot win a long at-bat, because the
  // pitcher settles in faster than his Contact can climb. This resets that.
  step_out: { name: "Step Out", cost: 0,
    o: function (G) { G.resetSettle(); },
    d: function (G) { G.settleEarly(); } },

  // Free Contact is banned everywhere else because it deletes outs. This is
  // the exception that stays safe: it caps the hit at a single, so it can
  // buy him on-base but never inflate scoring.
  choke_up: { name: "Choke Up", cost: 0,
    o: function (G) { G.contact(1); G.chokeUp(); },
    d: function (G) { G.glove(1); } },

  wheels: { name: "Wheels", cost: 2,
    o: function (G) { G.advance(1); G.tagUp(); },
    d: function (G) { G.armDoublePlay(); G.glove(1); } },

  // ---- All-Purpose: value, and the Tag Up identity ----
  punch_it: { name: "Punch It", cost: 1,
    o: function (G) { G.contact(1); G.draw(1); },
    d: function (G) { G.stuff(1); G.draw(1); } },

  work_the_count: { name: "Work the Count", cost: 0,
    o: function (G) { G.takeBall(); },
    d: function (G) { G.glove(1); G.stuff(1); } },

  clutch: { name: "Clutch", cost: 1,
    o: function (G) { G.contact(G.state.bases[2] ? 2 : 1); },
    d: function (G) { G.stuff(G.state.outs >= 2 ? 2 : 1); } },

  sac_fly_card: { name: "Sac Fly", cost: 1,
    o: function (G) { G.tagUp(); G.contact(1); },
    d: function (G) { G.armDoublePlay(); } },

  opposite_field: { name: "Opposite Field", cost: 1,
    o: function (G) { G.contact(1); G.power(1); },
    d: function (G) { G.glove(2); } },

  grinder: { name: "Grinder", cost: 2,
    o: function (G) { G.contact(2); G.power(1); },
    d: function (G) { G.stuff(2); G.glove(1); } },

  junk: { name: "Junk", cost: 0, unplayable: true, o: function () {}, d: function () {} }
};


// ---------------------------------------------------------------- rewards
// Ten per character, drafted 1-of-3 after each game and skippable.
// Deliberately split into thirds: offense-slanted, defense-slanted, and
// balanced. If every card were good on both sides the draft would be a
// power ranking rather than a choice, which is the failure mode Griftlands
// players describe when one deck becomes "secondary".

var REWARD_CARDS = {

  // ---- Dean Kean: power ----
  mash:            { name: "Mash", cost: 2,
    o: function (G) { G.power(4); }, d: function (G) { G.glove(2); } },
  cage_work:       { name: "Cage Work", cost: 1,
    o: function (G) { G.contact(1); G.power(1); }, d: function (G) { G.stuff(1); G.glove(1); } },
  all_or_nothing:  { name: "All or Nothing", cost: 1,
    o: function (G) { G.power(3); G.takeStrike(); }, d: function (G) { G.stuff(3); G.giveBall(); } },
  elbow_guard:     { name: "Elbow Guard", cost: 0,
    o: function (G) { G.takeBall(); }, d: function (G) { G.glove(1); } },
  second_deck:     { name: "Second Deck", cost: 2,
    o: function (G) { G.power(G.state.strikes >= 2 ? 4 : 1); },
    d: function (G) { G.stuff(G.state.outs >= 2 ? 3 : 1); } },
  grip_it:         { name: "Grip It", cost: 1,
    o: function (G) { G.contact(2); }, d: function (G) { G.stuff(2); } },
  batting_practice:{ name: "Batting Practice", cost: 1,
    o: function (G) { G.contact(1); G.draw(1); }, d: function (G) { G.stuff(1); G.draw(1); } },
  corner_outfield: { name: "Corner Outfield", cost: 1,
    o: function (G) { G.power(2); }, d: function (G) { G.glove(3); } },
  wheelhouse:      { name: "Wheelhouse", cost: 2,
    o: function (G) { G.contact(2); G.power(2); }, d: function (G) { G.stuff(1); G.glove(1); } },
  ace_of_the_staff:{ name: "Ace of the Staff", cost: 2,
    o: function (G) { G.contact(1); }, d: function (G) { G.stuff(3); G.armDoublePlay(); } },

  // ---- Speedster: manufacture ----
  jump_early:      { name: "Jump Early", cost: 0,
    o: function (G) { G.steal(); }, d: function (G) { G.hold(); } },
  delayed_steal:   { name: "Delayed Steal", cost: 1,
    o: function (G) { G.steal(); G.steal(); }, d: function (G) { G.pickoff(); G.stuff(1); } },
  hit_and_run:     { name: "Hit and Run", cost: 1,
    o: function (G) { G.contact(1); G.steal(); }, d: function (G) { G.stuff(1); G.armDoublePlay(); } },
  fake_bunt:       { name: "Fake Bunt", cost: 0,
    o: function (G) { G.tagUp(); G.draw(1); }, d: function (G) { G.armDoublePlay(); G.draw(1); } },
  take_third:      { name: "Take Third", cost: 1,
    o: function (G) { G.advance(1); }, d: function (G) { G.pickoff(); G.glove(1); } },
  manufacture:     { name: "Manufacture", cost: 2,
    o: function (G) { G.takeBall(); G.takeBall(); G.steal(); },
    d: function (G) { G.stuff(2); G.pickoff(); } },
  slap_single:     { name: "Slap Single", cost: 1,
    o: function (G) { G.contact(2); }, d: function (G) { G.stuff(2); } },
  track_star:      { name: "Track Star", cost: 2,
    o: function (G) { G.contact(1); G.steal(); G.draw(1); },
    d: function (G) { G.glove(2); G.draw(1); } },
  gold_glove:      { name: "Gold Glove", cost: 1,
    o: function (G) { G.contact(1); }, d: function (G) { G.glove(3); } },
  rundown:         { name: "Rundown", cost: 1,
    o: function (G) { G.tagUp(); G.steal(); }, d: function (G) { G.armDoublePlay(); G.pickoff(); } },

  // ---- All-Purpose: value ----
  study_film:      { name: "Study Film", cost: 0,
    o: function (G) { G.draw(2); }, d: function (G) { G.draw(2); } },
  two_way_player:  { name: "Two-Way Player", cost: 2,
    o: function (G) { G.contact(2); G.power(1); }, d: function (G) { G.stuff(2); G.glove(1); } },
  second_wind:     { name: "Second Wind", cost: 0,
    o: function (G) { G.gainStamina(12); }, d: function (G) { G.gainStamina(12); } },
  rally:           { name: "Rally", cost: 1,
    o: function (G) { G.contact(1); G.advance(1); }, d: function (G) { G.stuff(1); G.pickoff(); } },
  captain:         { name: "Captain", cost: 1,
    o: function (G) { G.contact(G.state.bases[1] || G.state.bases[2] ? 2 : 1); },
    d: function (G) { G.stuff(1); G.glove(1); } },
  pinch_hitter:    { name: "Pinch Hitter", cost: 1,
    o: function (G) { G.contact(1); G.draw(1); }, d: function (G) { G.stuff(1); G.draw(1); } },
  veteran_presence:{ name: "Veteran Presence", cost: 2,
    o: function (G) { G.contact(1); G.power(1); G.draw(1); },
    d: function (G) { G.stuff(1); G.glove(1); G.draw(1); } },
  utility_man:     { name: "Utility Man", cost: 1,
    o: function (G) { G.contact(1); G.tagUp(); }, d: function (G) { G.glove(1); G.armDoublePlay(); } },
  bench_depth:     { name: "Bench Depth", cost: 1,
    o: function (G) { G.contact(2); }, d: function (G) { G.stuff(2); } },
  double_switch:   { name: "Double Switch", cost: 2,
    o: function (G) { G.contact(1); G.power(2); }, d: function (G) { G.stuff(2); G.armDoublePlay(); } }
};

for (var rid in REWARD_CARDS) CARDS[rid] = REWARD_CARDS[rid];

var REWARD_POOLS = {
  dean_kean: ["mash","cage_work","all_or_nothing","step_out","second_deck",
              "grip_it","batting_practice","corner_outfield","wheelhouse","ace_of_the_staff"],
  speedster: ["jump_early","delayed_steal","hit_and_run","fake_bunt","take_third",
              "manufacture","slap_single","track_star","gold_glove","rundown"],
  all_purpose:["study_film","two_way_player","second_wind","rally","captain",
               "step_out","veteran_presence","utility_man","bench_depth","double_switch"]
};

var CHARACTERS = {
  // Low Contact, high Power. He whiffs more than the others and hurts more
  // when he connects - that is the archetype. Giving him competitive Contact
  // as well just made him strictly better than everyone.
  dean_kean: { name: "Dean Kean", deck:
    ["sloppy_single","sloppy_single","foul_off","dig_in","dig_in",
     "rip_it","rip_it","uppercut","uppercut","sween","golf_swing","brushback"] },

  // Two Small Ball, not one. His whole engine is walk-then-steal, and with
  // a single copy he simply did not draw it often enough to run it - the
  // second copy is worth more than 25 points of win rate on its own.
  speedster: { name: "Speedster", deck:
    ["sloppy_single","sloppy_single",
     "good_eye","good_eye","slide","choke_up","step_out",
     "hustle","dribbler","small_ball","small_ball","wheels"] },

  all_purpose: { name: "All-Purpose", deck:
    ["sloppy_single","sloppy_single","sloppy_single","dig_in","work_the_count","foul_off",
     "punch_it","punch_it","clutch","sac_fly_card","opposite_field","grinder"] }
};

// ------------------------------------------------------------------ engine

function shuffle(list, rng) {
  for (var i = list.length - 1; i > 0; i--) {
    var j = Math.floor(rng() * (i + 1));
    var t = list[i]; list[i] = list[j]; list[j] = t;
  }
  return list;
}

function tierFor(stamina) {
  for (var i = 0; i < STAMINA_TIERS.length; i++) {
    if (stamina >= STAMINA_TIERS[i].min) return STAMINA_TIERS[i];
  }
  return STAMINA_TIERS[STAMINA_TIERS.length - 1];
}

function Game(options) {
  this.rng = options.rng || Math.random;
  this.innings = options.innings || 3;
  this.modifiers = options.modifiers || {};
  this.run = options.run;
  this.stats = { cardsPlayed: 0, offenseCards: 0, defenseCards: 0, takenPitches: 0,
                 staminaGained: 0, staminaSpent: 0,
                 hits: 0, strikeouts: 0, ballsInPlay: 0, doublePlays: 0, walks: 0 };

  this.state = {
    inning: 1, batting: "player",
    score: { player: 0, ai: 0 },
    outs: 0, strikes: 0, balls: 0,
    bases: [false, false, false],
    energy: 0, maxEnergy: ENERGY_PER_TURN,
    hand: [], draw: [], discard: [], exhausted: [],
    contactMod: 0, powerMod: 0, stuffMod: 0, gloveMod: 0, settled: 0,
    tagUpActive: false, dpArmed: false, forceFoul: false, tookPitch: false,
    stoleThisTurn: false, pickoffArmed: false, pickedOffThisTurn: false,
    settleAnchor: 1, capSingle: false,
    turn: 1, powers: {}, intent: null, over: false
  };
  this.halfOver = false;
}

Game.prototype.onOffense = function () { return this.state.batting === "player"; };
Game.prototype.mod = function (k) {
  var m = this.modifiers[this.state.inning];
  return m && m[k];
};

// ---------- what the cards call ----------
Game.prototype.contact = function (n) { this.state.contactMod += n; };
Game.prototype.power   = function (n) { this.state.powerMod += n; };
Game.prototype.stuff   = function (n) { this.state.stuffMod += n; };
Game.prototype.glove   = function (n) {
  this.state.gloveMod += this.mod("windOut") ? Math.floor(n / 2) : n;
};
Game.prototype.tagUp         = function () { this.state.tagUpActive = true; };

// Holding the runner catches a steal attempt but doesn't retire anyone on
// its own. Free cards get this; the real Pickoff, which is an out, costs
// energy - a 0-cost card should not answer a reactive threat outright.
Game.prototype.hold = function () { this.state.pickoffArmed = true; };

// Settled is normally computed once at the start of a turn, so these have
// to recompute it too - otherwise the card has no effect on the at-bat it
// was played to save, which is the only at-bat that matters.
Game.prototype.recomputeSettle = function () {
  var s = this.state;
  s.settled = Math.max(0, Math.floor((s.turn - s.settleAnchor) / SETTLE_EVERY));
};
// step out of the box - his rhythm starts over
Game.prototype.resetSettle = function () {
  this.state.settleAnchor = this.state.turn;
  this.recomputeSettle();
};
// the mirror: settle in early yourself
Game.prototype.settleEarly = function () {
  this.state.settleAnchor -= SETTLE_EVERY;
  this.recomputeSettle();
};
// choke up: you'll make contact, but you're not driving it anywhere
Game.prototype.chokeUp = function () { this.state.capSingle = true; };
Game.prototype.armDoublePlay = function () { this.state.dpArmed = true; };

Game.prototype.scoreRun = function (n) {
  this.state.score[this.state.batting] += this.mod("rallyCap") ? n * 2 : n;
};

Game.prototype.advance = function (n) {
  var s = this.state;
  for (var i = 2; i >= 0; i--) {
    if (!s.bases[i]) continue;
    s.bases[i] = false;
    if (i + n >= 3) this.scoreRun(1); else s.bases[i + n] = true;
  }
};

Game.prototype.steal = function () {
  var s = this.state;
  // your runner is moving, which is also what beats a pickoff throw
  s.stoleThisTurn = true;
  for (var i = 2; i >= 0; i--) {
    if (!s.bases[i]) continue;
    s.bases[i] = false;
    if (i + 1 >= 3) this.scoreRun(1); else s.bases[i + 1] = true;
    return true;
  }
  return false;
};

// A pickoff is an OUT, not a disappearance. This previously just deleted the
// runner and left the out count alone, which read as a bug to anyone
// watching the diamond.
Game.prototype.pickoff = function () {
  var s = this.state;
  // holding the runner is also what catches him stealing
  s.pickoffArmed = true;
  // ONE throw over per turn. Without this, stacking three pickoff cards
  // retired the side in a single turn.
  if (s.pickedOffThisTurn) return false;
  for (var i = 2; i >= 1; i--) {
    if (!s.bases[i]) continue;
    s.bases[i] = false;
    s.pickedOffThisTurn = true;
    this.recordOut();
    return true;
  }
  return false;
};

Game.prototype.takeStrike = function () { this.addStrike(); };
Game.prototype.addStrike = function () {
  var s = this.state;
  if (this.halfOver) return;
  s.strikes++;
  if (s.strikes >= 3) { this.stats.strikeouts++; this.recordOut(); }
};

Game.prototype.takeBall = function () { this.addBall(); };
Game.prototype.giveBall = function () { this.addBall(); };
Game.prototype.addBall = function () {
  var s = this.state;
  s.balls++;
  if (s.balls >= 4) {
    if (s.bases[0]) {
      if (s.bases[1]) { if (s.bases[2]) this.scoreRun(1); s.bases[2] = true; }
      s.bases[1] = true;
    }
    s.bases[0] = true;
    s.balls = 0; s.strikes = 0;
    this.stats.walks++;
  }
};

Game.prototype.recordOut = function () {
  var s = this.state;
  s.outs++; s.strikes = 0; s.balls = 0;
  // a new batter steps in and he has to find his read again
  s.settleAnchor = s.turn;
  s.settled = 0;
  if (this.onOffense() && this.run) {
    this.run.stamina = Math.max(0, this.run.stamina - STAMINA.perOut);
    this.stats.staminaSpent += STAMINA.perOut;
  }
  var need = this.mod("extraFrame") ? 4 : OUTS_PER_HALF;
  if (s.outs >= need) this.halfOver = true;
};

Game.prototype.gainStamina = function (n) {
  if (!this.run) return;
  this.run.stamina = Math.min(STAMINA.start, this.run.stamina + n);
  this.stats.staminaGained += n;
};

// ---------- deck ----------
Game.prototype.draw = function (n) {
  var s = this.state;
  for (var i = 0; i < n; i++) {
    if (s.draw.length === 0) {
      if (s.discard.length === 0) return;
      s.draw = shuffle(s.discard.slice(), this.rng);
      s.discard = [];
    }
    s.hand.push(s.draw.pop());
  }
};

Game.prototype.playCard = function (index) {
  var s = this.state;
  if (this.halfOver || s.over) return false;
  var id = s.hand[index], card = CARDS[id];
  if (!card || card.unplayable || card.cost > s.energy) return false;

  s.hand.splice(index, 1);
  s.energy -= card.cost;
  (this.onOffense() ? card.o : card.d)(this);

  this.stats.cardsPlayed++;
  if (this.onOffense()) this.stats.offenseCards++; else this.stats.defenseCards++;
  if (card.exhaust) s.exhausted.push(id); else s.discard.push(id);
  return true;
};

// ---------- turn ----------
Game.prototype.startTurn = function () {
  var s = this.state;
  s.energy = s.maxEnergy;
  s.contactMod = 0; s.powerMod = 0; s.stuffMod = 0; s.gloveMod = 0;
  s.tagUpActive = false; s.dpArmed = false; s.forceFoul = false;
  s.capSingle = false;
  s.stoleThisTurn = false; s.pickoffArmed = false; s.pickedOffThisTurn = false;

  this.draw(tierFor(this.run ? this.run.stamina : STAMINA.start).hand);

  // He settles in the longer the half runs. The anchor is what a card can
  // move: reset it and his rhythm restarts; pull it back and you settle
  // in early yourself.
  s.settled = Math.max(0, Math.floor((s.turn - s.settleAnchor) / SETTLE_EVERY));
  s.intent = this.chooseIntent();
};

Game.prototype.endTurn = function () {
  var s = this.state;
  // You only bank stamina by taking the pitch OUTRIGHT - playing nothing at
  // all. Paying out per leftover energy looked reasonable but drips on almost
  // every turn, and across a game it out-earns every drain in the system:
  // stamina sat pinned at 100 and the tiers never engaged.
  if (s.energy === s.maxEnergy) {
    this.gainStamina(STAMINA.takePitch);
    this.stats.takenPitches++;
    s.tookPitch = true;
  } else s.tookPitch = false;

  this.resolveAtBat();

  s.discard = s.discard.concat(s.hand);
  s.hand = [];
  s.turn++;
};

Game.prototype.chooseIntent = function () {
  var s = this.state;
  var table = this.onOffense() ? PITCHES : SWINGS;
  var runners = s.bases.filter(Boolean).length;
  var key, i;

  for (key in table) {
    var it = table[key];
    if (!it.reactive) continue;
    if (it.reactive === "risp" && (s.bases[1] || s.bases[2]) && this.rng() < 0.35) return it;
    if (it.reactive === "two_on" && runners >= 2 && this.rng() < 0.45) return it;
    if (it.reactive === "runner" && runners >= 1 && this.rng() < 0.30) return it;
    if (it.reactive === "third" && s.bases[2] && s.outs < 2 && this.rng() < 0.35) return it;
  }

  var options = [];
  for (key in table) {
    var p = table[key];
    if (p.weight <= 0) continue;
    if (p.minTurn && s.turn < p.minTurn) continue;
    options.push(p);
  }
  var total = 0;
  for (i = 0; i < options.length; i++) total += options[i].weight;
  var roll = this.rng() * total;
  for (i = 0; i < options.length; i++) { roll -= options[i].weight; if (roll <= 0) return options[i]; }
  return options[0];
};

// The whole game, in one function.
Game.prototype.resolveAtBat = function () {
  var s = this.state, it = s.intent;
  if (!it || this.halfOver) return;

  if (this.onOffense()) {
    // A pickoff used to be an unavoidable out - telegraphed, and nothing you
    // could do about it. Now sending the runner beats the throw: play any
    // Steal this turn and he's gone before the ball gets there.
    if (it.reactive === "risp") {
      if (s.stoleThisTurn) return;      // already moving, safe
      this.pickoff();
      return;
    }
    if (it.junk) s.draw.push("junk");

    // taking the pitch: out of the zone is a ball, in the zone is a strike
    if (s.tookPitch && s.contactMod === 0 && s.powerMod === 0 && !s.forceFoul) {
      if (it.outOfZone) this.takeBall(); else this.addStrike();
      return;
    }
    if (it.outOfZone) { this.takeBall(); return; }
    if (s.forceFoul) { if (s.strikes < 2) this.addStrike(); return; }

    var stuff = it.stuff + s.settled + (this.mod("tightZone") ? 1 : 0);
    this.resolveSwing(BASE_CONTACT + s.contactMod - stuff, s.powerMod, it.forcesDP);

  } else {
    if (it.takes)  { this.giveBall(); return; }
    // the mirror: hold the runner and you catch him stealing
    if (it.steals) {
      if (s.pickoffArmed) { this.recordOut(); return; }
      this.steal();
      return;
    }
    if (it.sacFly) {
      if (s.bases[2]) { s.bases[2] = false; this.scoreRun(1); }
      this.recordOut();
      return;
    }
    // you are the pitcher here, so settling helps YOU
    this.resolveSwing(it.contact - (BASE_STUFF + s.stuffMod + s.settled),
                      Math.max(0, it.power - s.gloveMod), false, it.advancesAll);
  }
};

// margin < 0 miss | 0 foul | 1 ball in play | 2+ hit
Game.prototype.resolveSwing = function (margin, power, forcesDP, advancesAll) {
  var s = this.state;

  if (margin <= 0) { this.addStrike(); return; }

  if (margin === 1) {
    this.stats.ballsInPlay++;
    s.strikes = 0; s.balls = 0;

    var canDP = s.bases[0] && s.outs < OUTS_PER_HALF - 1;
    var dp = forcesDP || s.dpArmed || this.rng() < DOUBLE_PLAY_CHANCE;
    if (canDP && dp) {
      this.stats.doublePlays++;
      s.bases[0] = false;
      this.recordOut(); this.recordOut();
      return;
    }

    this.recordOut();
    if (this.halfOver) return;      // the third out kills the advance

    // Tag Up converts the out into a real sacrifice: the runner on third
    // scores and everyone else moves up.
    if (s.tagUpActive && this.onOffense() && s.bases[2]) {
      s.bases[2] = false;
      this.scoreRun(1);
    }
    this.advance(1);
    return;
  }

  this.stats.hits++;
  s.strikes = 0; s.balls = 0;
  // runners already aboard move up FIRST. Doing this after the batter is
  // placed advanced the batter too, turning every bunt into a double.
  if (advancesAll) this.advance(1);
  var n = s.capSingle ? 1 : Math.min(4, 1 + power);
  if (this.mod("pitchersDuel")) n = Math.max(1, n - 1);
  this.advance(n);
  if (n >= 4) this.scoreRun(1); else s.bases[n - 1] = true;
};

Game.prototype.startHalf = function (team) {
  var s = this.state;
  s.batting = team;
  s.outs = 0; s.strikes = 0; s.balls = 0;
  s.bases = [false, false, false];
  s.turn = 1;
  s.settleAnchor = 1;
  s.draw = shuffle(this.run.deck.slice(), this.rng);
  s.discard = []; s.hand = []; s.exhausted = [];
  this.halfOver = false;
};

// The browser loads this with a plain <script> tag; the sim requires it.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    CARDS: CARDS, CHARACTERS: CHARACTERS, PITCHES: PITCHES, SWINGS: SWINGS,
    STAMINA: STAMINA, STAMINA_TIERS: STAMINA_TIERS, OUTS_PER_HALF: OUTS_PER_HALF,
    DOUBLE_PLAY_CHANCE: DOUBLE_PLAY_CHANCE, ENERGY_PER_TURN: ENERGY_PER_TURN,
    BASE_CONTACT: BASE_CONTACT, BASE_STUFF: BASE_STUFF, SETTLE_EVERY: SETTLE_EVERY,
    REWARD_CARDS: REWARD_CARDS, REWARD_POOLS: REWARD_POOLS,
    Game: Game, tierFor: tierFor, shuffle: shuffle
  };
}


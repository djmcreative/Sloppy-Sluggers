// Core rules for one game (one "inning") against the pitcher.
//
// How it works:
//   3 strikes = 1 out
//   3 outs    = you lose
//   4 balls   = walk, free runner on 1st
//   Protect blocks incoming strikes and resets every turn.
//   Score enough runs before you run out of outs and you win.

var Game = {

  state: null,

  // ---------- setup ----------

  start: function (characterId) {
    // playing an inning at all takes something out of you
    Run.spend(STAMINA.perInning);

    var tier = Run.tier();

    this.state = {
      character: characterId,

      drawPile: shuffle(Run.state.deck.slice()),
      hand: [],
      discardPile: [],
      exhausted: [],

      energy: tier.energy,
      maxEnergy: tier.energy,
      handSize: tier.handSize,

      balls: 0,
      strikes: 0,
      outs: 0,

      bases: [false, false, false],   // 1st, 2nd, 3rd
      runs: 0,
      target: PITCHER.runsToWin,

      protect: 0,
      turn: 1,
      velocity: 0,        // grows as the pitcher settles in
      dialedIn: 0,        // one-off bonus from a waste pitch

      tippedPitch: 0,     // pending +1 base on your next hit
      stoleThisTurn: false,
      powers: { veteran: 0, captain: 0, trackStar: 0 },

      pitch: null,
      over: false,
      won: false
    };

    this.startTurn();
  },

  startTurn: function () {
    var s = this.state;

    // every turn in an inning wears you down
    Run.spend(STAMINA.perTurn);

    var tier = Run.tier();
    s.maxEnergy = tier.energy;
    s.handSize = tier.handSize;

    s.energy = s.maxEnergy;
    s.protect = 0;
    s.stoleThisTurn = false;

    if (s.powers.veteran > 0) {
      this.addProtect(s.powers.veteran);
    }

    // he gets stronger the longer the game goes
    if (s.turn > 1 && (s.turn - 1) % PITCHER.rampEvery === 0) {
      s.velocity++;
      UI.log(PITCHER.name + " settles in. Pitches +1.");
    }

    s.pitch = choosePitch(s);

    // tells the UI this is a fresh hand, so the cards deal in rather than
    // just appearing. Cleared by renderHand once it's used.
    if (typeof UI !== "undefined") UI.dealNext = true;

    this.draw(s.handSize);
  },

  // ---------- deck ----------

  draw: function (count) {
    var s = this.state;

    for (var i = 0; i < count; i++) {
      if (s.drawPile.length === 0) {
        if (s.discardPile.length === 0) break;   // nothing left anywhere
        s.drawPile = shuffle(s.discardPile);
        s.discardPile = [];
      }
      s.hand.push(s.drawPile.pop());
    }
  },

  playCard: function (handIndex) {
    var s = this.state;
    if (s.over) return;

    var cardId = s.hand[handIndex];
    var card = CARDS[cardId];

    if (card.unplayable) {
      UI.log("You can't play that.");
      return;
    }
    if (s.energy < card.cost) {
      UI.log("Not enough energy.");
      return;
    }

    s.energy -= card.cost;
    s.hand.splice(handIndex, 1);
    card.play();

    if (card.exhaust) {
      s.exhausted.push(cardId);
    } else {
      s.discardPile.push(cardId);
    }

    if (s.runs >= s.target) {
      this.endGame(true);
    }

    UI.render();
  },

  // ---------- hitting and baserunning ----------

  hit: function (basesAdvanced) {
    var s = this.state;

    // Captain: hits carry further with someone in scoring position
    if (s.powers.captain > 0 && this.inScoringPosition() && basesAdvanced < 4) {
      basesAdvanced++;
      UI.log("The captain delivers.");
    }

    // Tipped Pitch: you knew what was coming, so it travels further
    while (s.tippedPitch > 0 && basesAdvanced < 4) {
      basesAdvanced++;
      s.tippedPitch--;
      UI.log("You knew it was coming.");
    }

    var wasSingle = (basesAdvanced === 1);

    this.advanceRunners(basesAdvanced);

    if (basesAdvanced >= 4) {
      this.scoreRun();
    } else {
      s.bases[basesAdvanced - 1] = true;
    }

    var names = { 1: "Single", 2: "Double", 3: "Triple", 4: "Homer" };
    UI.log(names[basesAdvanced] + "!");

    // Track Star: every single turns into a steal too
    if (wasSingle && s.powers.trackStar > 0) {
      this.steal();
    }
  },

  advanceRunners: function (basesAdvanced) {
    var s = this.state;

    // go backwards so runners don't run into each other
    for (var base = 2; base >= 0; base--) {
      if (!s.bases[base]) continue;

      s.bases[base] = false;
      var destination = base + basesAdvanced;

      if (destination >= 3) {
        this.scoreRun();
      } else {
        s.bases[destination] = true;
      }
    }
  },

  steal: function () {
    var s = this.state;

    // take the furthest runner who has somewhere to go
    if (s.bases[1] && !s.bases[2]) {
      s.bases[1] = false;
      s.bases[2] = true;
    } else if (s.bases[0] && !s.bases[1]) {
      s.bases[0] = false;
      s.bases[1] = true;
    } else {
      UI.log("Nobody to send.");
      return;
    }

    s.stoleThisTurn = true;
    UI.log("Stolen base!");
  },

  scoreRun: function () {
    this.state.runs++;
    UI.log("A run scores!");
  },

  runnersOn: function () {
    var s = this.state;
    var count = 0;

    for (var i = 0; i < 3; i++) {
      if (s.bases[i]) count++;
    }
    return count;
  },

  // the runner closest to home
  leadRunner: function () {
    var s = this.state;

    for (var base = 2; base >= 0; base--) {
      if (s.bases[base]) return base;
    }
    return -1;
  },

  advanceLeadRunner: function (amount) {
    var lead = this.leadRunner();
    if (lead < 0) {
      UI.log("Nobody on.");
      return;
    }

    var s = this.state;
    s.bases[lead] = false;
    var destination = lead + amount;

    if (destination >= 3) {
      this.scoreRun();
    } else {
      s.bases[destination] = true;
      UI.log("Runner takes another base.");
    }
  },

  removeLeadRunner: function () {
    var lead = this.leadRunner();
    if (lead >= 0) {
      this.state.bases[lead] = false;
    }
  },

  inScoringPosition: function () {
    var s = this.state;
    return s.bases[1] || s.bases[2];
  },

  // ---------- the count ----------

  addProtect: function (amount) {
    if (amount > 0) {
      this.state.protect += amount;
    }
  },

  addBall: function () {
    var s = this.state;
    s.balls++;

    if (s.balls >= 4) {
      this.walk();
    }
  },

  walk: function () {
    var s = this.state;
    UI.log("Ball four. Take your base.");

    // runners only move if they're forced
    if (s.bases[0]) {
      if (s.bases[1]) {
        if (s.bases[2]) {
          this.scoreRun();
        }
        s.bases[2] = true;
      }
      s.bases[1] = true;
    }
    s.bases[0] = true;

    s.balls = 0;
    s.strikes = 0;
  },

  addStrikes: function (amount) {
    var s = this.state;

    for (var i = 0; i < amount; i++) {
      if (s.over) return;

      s.strikes++;
      if (s.strikes >= 3) {
        this.recordOut();
      }
    }
  },

  recordOut: function () {
    var s = this.state;

    s.outs++;
    s.strikes = 0;
    s.balls = 0;
    Run.spend(STAMINA.perOut);
    UI.log("That's an out.");

    if (s.outs >= 3) {
      this.endGame(false);
    }
  },

  // ---------- ending the turn ----------

  endTurn: function () {
    var s = this.state;
    if (s.over) return;

    // anything still in hand gets pitched
    for (var i = 0; i < s.hand.length; i++) {
      s.discardPile.push(s.hand[i]);
    }
    s.hand = [];

    this.resolvePitch();

    if (!s.over) {
      s.turn++;
      this.startTurn();
    }

    UI.render();
  },

  resolvePitch: function () {
    var s = this.state;
    var pitch = s.pitch;

    UI.log("-- " + pitch.name + " --");

    // strikes come in first
    if (pitch.strikes > 0) {
      var incoming = pitch.strikes + s.velocity + s.dialedIn;
      s.dialedIn = 0;

      var blocked = pitch.ignoresProtect ? 0 : Math.min(s.protect, incoming);
      var through = incoming - blocked;

      if (pitch.ignoresProtect && s.protect > 0) {
        UI.log("Painted. Protect can't touch it.");
      }
      if (blocked > 0) {
        UI.log("Protected " + blocked + ".");
      }
      if (through > 0) {
        UI.log(through > 1 ? "Strike x" + through + "!" : "Strike!");
        this.addStrikes(through);
      }
    }

    if (s.over) return;

    // then whatever else the pitch does
    if (pitch.addsJunk) {
      var spot = Math.floor(Math.random() * (s.drawPile.length + 1));
      s.drawPile.splice(spot, 0, "junk");
      Run.addCardToDeck("junk");   // it stays in the deck for the whole run
      UI.log("Junk in your draw pile.");
    }

    if (pitch.dialsIn) {
      this.addBall();
      s.dialedIn = 1;
      UI.log("He's dialed in.");
    }

    if (pitch.picksOff) {
      this.pickOffRunner();
    }

    if (pitch.doublePlay) {
      this.tryDoublePlay();
    }
  },

  pickOffRunner: function () {
    var s = this.state;

    if (s.bases[2] && !s.bases[1]) {
      s.bases[2] = false;
      s.bases[1] = true;
      UI.log("Picked back to 2nd.");
    } else if (s.bases[1] && !s.bases[0]) {
      s.bases[1] = false;
      s.bases[0] = true;
      UI.log("Picked back to 1st.");
    } else {
      UI.log("Throw over. Safe.");
    }
  },

  tryDoublePlay: function () {
    var s = this.state;

    var runners = [];
    for (var i = 0; i < 3; i++) {
      if (s.bases[i]) runners.push(i);
    }

    if (runners.length < 2) {
      UI.log("No double play there.");
      return;
    }

    // erase the two furthest along
    var lead = runners[runners.length - 1];
    var next = runners[runners.length - 2];
    s.bases[lead] = false;
    s.bases[next] = false;
    UI.log("Turned two! Two runners erased.");
  },

  // how many strikes the coming pitch will actually throw
  incomingStrikes: function () {
    var s = this.state;
    if (!s.pitch || s.pitch.strikes === 0) return 0;
    return s.pitch.strikes + s.velocity + s.dialedIn;
  },

  endGame: function (won) {
    this.state.over = true;
    this.state.won = won;

    Run.finishInning(won);
    UI.showInningResult(won);
  }

};


// Fisher-Yates shuffle
function shuffle(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

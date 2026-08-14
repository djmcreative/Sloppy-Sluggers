// Card definitions.
// Each card has a cost, rules text, and a play() that changes the game state.
//   exhaust    - the card leaves the game for the rest of the inning
//   unplayable - junk you can't do anything with
//   power      - a lasting effect for the rest of the inning
//
// Every character has their own basic cards, their own starting deck,
// and their own pool of cards they can be offered between innings.

var CARDS = {

  // ============================================================
  // DEAN KEAN - power. extra bases, and strikes he brings on himself.
  // ============================================================

  rip_it: {
    name: "Rip It",
    cost: 1,
    text: '<span class="good">Single.</span>',
    play: function () {
      Game.hit(1);
    }
  },

  shake_it_off: {
    name: "Shake It Off",
    cost: 0,
    text: 'Gain <span class="good">1 Protect</span>.',
    play: function () {
      Game.addProtect(1);
    }
  },

  sween: {
    name: "Sween",
    cost: 1,
    text: '<span class="good">Triple.</span> <span class="bad">Strike 2.</span>',
    play: function () {
      Game.hit(3);
      Game.addStrikes(2);
    }
  },

  uppercut: {
    name: "Uppercut",
    cost: 2,
    text: '<span class="good">Double.</span>',
    play: function () {
      Game.hit(2);
    }
  },

  tipped_pitch: {
    name: "Tipped Pitch",
    cost: 1,
    text: 'Your next hit goes <span class="good">1 extra base</span>.',
    play: function () {
      Game.state.tippedPitch++;
    }
  },

  umps_phone: {
    name: "Umps on His Phone",
    cost: 1,
    text: 'Gain <span class="good">1 Protect</span> for each Strike in the count.',
    play: function () {
      Game.addProtect(Game.state.strikes);
    }
  },

  deaner: {
    name: "DEANER",
    cost: 3,
    exhaust: true,
    text: '<span class="good">Homer.</span> <span class="bad">Strike 1.</span><br>Exhaust.',
    play: function () {
      Game.hit(4);
      Game.addStrikes(1);
    }
  },

  golf_swing: {
    name: "Golf Swing",
    cost: 1,
    text: '<span class="good">Double.</span> <span class="bad">Strike 1.</span>',
    play: function () {
      Game.hit(2);
      Game.addStrikes(1);
    }
  },

  elbow_guard: {
    name: "Elbow Guard",
    cost: 1,
    text: 'Gain <span class="good">2 Protect</span>.<br>With 2 Strikes, gain <span class="good">4</span> instead.',
    play: function () {
      Game.addProtect(Game.state.strikes >= 2 ? 4 : 2);
    }
  },

  batting_practice: {
    name: "Batting Practice",
    cost: 0,
    text: 'Your next hit goes <span class="good">1 extra base</span>. <span class="good">Draw 1.</span>',
    play: function () {
      Game.state.tippedPitch++;
      Game.draw(1);
    }
  },

  cage_work: {
    name: "Cage Work",
    cost: 2,
    text: '<span class="good">Double. Draw 1.</span>',
    play: function () {
      Game.hit(2);
      Game.draw(1);
    }
  },

  all_or_nothing: {
    name: "All or Nothing",
    cost: 1,
    text: '<span class="good">Triple.</span> <span class="bad">1 Strike for each runner on base.</span>',
    play: function () {
      var runners = Game.runnersOn();
      Game.hit(3);
      Game.addStrikes(runners);
    }
  },

  second_deck: {
    name: "Second Deck",
    cost: 2,
    text: 'With 2 Strikes: <span class="good">Homer.</span><br>Otherwise: <span class="good">Double.</span>',
    play: function () {
      Game.hit(Game.state.strikes >= 2 ? 4 : 2);
    }
  },

  mash: {
    name: "Mash",
    cost: 3,
    text: '<span class="good">Homer.</span>',
    play: function () {
      Game.hit(4);
    }
  },

  grip_it: {
    name: "Grip It",
    cost: 1,
    exhaust: true,
    text: 'Your next hit goes <span class="good">2 extra bases</span>.<br>Exhaust.',
    play: function () {
      Game.state.tippedPitch += 2;
    }
  },

  // ============================================================
  // SPEEDSTER - runners, steals, and cashing them in.
  // ============================================================

  leg_it_out: {
    name: "Leg It Out",
    cost: 1,
    text: '<span class="good">Single.</span>',
    play: function () {
      Game.hit(1);
    }
  },

  duck: {
    name: "Duck",
    cost: 0,
    text: 'Gain <span class="good">1 Protect</span>.',
    play: function () {
      Game.addProtect(1);
    }
  },

  slide: {
    name: "Slide",
    cost: 0,
    text: '<span class="good">Steal</span> a base.',
    play: function () {
      Game.steal();
    }
  },

  dribbler: {
    name: "Dribbler",
    cost: 1,
    text: '<span class="good">Single.</span> Runners already on base advance <span class="good">2</span> instead.',
    play: function () {
      Game.advanceRunners(2);
      Game.state.bases[0] = true;
      UI.log("Dribbler. Everybody moves up.");
    }
  },

  good_eye: {
    name: "Good Eye",
    cost: 1,
    text: 'Gain <span class="good">1 Ball</span> and <span class="good">1 Protect</span>.',
    play: function () {
      Game.addBall();
      Game.addProtect(1);
    }
  },

  hustle: {
    name: "Hustle",
    cost: 1,
    text: 'Gain <span class="good">1 Protect</span>. If you stole this turn, gain <span class="good">2</span> instead.',
    play: function () {
      Game.addProtect(Game.state.stoleThisTurn ? 2 : 1);
    }
  },

  pickle: {
    name: "Pickle",
    cost: 2,
    text: 'Runner on 3rd: <span class="good">he scores.</span><br><span class="bad">Otherwise: Strike 1.</span>',
    play: function () {
      if (Game.state.bases[2]) {
        Game.state.bases[2] = false;
        Game.scoreRun();
      } else {
        UI.log("Caught in a pickle.");
        Game.addStrikes(1);
      }
    }
  },

  wheels: {
    name: "Wheels",
    cost: 2,
    text: '<span class="good">All runners advance 2 bases.</span>',
    play: function () {
      Game.advanceRunners(2);
      UI.log("They're all running!");
    }
  },

  jump_early: {
    name: "Jump Early",
    cost: 0,
    text: '<span class="good">Steal</span> a base. <span class="good">Draw 1.</span>',
    play: function () {
      Game.steal();
      Game.draw(1);
    }
  },

  delayed_steal: {
    name: "Delayed Steal",
    cost: 1,
    text: '<span class="good">Steal twice.</span>',
    play: function () {
      Game.steal();
      Game.steal();
    }
  },

  hit_and_run: {
    name: "Hit and Run",
    cost: 2,
    text: '<span class="good">Steal</span>, then <span class="good">Single</span>.',
    play: function () {
      Game.steal();
      Game.hit(1);
    }
  },

  fake_bunt: {
    name: "Fake Bunt",
    cost: 1,
    text: 'Gain <span class="good">2 Protect</span> and <span class="good">Steal</span>.',
    play: function () {
      Game.addProtect(2);
      Game.steal();
    }
  },

  slap_single: {
    name: "Slap Single",
    cost: 1,
    text: '<span class="good">Single. Draw 1.</span>',
    play: function () {
      Game.hit(1);
      Game.draw(1);
    }
  },

  take_third: {
    name: "Take Third",
    cost: 1,
    text: 'Your <span class="good">lead runner advances 1 base</span>. <span class="good">Draw 1.</span>',
    play: function () {
      Game.advanceLeadRunner(1);
      Game.draw(1);
    }
  },

  manufacture: {
    name: "Manufacture",
    cost: 2,
    text: 'With 2 or more runners on: <span class="good">score a run</span>.',
    play: function () {
      if (Game.runnersOn() >= 2) {
        Game.removeLeadRunner();
        Game.scoreRun();
      } else {
        UI.log("Nothing to manufacture.");
      }
    }
  },

  track_star: {
    name: "Track Star",
    cost: 2,
    power: true,
    exhaust: true,
    text: 'For the rest of this inning, your <span class="good">Singles also Steal</span>.<br>Exhaust.',
    play: function () {
      Game.state.powers.trackStar++;
      UI.log("Track Star. Nobody's holding him now.");
    }
  },

  // ============================================================
  // ALL-PURPOSE - flexible cards that grow as the game goes.
  // ============================================================

  punch_it: {
    name: "Punch It",
    cost: 1,
    text: '<span class="good">Single.</span>',
    play: function () {
      Game.hit(1);
    }
  },

  work_the_count: {
    name: "Work the Count",
    cost: 0,
    text: 'Gain <span class="good">1 Protect</span>.',
    play: function () {
      Game.addProtect(1);
    }
  },

  clutch: {
    name: "Clutch",
    cost: 1,
    text: '<span class="good">Single.</span><br>Runner in scoring position: <span class="good">Double</span> instead.',
    play: function () {
      Game.hit(Game.inScoringPosition() ? 2 : 1);
    }
  },

  opposite_field: {
    name: "Opposite Field",
    cost: 1,
    text: '<span class="good">Single.</span> Gain <span class="good">1 Protect</span>.',
    play: function () {
      Game.hit(1);
      Game.addProtect(1);
    }
  },

  move_him_over: {
    name: "Move Him Over",
    cost: 1,
    text: '<span class="good">All runners advance 1 base.</span>',
    play: function () {
      Game.advanceRunners(1);
      UI.log("Moved 'em over.");
    }
  },

  take_the_pitch: {
    name: "Take the Pitch",
    cost: 2,
    text: 'Gain <span class="good">1 Protect</span> and <span class="good">1 Ball</span>. <span class="good">Draw 1.</span>',
    play: function () {
      Game.addProtect(1);
      Game.addBall();
      Game.draw(1);
    }
  },

  sac_fly: {
    name: "Sac Fly",
    cost: 1,
    text: 'Runner on 3rd: <span class="good">he scores</span>, <span class="bad">you take 1 Strike</span>.<br>Otherwise gain <span class="good">1 Protect</span>.',
    play: function () {
      if (Game.state.bases[2]) {
        Game.state.bases[2] = false;
        Game.scoreRun();
        Game.addStrikes(1);
      } else {
        Game.addProtect(1);
      }
    }
  },

  grinder: {
    name: "Grinder",
    cost: 1,
    text: 'Gain <span class="good">1 Protect</span> and <span class="good">1 Ball</span>. <span class="good">Draw 1.</span>',
    play: function () {
      Game.addProtect(1);
      Game.addBall();
      Game.draw(1);
    }
  },

  veteran_presence: {
    name: "Veteran Presence",
    cost: 1,
    power: true,
    exhaust: true,
    text: 'For the rest of this inning, gain <span class="good">1 Protect</span> at the start of each turn.<br>Exhaust.',
    play: function () {
      Game.state.powers.veteran++;
      UI.log("Veteran presence.");
    }
  },

  study_film: {
    name: "Study Film",
    cost: 0,
    exhaust: true,
    text: '<span class="good">Draw 2.</span><br>Exhaust.',
    play: function () {
      Game.draw(2);
    }
  },

  two_way_player: {
    name: "Two-Way Player",
    cost: 2,
    text: '<span class="good">Single.</span> Gain <span class="good">2 Protect</span>.',
    play: function () {
      Game.hit(1);
      Game.addProtect(2);
    }
  },

  second_wind: {
    name: "Second Wind",
    cost: 1,
    exhaust: true,
    text: 'Gain <span class="good">10 stamina</span>.<br>Exhaust.',
    play: function () {
      Run.recover(10);
      UI.log("Second wind. +10 stamina.");
    }
  },

  rally: {
    name: "Rally",
    cost: 2,
    text: '<span class="good">All runners advance 1 base. Draw 1.</span>',
    play: function () {
      Game.advanceRunners(1);
      Game.draw(1);
    }
  },

  captain: {
    name: "Captain",
    cost: 2,
    power: true,
    exhaust: true,
    text: 'For the rest of this inning, your hits go <span class="good">1 extra base</span> with a runner in scoring position.<br>Exhaust.',
    play: function () {
      Game.state.powers.captain++;
      UI.log("The captain takes over.");
    }
  },

  pinch_hitter: {
    name: "Pinch Hitter",
    cost: 0,
    exhaust: true,
    text: '<span class="good">Draw 2. Gain 1 Energy.</span><br>Exhaust.',
    play: function () {
      Game.draw(2);
      Game.state.energy++;
    }
  },

  // ============================================================
  // junk the pitcher gives you
  // ============================================================

  junk: {
    name: "Junk",
    cost: 0,
    unplayable: true,
    text: '<span class="bad">Unplayable.</span><br>You chased one in the dirt.',
    play: function () {
      // does nothing
    }
  }

};


// The three characters: starting decks, and what they can be offered
// as a reward after an inning.

var CHARACTERS = {

  dean_kean: {
    name: "Dean Kean",
    sprite: "char_deankean.png",
    portrait: "portrait_deankean.png",
    blurb: "High risk, high reward. Extra base hits but lots of strikes.",
    deck: [
      "rip_it", "rip_it", "rip_it", "rip_it", "rip_it",
      "shake_it_off", "shake_it_off", "shake_it_off",
      "sween", "sween",
      "uppercut", "tipped_pitch", "umps_phone", "golf_swing", "deaner"
    ],
    rewards: [
      "golf_swing", "elbow_guard", "batting_practice", "cage_work",
      "all_or_nothing", "second_deck", "mash", "grip_it", "sween", "uppercut"
    ]
  },

  speedster: {
    name: "Speedster",
    sprite: "char_speedster.png",
    portrait: "portrait_speedster.png",
    blurb: "Bunts, steals, sacrifices.",
    deck: [
      "leg_it_out", "leg_it_out", "leg_it_out", "leg_it_out", "leg_it_out",
      "duck", "duck", "duck",
      "slide", "slide",
      "dribbler", "good_eye", "hustle", "pickle", "wheels"
    ],
    rewards: [
      "jump_early", "delayed_steal", "hit_and_run", "fake_bunt", "slap_single",
      "take_third", "manufacture", "track_star", "wheels", "pickle"
    ]
  },

  all_purpose: {
    name: "All-Purpose",
    sprite: "char_allpurpose.png",
    portrait: "portrait_allpurpose.png",
    blurb: "Flexible cards that get stronger as the game goes on.",
    deck: [
      "punch_it", "punch_it", "punch_it", "punch_it", "punch_it",
      "work_the_count", "work_the_count", "work_the_count",
      "clutch", "clutch",
      "opposite_field", "move_him_over", "take_the_pitch", "sac_fly", "grinder"
    ],
    rewards: [
      "veteran_presence", "study_film", "two_way_player", "second_wind",
      "rally", "captain", "pinch_hitter", "clutch", "take_the_pitch", "sac_fly"
    ]
  }

};

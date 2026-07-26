// Card definitions.
// Each card has a cost, rules text, and a play() that changes the game state.
// "exhaust" means the card leaves the game after you play it.
// "unplayable" cards are junk you can't do anything with.

var CARDS = {

  // ----- cards everyone starts with -----

  sloppy_single: {
    name: "Sloppy Single",
    cost: 1,
    text: '<span class="good">Single.</span>',
    play: function () {
      Game.hit(1);
    }
  },

  foul: {
    name: "Foul",
    cost: 1,
    text: 'Gain <span class="good">1 Foul</span>.',
    play: function () {
      Game.addFoul(1);
    }
  },

  // ----- Dean Kean -----

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

  weight_room: {
    name: "Weight Room",
    cost: 1,
    text: 'Your next <span class="good">Single</span> becomes a <span class="good">Double</span>.',
    play: function () {
      Game.state.weightRoom++;
    }
  },

  umps_phone: {
    name: "Umps on His Phone",
    cost: 1,
    text: 'Gain <span class="good">1 Foul</span> for each Strike in the count.',
    play: function () {
      Game.addFoul(Game.state.strikes);
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

  // ----- Speedster -----

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
    text: 'Gain <span class="good">1 Ball</span> and <span class="good">1 Foul</span>.',
    play: function () {
      Game.addBall();
      Game.addFoul(1);
    }
  },

  hustle: {
    name: "Hustle",
    cost: 1,
    text: 'Gain <span class="good">1 Foul</span>. If you stole this turn, gain <span class="good">2</span> instead.',
    play: function () {
      Game.addFoul(Game.state.stoleThisTurn ? 2 : 1);
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

  // ----- All-Purpose -----

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
    text: '<span class="good">Single.</span> Gain <span class="good">1 Foul</span>.',
    play: function () {
      Game.hit(1);
      Game.addFoul(1);
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
    text: 'Gain <span class="good">1 Foul</span> and <span class="good">1 Ball</span>. <span class="good">Draw 1 card.</span>',
    play: function () {
      Game.addFoul(1);
      Game.addBall();
      Game.draw(1);
    }
  },

  sac_fly: {
    name: "Sac Fly",
    cost: 1,
    text: 'Runner on 3rd: <span class="good">he scores</span>, <span class="bad">you take 1 Strike</span>.<br>Otherwise gain <span class="good">1 Foul</span>.',
    play: function () {
      if (Game.state.bases[2]) {
        Game.state.bases[2] = false;
        Game.scoreRun();
        Game.addStrikes(1);
      } else {
        Game.addFoul(1);
      }
    }
  },

  // ----- junk the pitcher gives you -----

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


// The three characters and the decks they start with.

var CHARACTERS = {

  dean_kean: {
    name: "Dean Kean",
    blurb: "High risk, high reward. Extra base hits but lots of strikes.",
    deck: [
      "sloppy_single", "sloppy_single", "sloppy_single", "sloppy_single", "sloppy_single",
      "foul", "foul", "foul", "foul",
      "sween", "sween",
      "uppercut", "weight_room", "umps_phone", "deaner"
    ]
  },

  speedster: {
    name: "Speedster",
    blurb: "Bunts, steals, sacrifices.",
    deck: [
      "sloppy_single", "sloppy_single", "sloppy_single", "sloppy_single", "sloppy_single",
      "foul", "foul", "foul", "foul",
      "slide", "slide",
      "dribbler", "good_eye", "hustle", "pickle"
    ]
  },

  all_purpose: {
    name: "All-Purpose",
    blurb: "Flexible cards that get stronger as the game goes on.",
    deck: [
      "sloppy_single", "sloppy_single", "sloppy_single", "sloppy_single", "sloppy_single",
      "foul", "foul", "foul", "foul",
      "clutch", "clutch",
      "opposite_field", "move_him_over", "take_the_pitch", "sac_fly"
    ]
  }

};

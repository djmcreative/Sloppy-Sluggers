// The run: everything that carries from one inning to the next.
//
// Stamina is fuel, not health. Running out doesn't end the run - it just
// means you play the late innings with less energy and a smaller hand.

var STAMINA_TIERS = [
  { min: 70, energy: 3, handSize: 5, label: "Fresh" },
  { min: 40, energy: 3, handSize: 4, label: "Working" },
  { min: 15, energy: 2, handSize: 4, label: "Tired" },
  { min: 0,  energy: 2, handSize: 3, label: "Gassed" }
];

var STAMINA = {
  start: 100,
  perTurn: 2,       // every turn you spend in an inning
  perOut: 8,        // every out he gets on you
  offDayRest: 30    // what an off day gives back
};

var TOTAL_INNINGS = 9;
var OFF_DAY_AFTER = [3, 6];   // you get a breather after these innings

var Run = {

  state: null,

  start: function (characterId) {
    this.state = {
      character: characterId,
      deck: CHARACTERS[characterId].deck.slice(),
      stamina: STAMINA.start,
      inning: 1,
      over: false,
      won: false
    };
  },

  // ---------- stamina ----------

  spend: function (amount) {
    var r = this.state;
    r.stamina = Math.max(0, r.stamina - amount);
  },

  rest: function () {
    var r = this.state;
    r.stamina = Math.min(STAMINA.start, r.stamina + STAMINA.offDayRest);
  },

  tier: function () {
    var stamina = this.state.stamina;

    for (var i = 0; i < STAMINA_TIERS.length; i++) {
      if (stamina >= STAMINA_TIERS[i].min) {
        return STAMINA_TIERS[i];
      }
    }
    return STAMINA_TIERS[STAMINA_TIERS.length - 1];
  },

  // ---------- deck ----------

  // junk the pitcher gives you sticks around for the rest of the run
  addCardToDeck: function (cardId) {
    this.state.deck.push(cardId);
  },

  // ---------- innings ----------

  isOffDay: function () {
    return OFF_DAY_AFTER.indexOf(this.state.inning) !== -1;
  },

  isLastInning: function () {
    return this.state.inning >= TOTAL_INNINGS;
  },

  finishInning: function (won) {
    var r = this.state;

    if (!won) {
      r.over = true;
      r.won = false;
      return;
    }

    if (this.isLastInning()) {
      r.over = true;
      r.won = true;
      return;
    }

    if (this.isOffDay()) {
      this.rest();
    }
    r.inning++;
  }

};

// The run: a series of games, the deck that carries between them, and the
// stamina that carries across the whole act.
//
// ACT = best of 3. Win two games and the act is yours; lose two and the run
// is over. Losing a single game is survivable, which is the whole point of
// the series structure.

var GAMES_TO_WIN = 2;
var GAMES_TO_LOSE = 2;
var INNINGS_PER_GAME = 3;

var Run = {

  state: null,

  start: function (characterId) {
    this.state = {
      character: characterId,
      deck: CHARACTERS[characterId].deck.slice(),
      stamina: STAMINA.start,
      act: 1,
      wins: 0,
      losses: 0,
      gameNumber: 1,
      over: false,
      won: false
    };
  },

  tier: function () { return tierFor(this.state.stamina); },

  spend: function (n) {
    this.state.stamina = Math.max(0, this.state.stamina - n);
  },

  recover: function (n) {
    this.state.stamina = Math.min(STAMINA.start, this.state.stamina + n);
  },

  // called once a game has finished
  recordGame: function (won) {
    var r = this.state;
    if (won) r.wins++; else r.losses++;
    r.gameNumber++;

    if (r.wins >= GAMES_TO_WIN) { r.over = true; r.won = true; }
    else if (r.losses >= GAMES_TO_LOSE) { r.over = true; r.won = false; }
  },

  seriesOver: function () { return this.state.over; },

  // three from the pool, and you may take none of them
  rollRewards: function () {
    var pool = REWARD_POOLS[this.state.character].slice();
    var picks = [];
    while (picks.length < 3 && pool.length) {
      picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return picks;
  },

  addCard: function (id) { this.state.deck.push(id); }
};

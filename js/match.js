// Match flow: halves, innings, and the end of a game.
//
// The engine in rules.js knows how to resolve one at-bat. This file decides
// whose half it is and when the game is finished, and it is the only thing
// that tells the UI to redraw.

var Match = {

  game: null,
  inning: 1,
  half: "top",        // top = you bat, bottom = you field
  finished: false,

  startGame: function () {
    this.game = new Game({
      innings: INNINGS_PER_GAME,
      run: Run.state
    });
    this.inning = 1;
    this.half = "top";
    this.finished = false;

    this.startHalf();
  },

  startHalf: function () {
    var g = this.game;
    g.state.inning = this.inning;
    g.startHalf(this.half === "top" ? "player" : "ai");
    g.startTurn();
    UI.log(this.half === "top"
      ? "Top " + ordinal(this.inning) + ". You're up."
      : "Bottom " + ordinal(this.inning) + ". Take the field.");
    UI.render();
  },

  endTurn: function () {
    var g = this.game;
    if (this.finished) return;

    var before = {
      score: g.state.score[g.state.batting],
      outs: g.state.outs,
      hits: g.stats.hits,
      k: g.stats.strikeouts,
      bip: g.stats.ballsInPlay,
      dp: g.stats.doublePlays,
      walks: g.stats.walks
    };

    g.endTurn();
    this.describe(before);

    if (g.halfOver) { this.nextHalf(); return; }

    g.startTurn();
    UI.render();
  },

  // turn the state delta into something a person can read
  describe: function (before) {
    var g = this.game, s = g.state;
    var mine = g.onOffense();

    if (g.stats.strikeouts > before.k) {
      UI.log(mine ? "Struck out." : "Strikeout!");
    } else if (g.stats.doublePlays > before.dp) {
      UI.log(mine ? "Grounded into a double play." : "Turned two!");
    } else if (g.stats.hits > before.hits) {
      UI.log(mine ? "Base hit." : "He gets a hit.");
    } else if (g.stats.ballsInPlay > before.bip) {
      UI.log(mine ? "In play — out." : "In play — you got him.");
    } else if (g.stats.walks > before.walks) {
      UI.log(mine ? "Ball four. Take your base." : "Walked him.");
    } else if (s.outs > before.outs) {
      UI.log("That's an out.");
    }

    var scored = s.score[s.batting] - before.score;
    if (scored > 0) {
      UI.log(mine ? scored + " run" + (scored > 1 ? "s" : "") + " in!"
                  : "He scores " + scored + ".");
    }
  },

  nextHalf: function () {
    if (this.half === "top") {
      this.half = "bottom";
      this.startHalf();
      return;
    }

    // inning complete
    this.half = "top";
    this.inning++;

    var s = this.game.state;
    if (this.inning > this.game.innings) {
      if (s.score.player !== s.score.ai) { this.endGame(); return; }
      Run.spend(STAMINA.perExtraInning);
      this.game.innings++;         // extra innings
      UI.log("Tied after " + (this.inning - 1) + ". Free baseball.");
    }
    this.startHalf();
  },

  endGame: function () {
    this.finished = true;
    // charged at the END of a game. Charging it up front meant a brand new
    // run opened at 82 stamina, which just looks like a bug.
    Run.spend(STAMINA.perGame);
    var s = this.game.state;
    var won = s.score.player > s.score.ai;
    Run.recordGame(won);
    UI.showGameResult(won, s.score.player, s.score.ai);
  }
};

function ordinal(n) {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return n + "th";
}

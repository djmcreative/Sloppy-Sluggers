// Everything that puts the game state on the screen.

var UI = {

  messages: [],

  // ---------- character select ----------

  showCharacterSelect: function () {
    var list = document.getElementById("character-list");
    list.innerHTML = "";

    for (var id in CHARACTERS) {
      list.appendChild(this.buildCharacterCard(id));
    }

    document.getElementById("select").classList.remove("hidden");
  },

  buildCharacterCard: function (id) {
    var character = CHARACTERS[id];

    var element = document.createElement("div");
    element.className = "character";
    element.innerHTML =
      '<div class="portrait">ART</div>' +
      "<h2>" + character.name + "</h2>" +
      "<p>" + character.blurb + "</p>";

    element.addEventListener("click", function () {
      startGame(id);
    });

    return element;
  },

  hideCharacterSelect: function () {
    document.getElementById("select").classList.add("hidden");
  },

  // ---------- main render ----------

  render: function () {
    var s = Game.state;
    if (!s) return;

    document.getElementById("who").textContent = CHARACTERS[s.character].name.toUpperCase();
    document.getElementById("batter-name").textContent = CHARACTERS[s.character].name.toUpperCase();
    document.getElementById("pitcher-name").textContent = PITCHER.name.toUpperCase();

    document.getElementById("runs").textContent = s.runs;
    document.getElementById("target").textContent = s.target;
    document.getElementById("turn").textContent = s.turn;

    this.renderIntent();
    this.renderCount();
    this.renderBases();
    this.renderStatus();

    document.getElementById("energy-now").textContent = s.energy;
    document.getElementById("energy-max").textContent = s.maxEnergy;
    document.getElementById("draw-count").textContent = s.drawPile.length;
    document.getElementById("discard-count").textContent = s.discardPile.length;

    this.renderHand();
  },

  renderIntent: function () {
    var s = Game.state;

    document.getElementById("intent-name").textContent = s.pitch ? s.pitch.name : "--";
    document.getElementById("intent").title = s.pitch ? s.pitch.description : "";

    var incoming = Game.incomingStrikes();
    var label = "";
    if (incoming > 0) {
      label = "x" + incoming;
    } else if (s.pitch && s.pitch.doublePlay) {
      label = "DP";
    }
    document.getElementById("intent-strikes").textContent = label;
  },

  renderCount: function () {
    var s = Game.state;
    document.getElementById("balls").innerHTML = this.pips(s.balls, 3, "ball");
    document.getElementById("strikes").innerHTML = this.pips(s.strikes, 2, "strike");
    document.getElementById("outs").innerHTML = this.pips(s.outs, 2, "out");
  },

  // draws filled and empty dots, e.g. 2 balls out of 3 slots
  pips: function (filled, total, className) {
    var html = "";
    for (var i = 0; i < total; i++) {
      html += '<span class="pip' + (i < filled ? " " + className : "") + '"></span>';
    }
    return html;
  },

  renderBases: function () {
    var s = Game.state;

    for (var i = 0; i < 3; i++) {
      var base = document.getElementById("base-" + (i + 1));
      if (s.bases[i]) {
        base.classList.add("occupied");
      } else {
        base.classList.remove("occupied");
      }
    }
  },

  renderStatus: function () {
    var s = Game.state;

    var batter = "";
    if (s.foul > 0) {
      batter += '<span class="chip">Foul ' + s.foul + "</span>";
    }
    if (s.weightRoom > 0) {
      batter += '<span class="chip">Weight Room ' + s.weightRoom + "</span>";
    }
    if (s.stoleThisTurn) {
      batter += '<span class="chip">Stole</span>';
    }
    document.getElementById("batter-status").innerHTML = batter;

    var pitcher = "";
    if (s.velocity > 0) {
      pitcher += '<span class="chip">Settled In +' + s.velocity + "</span>";
    }
    if (s.dialedIn > 0) {
      pitcher += '<span class="chip">Dialed In +' + s.dialedIn + "</span>";
    }
    document.getElementById("pitcher-status").innerHTML = pitcher;
  },

  renderHand: function () {
    var s = Game.state;
    var hand = document.getElementById("hand");
    hand.innerHTML = "";

    for (var i = 0; i < s.hand.length; i++) {
      hand.appendChild(this.buildCard(s.hand[i], i));
    }
  },

  buildCard: function (cardId, handIndex) {
    var card = CARDS[cardId];
    var playable = !card.unplayable && Game.state.energy >= card.cost;

    var element = document.createElement("div");
    element.className = "card" + (playable ? "" : " unplayable");
    element.innerHTML =
      '<div class="card-cost">' + card.cost + "</div>" +
      '<div class="card-name">' + card.name + "</div>" +
      '<div class="card-text">' + card.text + "</div>";

    if (playable) {
      element.addEventListener("click", function () {
        Game.playCard(handIndex);
      });
    }

    return element;
  },

  // ---------- log ----------

  // keeps the last few messages on screen so you can follow what happened
  log: function (message) {
    this.messages.push(message);
    if (this.messages.length > 8) {
      this.messages.shift();
    }
    document.getElementById("log").innerHTML = this.messages.join("<br>");
  },

  clearLog: function () {
    this.messages = [];
    document.getElementById("log").innerHTML = "";
  },

  // ---------- result ----------

  showResult: function (won) {
    var s = Game.state;

    document.getElementById("result-title").textContent = won ? "INNING WON" : "SIDE RETIRED";
    document.getElementById("result-text").textContent = won
      ? "You put up " + s.runs + " runs in " + s.turn + " turns."
      : "Three outs. You scored " + s.runs + " of the " + s.target + " you needed.";

    document.getElementById("result").classList.remove("hidden");
    document.getElementById("end-turn").disabled = true;
  },

  hideResult: function () {
    document.getElementById("result").classList.add("hidden");
    document.getElementById("end-turn").disabled = false;
  }

};

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
      startRun(id);
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

    document.getElementById("inning").textContent = Run.state.inning;
    document.getElementById("total-innings").textContent = TOTAL_INNINGS;
    this.renderStamina();

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

  renderStamina: function () {
    var stamina = Run.state.stamina;
    var tier = Run.tier();

    document.getElementById("stamina-number").textContent = stamina;
    document.getElementById("stamina-label").textContent = tier.label.toUpperCase();
    document.getElementById("stamina-fill").style.width = (stamina / STAMINA.start * 100) + "%";

    var block = document.getElementById("stamina-block");
    block.className = "stat tier-" + tier.label.toLowerCase();
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

  // called at the end of every inning - either move on or end the run
  showInningResult: function (won) {
    document.getElementById("end-turn").disabled = true;

    if (Run.state.over) {
      this.showRunResult();
      return;
    }

    var s = Game.state;
    var spent = STAMINA.perTurn * s.turn + STAMINA.perOut * s.outs;

    document.getElementById("between-title").textContent = "INNING " + (Run.state.inning - 1) + " WON";
    document.getElementById("between-text").textContent =
      s.runs + " runs in " + s.turn + " turns. That inning cost you about " + spent + " stamina.";

    var note = "";
    if (Run.isOffDay() === false && OFF_DAY_AFTER.indexOf(Run.state.inning - 1) !== -1) {
      note = "<p class='rest-note'>Off day. You get " + STAMINA.offDayRest + " stamina back.</p>";
    }
    document.getElementById("between-stamina").innerHTML =
      note + "<p>Stamina: <b>" + Run.state.stamina + "</b> (" + Run.tier().label + ")</p>";

    document.getElementById("between").classList.remove("hidden");
  },

  showRunResult: function () {
    var r = Run.state;

    document.getElementById("result-title").textContent = r.won ? "ACT CLEARED" : "SIDE RETIRED";
    document.getElementById("result-text").textContent = r.won
      ? "You got through all " + TOTAL_INNINGS + " innings with " + r.stamina + " stamina left."
      : "Three outs in inning " + r.inning + ". The run is over.";

    document.getElementById("result").classList.remove("hidden");
  },

  hideOverlays: function () {
    document.getElementById("result").classList.add("hidden");
    document.getElementById("between").classList.add("hidden");
    document.getElementById("end-turn").disabled = false;
  }

};

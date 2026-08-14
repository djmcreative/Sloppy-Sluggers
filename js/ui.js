// Everything that puts the game state on the screen.

// All art lives in one folder. The ?v= has to match the one in index.html
// or the browser will happily serve you last week's sprites.
var ART = "assets/";
var ART_V = "?v=13";

// 16x16 icons that ride inside the status chips
var STATUS_ICONS = {
  protect:      "status_protect.png",
  tired:     "status_tired.png",
  dialedIn:  "status_dialedin.png",
  settledIn: "status_settledin.png",
  steal:     "status_steal.png"
};

function icon(file, className) {
  if (!file) return "";
  return '<img class="sprite' + (className ? " " + className : "") +
         '" src="' + ART + file + ART_V + '" alt="">';
}

var UI = {

  messages: [],
  dealNext: false,

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
      '<div class="portrait"><img src="' + ART + character.portrait + ART_V + '" alt=""></div>' +
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

    var me = CHARACTERS[s.character];

    document.getElementById("who").textContent = me.name.toUpperCase();
    document.getElementById("batter-name").textContent = me.name.toUpperCase();
    document.getElementById("pitcher-name").textContent = PITCHER.name.toUpperCase();

    document.getElementById("batter-sprite").src = ART + me.sprite + ART_V;
    document.getElementById("pitcher-sprite").src = ART + PITCHER.sprite + ART_V;

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

    // the icon only shows up once you're actually worn down
    var label = document.getElementById("stamina-label");
    label.innerHTML = (tier.label === "Tired" ? icon(STATUS_ICONS.tired) : "") +
                      "<span>" + tier.label.toUpperCase() + "</span>";
    document.getElementById("stamina-fill").style.width = (stamina / STAMINA.start * 100) + "%";

    var block = document.getElementById("stamina-block");
    block.className = "info-row tier-" + tier.label.toLowerCase();
  },

  renderIntent: function () {
    var s = Game.state;

    document.getElementById("intent-name").textContent = s.pitch ? s.pitch.name : "--";
    document.getElementById("intent").title = s.pitch ? s.pitch.description : "";

    var intentIcon = document.getElementById("intent-icon");
    if (s.pitch && s.pitch.icon) {
      intentIcon.src = ART + s.pitch.icon + ART_V;
      intentIcon.style.visibility = "visible";
    } else {
      intentIcon.style.visibility = "hidden";
    }

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
    if (s.protect > 0) {
      batter += '<span class="chip">' + icon(STATUS_ICONS.protect) + "Protect " + s.protect + "</span>";
    }
    if (s.tippedPitch > 0) {
      batter += '<span class="chip">Tipped Pitch ' + s.tippedPitch + "</span>";
    }
    if (s.stoleThisTurn) {
      batter += '<span class="chip">' + icon(STATUS_ICONS.steal) + "Stole</span>";
    }
    if (s.powers.veteran > 0) {
      batter += '<span class="chip">Veteran Presence</span>';
    }
    if (s.powers.captain > 0) {
      batter += '<span class="chip">Captain</span>';
    }
    if (s.powers.trackStar > 0) {
      batter += '<span class="chip">Track Star</span>';
    }
    document.getElementById("batter-status").innerHTML = batter;

    var pitcher = "";
    if (s.velocity > 0) {
      pitcher += '<span class="chip">' + icon(STATUS_ICONS.settledIn) + "Settled In +" + s.velocity + "</span>";
    }
    if (s.dialedIn > 0) {
      pitcher += '<span class="chip">' + icon(STATUS_ICONS.dialedIn) + "Dialed In +" + s.dialedIn + "</span>";
    }
    document.getElementById("pitcher-status").innerHTML = pitcher;
  },

  renderHand: function () {
    var s = Game.state;
    var hand = document.getElementById("hand");
    hand.innerHTML = "";

    // --mid is the centre slot; the css leans each card away from it
    var mid = (s.hand.length - 1) / 2;

    for (var i = 0; i < s.hand.length; i++) {
      var card = this.buildCard(s.hand[i], i);
      card.style.setProperty("--i", i);
      card.style.setProperty("--mid", mid);
      // only animate the deal on a fresh hand, not after every card played
      if (this.dealNext) card.classList.add("dealt");
      hand.appendChild(card);
    }
    this.dealNext = false;
  },

  buildCard: function (cardId, handIndex) {
    var card = CARDS[cardId];
    var playable = !card.unplayable && Game.state.energy >= card.cost;

    var element = document.createElement("div");
    element.className = "card" + (playable ? "" : " unplayable");
    element.innerHTML =
      '<div class="card-cost">' + card.cost + "</div>" +
      '<div class="card-name">' + card.name + "</div>" +
      '<div class="card-text"><span class="card-body">' + card.text + "</span></div>";

    if (playable) {
      element.tabIndex = 0;
      element.addEventListener("pointerdown", function (event) {
        UI.startDrag(event, element, handIndex);
      });
      // keyboard players can't drag, so give them a way in
      element.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          UI.playFromHand(handIndex);
        }
      });
    }

    return element;
  },

  // ---------- dragging a card onto the field ----------
  //
  // Cards are played by dragging them up onto the grass. The drop target is
  // the stage above the hand - anywhere lower is treated as a miss and the
  // card snaps back. Pointer events rather than HTML5 drag-and-drop, because
  // the native one can't be styled and fights the fan transforms.

  drag: null,

  startDrag: function (event, element, handIndex) {
    if (this.drag) return;
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();

    var box = element.getBoundingClientRect();

    // a stand-in keeps the fan from collapsing while the card is out of it
    var ghost = element.cloneNode(true);
    ghost.classList.add("ghost");
    element.parentNode.insertBefore(ghost, element);

    this.drag = {
      element: element,
      ghost: ghost,
      handIndex: handIndex,
      grabX: event.clientX - box.left,
      grabY: event.clientY - box.top
    };

    element.classList.add("dragging");
    element.style.width = box.width + "px";
    element.style.height = box.height + "px";
    this.moveDrag(event);

    document.addEventListener("pointermove", UI.onDragMove);
    document.addEventListener("pointerup", UI.onDragEnd);
    document.addEventListener("pointercancel", UI.onDragEnd);
  },

  moveDrag: function (event) {
    var d = this.drag;
    if (!d) return;

    d.element.style.left = (event.clientX - d.grabX) + "px";
    d.element.style.top = (event.clientY - d.grabY) + "px";

    var stage = document.getElementById("stage");
    if (this.overField(event)) {
      stage.classList.add("armed");
    } else {
      stage.classList.remove("armed");
    }
  },

  // the field is the stage above the hand - the hand's own strip doesn't count
  overField: function (event) {
    var stage = document.getElementById("stage").getBoundingClientRect();
    var hand = document.getElementById("handbar").getBoundingClientRect();

    return event.clientX >= stage.left && event.clientX <= stage.right &&
           event.clientY >= stage.top && event.clientY < hand.top;
  },

  endDrag: function (event) {
    var d = this.drag;
    if (!d) return;

    document.removeEventListener("pointermove", UI.onDragMove);
    document.removeEventListener("pointerup", UI.onDragEnd);
    document.removeEventListener("pointercancel", UI.onDragEnd);
    document.getElementById("stage").classList.remove("armed");

    var dropped = this.overField(event);
    var index = d.handIndex;

    if (d.ghost && d.ghost.parentNode) d.ghost.parentNode.removeChild(d.ghost);
    d.element.classList.remove("dragging");
    d.element.style.left = "";
    d.element.style.top = "";
    d.element.style.width = "";
    d.element.style.height = "";
    this.drag = null;

    if (dropped) {
      this.playFromHand(index);
    } else {
      this.render();   // snaps it back into the fan
    }
  },

  playFromHand: function (handIndex) {
    this.flashContact();
    Game.playCard(handIndex);
  },

  flashContact: function () {
    var flash = document.getElementById("contact");
    if (!flash) return;
    flash.classList.remove("pop");
    void flash.offsetWidth;    // restart the animation
    flash.classList.add("pop");
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

    this.renderRewards();
    document.getElementById("between").classList.remove("hidden");
  },

  // three cards to pick from, or skip
  renderRewards: function () {
    var wrap = document.getElementById("reward-cards");
    wrap.innerHTML = "";

    var picks = Run.rollRewards();
    for (var i = 0; i < picks.length; i++) {
      wrap.appendChild(this.buildRewardCard(picks[i]));
    }
  },

  buildRewardCard: function (cardId) {
    var card = CARDS[cardId];

    var element = document.createElement("div");
    element.className = "card reward";
    element.innerHTML =
      '<div class="card-cost">' + card.cost + "</div>" +
      '<div class="card-name">' + card.name + "</div>" +
      '<div class="card-text"><span class="card-body">' + card.text + "</span></div>";

    element.addEventListener("click", function () {
      Run.addCardToDeck(cardId);
      UI.log("Added " + card.name + " to your deck.");
      nextInning();
    });

    return element;
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

// stable references, or removeEventListener will not match the handler
UI.onDragMove = function (event) { UI.moveDrag(event); };
UI.onDragEnd  = function (event) { UI.endDrag(event); };

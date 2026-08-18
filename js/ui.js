// Everything that puts state on the screen.
//
// The single most important element here is the at-bat readout: your Contact
// against his Stuff, and what that margin will produce if you end the turn
// now. The whole design depends on the player being able to see that they
// are one Contact short of a hit. Hide it and the game is unreadable - which
// was the first thing a playtester said about the previous version.

var ART = "assets/";
var ART_V = "?v=7";

var STATUS_ICONS = {
  tired:     "status_tired.png",
  settledin: "status_settledin.png",
  dialedin:  "status_dialedin.png",
  steal:     "status_steal.png",
  protect:   "status_protect.png"
};

var INTENT_ICONS = {
  "Fastball": "intent_fastball.png",
  "High Heat": "intent_highheat.png",
  "Painted Corner": "intent_paintedcorner.png",
  "Curveball": "intent_curveball.png",
  "Waste Pitch": "intent_wastepitch.png",
  "Pickoff": "intent_pickoff.png",
  "Turn Two": "intent_turntwo.png",
  // the batter's swings reuse the closest existing icon
  "Contact Swing": "intent_fastball.png",
  "Gap Shot": "intent_highheat.png",
  "Big Cut": "intent_highheat.png",
  "Bunt": "intent_wastepitch.png",
  "Work the Count": "intent_wastepitch.png",
  "Steal Attempt": "intent_pickoff.png",
  "Sac Fly": "intent_turntwo.png"
};

function icon(file, cls) {
  if (!file) return "";
  return '<img class="sprite' + (cls ? " " + cls : "") + '" src="' +
         ART + file + ART_V + '" alt="">';
}

var UI = {

  messages: [],
  dealNext: false,
  drag: null,

  // ---------- character select ----------

  showCharacterSelect: function () {
    var list = document.getElementById("character-list");
    list.innerHTML = "";
    for (var id in CHARACTERS) {
      list.appendChild(this.buildCharacterCard(id, CHARACTERS[id]));
    }
    document.getElementById("select").classList.remove("hidden");
  },

  buildCharacterCard: function (id, character) {
    var el = document.createElement("div");
    el.className = "character";
    el.innerHTML =
      '<div class="portrait"><img src="' + ART + character.portrait + ART_V + '" alt=""></div>' +
      "<h2>" + character.name + "</h2>" +
      "<p>" + character.blurb + "</p>";
    el.addEventListener("click", function () { startRun(id); });
    return el;
  },

  // ---------- the at-bat readout ----------
  //
  // Reads differently depending on which side of the ball you're on, but the
  // arithmetic is identical: one number against another.

  // The readout counts ONLY what your cards contribute, starting at 0, and
  // states the pitch as a requirement instead of a raw Stuff number. The
  // engine still carries a baseline (see BASE_CONTACT / BASE_STUFF); folding
  // it into the target is what makes the screen readable - a player should
  // never have to wonder where a free +3 came from.
  renderAtBat: function () {
    var g = Match.game, s = g.state, it = s.intent;
    var box = document.getElementById("atbat");
    if (!it) { box.innerHTML = ""; return; }

    var mine = g.onOffense();
    var have, label, rungs, margin;

    if (mine) {
      have = s.contactMod;
      label = "CONTACT";
      // cards needed to land on each rung of the ladder
      var floorC = it.stuff + s.settled - BASE_CONTACT;
      margin = BASE_CONTACT + have - (it.stuff + s.settled);
      // the HIT rung names the actual result at your current Power, so you
      // can watch a power card turn SINGLE into DOUBLE without guessing
      var payoff = ["", "SINGLE", "DOUBLE", "TRIPLE", "HOME RUN"][Math.min(4, 1 + s.powerMod)];
      rungs = [
        { key: "MISS", need: null, show: floorC + 1 > 0, hit: margin <= 0 },
        { key: "OUT",  need: floorC + 1, hit: margin === 1 },
        { key: payoff, need: floorC + 2, hit: margin >= 2 }
      ];
    } else {
      have = s.stuffMod;
      label = "STUFF";
      // more Stuff is better here, so the ladder runs the other way
      var floorS = it.contact - BASE_STUFF - s.settled;
      margin = it.contact - (BASE_STUFF + have + s.settled);
      // what he'd get right now, after your Glove
      var damage = ["", "SINGLE", "DOUBLE", "TRIPLE", "HOME RUN"][
        Math.min(4, 1 + Math.max(0, (it.power || 0) - s.gloveMod))];
      rungs = [
        { key: "HE HITS", need: null, sub: damage, show: floorS - 1 > 0, hit: margin >= 2 },
        { key: "OUT",    need: floorS - 1, hit: margin === 1 },
        { key: "STRIKE", need: floorS,     hit: margin <= 0 }
      ];
    }

    var power = mine ? s.powerMod : Math.max(0, it.power - s.gloveMod);
    var outcome = this.outcomeOf(margin, power, mine);

    if (mine && it.outOfZone) outcome = { text: "BALL — TAKE IT", cls: "good" };
    if (!mine && it.takes)    outcome = { text: "HE TAKES A BALL", cls: "warn" };
    if (mine && it.reactive === "risp") outcome = { text: "PICKOFF ATTEMPT", cls: "warn" };
    if (!mine && it.steals)   outcome = { text: "HE'S STEALING", cls: "bad" };
    if (!mine && it.sacFly)   outcome = { text: "SAC FLY", cls: "bad" };

    var ladder = "";
    var quiet = (mine && (it.outOfZone || it.reactive === "risp")) ||
                (!mine && (it.takes || it.steals || it.sacFly));
    if (!quiet) {
      rungs.forEach(function (r) {
        // a rung you can't reach from zero isn't worth showing
        if (r.need !== null && r.need < 0) return;
        if (r.show === false) return;
        var cls = "rung" + (r.hit ? " on" : "");
        var n = r.sub !== undefined ? '<i>' + r.sub + "</i>"
              : r.need === null ? "" : '<i>' + r.need + "</i>";
        ladder += '<span class="' + cls + '">' + r.key + n + "</span>";
      });
    }

    var settledNote = s.settled > 0
      ? ' <span class="settled">' + (mine ? "he's settled in +" : "you're settled in +") + s.settled + "</span>"
      : "";

    box.innerHTML =
      '<div class="ab-row">' +
        '<div class="ab-side"><b>' + have + "</b><small>YOUR " + label + "</small>" +
          "<i>from cards</i></div>" +
        '<div class="ab-ladder">' + ladder + "</div>" +
        '<div class="ab-outcome ' + outcome.cls + '">' + outcome.text + "</div>" +
      "</div>" +
      '<div class="ab-note">' + this.noteFor(margin, power, mine) + settledNote + "</div>";
  },

  // Contact decides WHETHER you reach base. Power decides HOW FAR. A huge
  // Contact margin with no Power is still a single - the readout has to say
  // so, because the two numbers are easy to conflate.
  outcomeOf: function (margin, power, mine) {
    // the foul rung is gone - anything short of a ball in play is a strike
    if (margin <= 0)  return mine ? { text: "SWING AND MISS", cls: "bad" }
                                  : { text: "STRIKE", cls: "good" };
    if (margin === 1) return mine ? { text: "IN PLAY — OUT", cls: "warn" }
                                  : { text: "IN PLAY — OUT", cls: "good" };

    var bases = Math.min(4, 1 + power);
    var name = ["", "SINGLE", "DOUBLE", "TRIPLE", "HOME RUN"][bases];
    return mine ? { text: name, cls: "good" }
                : { text: "HE GETS A " + name, cls: "bad" };
  },

  // The second line explains what Power and Glove are actually doing, and
  // what will change the ball-in-play result.
  noteFor: function (margin, power, mine) {
    var s = Match.game.state;
    var bits = [];

    if (mine) {
      // Power only pays out if you actually reach the hit rung. Saying so is
      // the difference between a wasted card and a deliberate one.
      bits.push('<span class="stat-chip">POWER ' + s.powerMod + "</span>" +
        (margin >= 2
          ? (s.powerMod > 0 ? " your hit goes " + Math.min(4, 1 + s.powerMod) + " bases"
                            : " your hit is a single")
          : '<span class="warn"> does nothing unless you reach a hit</span>'));
    } else {
      var raw = (Match.game.state.intent.power) || 0;
      var net = Math.max(0, raw - s.gloveMod);
      bits.push('<span class="stat-chip">GLOVE ' + s.gloveMod + "</span>" +
        (margin >= 2
          ? (s.gloveMod > 0
              ? " holding him to " + (net === 0 ? "a single" : (1 + net) + " bases")
              : (raw === 0 ? " he'd get a single" : " he'd take " + (1 + raw) + " bases"))
          : '<span class="warn"> only matters if he connects</span>'));
    }

    // everything that changes a ball in play, spelled out
    if (margin === 1) {
      if (s.bases[0] && s.outs < OUTS_PER_HALF - 1) {
        bits.push(mine ? '<span class="warn">double play risk</span>'
                       : '<span class="good">double play chance</span>');
      }
      if (mine && s.tagUpActive && s.bases[2]) {
        bits.push('<span class="good">TAG UP — the run scores</span>');
      }
      if (!mine && s.dpArmed && s.bases[0]) {
        bits.push('<span class="good">DOUBLE PLAY armed</span>');
      }
      if (s.outs === OUTS_PER_HALF - 1) {
        bits.push("third out — nobody advances");
      }
    }
    return bits.join(" &nbsp;·&nbsp; ");
  },

  // ---------- main render ----------

  render: function () {
    var g = Match.game;
    if (!g) return;
    var s = g.state;
    var mine = g.onOffense();

    document.getElementById("stage").classList.toggle("fielding", !mine);
    document.getElementById("phase").textContent =
      (mine ? "TOP " : "BOTTOM ") + ordinal(Match.inning) +
      (mine ? " — YOU'RE BATTING" : " — YOU'RE IN THE FIELD");

    document.getElementById("score-you").textContent = s.score.player;
    document.getElementById("score-them").textContent = s.score.ai;

    // series record, e.g. two wins and a loss
    var rec = "";
    for (var i = 0; i < 2; i++) rec += '<span class="pip-w' + (Run.state.wins > i ? " on" : "") + '"></span>';
    for (var j = 0; j < 2; j++) rec += '<span class="pip-l' + (Run.state.losses > j ? " on" : "") + '"></span>';
    document.getElementById("series").innerHTML = rec;

    this.renderCount();
    this.renderBases();
    this.renderIntent();
    this.renderAtBat();
    this.renderStamina();
    this.renderHand();

    document.getElementById("energy-now").textContent = s.energy;
    document.getElementById("energy-max").textContent = s.maxEnergy;
    document.getElementById("draw-count").textContent = s.draw.length;
    document.getElementById("discard-count").textContent = s.discard.length;
    // The two slots hold roles, not people: #batter-side is whoever is at the
    // plate. So when you take the field, your character moves to the mound and
    // the opponent walks up to hit.
    var me = CHARACTERS[Run.state.character];
    document.getElementById("batter-name").textContent =
      (mine ? me.name : "The Batter").toUpperCase();
    document.getElementById("pitcher-name").textContent =
      (mine ? "The Pitcher" : me.name).toUpperCase();
    document.getElementById("batter-sprite").src =
      ART + (mine ? me.sprite : "enemy_pitcher.png") + ART_V;
    document.getElementById("pitcher-sprite").src =
      ART + (mine ? "enemy_pitcher.png" : me.sprite) + ART_V;
  },

  renderCount: function () {
    function pips(n, max, cls) {
      var out = "";
      for (var i = 0; i < max; i++) out += '<span class="pip' + (i < n ? " " + cls : "") + '"></span>';
      return out;
    }
    var s = Match.game.state;
    document.getElementById("balls").innerHTML = pips(s.balls, 3, "ball");
    document.getElementById("strikes").innerHTML = pips(s.strikes, 2, "strike");
    document.getElementById("outs").innerHTML = pips(s.outs, 2, "out");
  },

  renderBases: function () {
    var s = Match.game.state;
    for (var i = 0; i < 3; i++) {
      var el = document.getElementById("base-" + (i + 1));
      if (el) el.classList.toggle("occupied", !!s.bases[i]);
    }
  },

  renderIntent: function () {
    var g = Match.game, s = g.state, it = s.intent;
    var nameEl = document.getElementById("intent-name");
    var iconEl = document.getElementById("intent-icon");
    var numEl = document.getElementById("intent-number");

    if (!it) { nameEl.textContent = "--"; numEl.textContent = ""; return; }

    nameEl.textContent = it.name;
    var file = INTENT_ICONS[it.name];
    if (file) { iconEl.src = ART + file + ART_V; iconEl.style.visibility = "visible"; }
    else iconEl.style.visibility = "hidden";

    if (g.onOffense()) numEl.textContent = "STUFF " + (it.stuff + s.settled);
    else numEl.textContent = "CONTACT " + it.contact;

    // his settling-in is the reason long at-bats are dangerous, so say so
    var chips = "";
    if (s.settled > 0) {
      chips = '<span class="chip">' + icon(STATUS_ICONS.settledin) +
              (g.onOffense() ? "Settled In +" : "You're dialed in +") + s.settled + "</span>";
    }
    document.getElementById("pitcher-status").innerHTML = chips;
  },

  renderStamina: function () {
    var st = Run.state.stamina;
    var tier = tierFor(st);
    document.getElementById("stamina-number").textContent = st;
    document.getElementById("stamina-label").innerHTML =
      (tier.label === "Fresh" ? "" : icon(STATUS_ICONS.tired)) +
      "<span>" + tier.label.toUpperCase() + "</span>";
    document.getElementById("stamina-fill").style.width = st + "%";
    document.getElementById("stamina-block").className =
      "info-row tier-" + tier.label.toLowerCase();
  },

  // ---------- hand ----------

  renderHand: function () {
    var s = Match.game.state;
    var hand = document.getElementById("hand");
    hand.innerHTML = "";
    var mid = (s.hand.length - 1) / 2;

    for (var i = 0; i < s.hand.length; i++) {
      var card = this.buildCard(s.hand[i], i);
      card.style.setProperty("--i", i);
      card.style.setProperty("--mid", mid);
      if (this.dealNext) card.classList.add("dealt");
      hand.appendChild(card);
    }
    this.dealNext = false;
  },

  // In combat only the ACTIVE side is shown - the other side would be noise
  // when you can't use it. Both sides appear in the reward draft, where the
  // whole decision is about weighing them against each other.
  buildCard: function (cardId, handIndex) {
    var g = Match.game;
    var card = CARDS[cardId];
    var playable = !card.unplayable && card.cost <= g.state.energy;
    var mine = g.onOffense();

    var el = document.createElement("div");
    el.className = "card" + (playable ? "" : " unplayable") + (mine ? " offense" : " defense");
    el.innerHTML =
      '<div class="card-cost">' + card.cost + "</div>" +
      '<div class="card-name">' + card.name + "</div>" +
      '<div class="card-side">' + (mine ? "AT THE PLATE" : "IN THE FIELD") + "</div>" +
      '<div class="card-text"><span class="card-body">' +
        describeSide(cardId, mine ? "o" : "d") + "</span></div>";

    if (playable) {
      el.tabIndex = 0;
      el.addEventListener("pointerdown", function (e) { UI.startDrag(e, el, handIndex); });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); UI.playFromHand(handIndex); }
      });
    }
    return el;
  },

  // ---------- drag to play ----------

  startDrag: function (event, element, handIndex) {
    if (this.drag) return;
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();

    var box = element.getBoundingClientRect();
    var ghost = element.cloneNode(true);
    ghost.classList.add("ghost");
    element.parentNode.insertBefore(ghost, element);

    this.drag = { element: element, ghost: ghost, handIndex: handIndex,
                  grabX: event.clientX - box.left, grabY: event.clientY - box.top };

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
    document.getElementById("stage").classList.toggle("armed", this.overField(event));
  },

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
    d.element.style.left = ""; d.element.style.top = "";
    d.element.style.width = ""; d.element.style.height = "";
    this.drag = null;

    if (dropped) this.playFromHand(index); else this.render();
  },

  playFromHand: function (handIndex) {
    this.flashContact();
    Match.game.playCard(handIndex);
    this.render();
  },

  flashContact: function () {
    var f = document.getElementById("contact");
    if (!f) return;
    f.classList.remove("pop");
    void f.offsetWidth;
    f.classList.add("pop");
  },

  // ---------- log ----------

  log: function (message) {
    this.messages.push(message);
    if (this.messages.length > 4) this.messages.shift();
    var el = document.getElementById("log");
    if (el) el.innerHTML = this.messages.join("<br>");
  },

  // ---------- overlays ----------

  showGameResult: function (won, you, them) {
    var box = document.getElementById("between");
    var r = Run.state;

    document.getElementById("between-title").textContent = won ? "YOU WIN" : "YOU LOSE";
    document.getElementById("between-score").textContent =
      "Final: " + you + " — " + them + "   |   Series " + r.wins + "–" + r.losses;

    if (r.over) {
      this.showRunResult(r.won);
      return;
    }

    // reward draft, showing BOTH sides so the choice is informed
    var rewards = document.getElementById("reward-cards");
    rewards.innerHTML = "";
    var offered = Run.rollRewards();
    offered.forEach(function (id) {
      rewards.appendChild(UI.buildRewardCard(id));
    });

    document.getElementById("skip-reward").onclick = function () { UI.nextGame(); };
    box.classList.remove("hidden");
  },

  buildRewardCard: function (id) {
    var card = CARDS[id];
    var el = document.createElement("div");
    el.className = "card reward two-sided";
    el.innerHTML =
      '<div class="card-cost">' + card.cost + "</div>" +
      '<div class="card-name">' + card.name + "</div>" +
      '<div class="card-text"><span class="card-body">' +
        '<span class="side-label">AT THE PLATE</span>' + describeSide(id, "o") +
        '<span class="side-rule"></span>' +
        '<span class="side-label">IN THE FIELD</span>' + describeSide(id, "d") +
      "</span></div>";
    el.addEventListener("click", function () {
      Run.addCard(id);
      UI.nextGame();
    });
    return el;
  },

  nextGame: function () {
    Run.recover(STAMINA.restNode);
    document.getElementById("between").classList.add("hidden");
    UI.messages = [];
    Match.startGame();
  },

  showRunResult: function (won) {
    document.getElementById("between").classList.add("hidden");
    var box = document.getElementById("result");
    document.getElementById("result-title").textContent = won ? "SERIES WON" : "SERIES LOST";
    document.getElementById("result-text").textContent = won
      ? "You took the series " + Run.state.wins + "–" + Run.state.losses + "."
      : "They took the series " + Run.state.losses + "–" + Run.state.wins + ". Run over.";
    box.classList.remove("hidden");
  },

  hideOverlays: function () {
    document.getElementById("result").classList.add("hidden");
    document.getElementById("between").classList.add("hidden");
    document.getElementById("select").classList.add("hidden");
  }
};

UI.onDragMove = function (e) { UI.moveDrag(e); };
UI.onDragEnd = function (e) { UI.endDrag(e); };

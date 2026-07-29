// Starts the run and hooks up the buttons.

function startRun(characterId) {
  UI.clearLog();
  UI.hideOverlays();
  UI.hideCharacterSelect();

  Run.start(characterId);
  Game.start(characterId);
  UI.render();
}

function nextInning() {
  UI.clearLog();
  UI.hideOverlays();
  Game.start(Run.state.character);
  UI.render();
}

document.getElementById("end-turn").addEventListener("click", function () {
  Game.endTurn();
});

document.getElementById("next-inning").addEventListener("click", function () {
  nextInning();
});

document.getElementById("restart").addEventListener("click", function () {
  UI.hideOverlays();
  UI.showCharacterSelect();
});

UI.showCharacterSelect();

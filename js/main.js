// Starts the game and hooks up the buttons.

function startGame(characterId) {
  UI.clearLog();
  UI.hideResult();
  UI.hideCharacterSelect();
  Game.start(characterId);
  UI.render();
}

document.getElementById("end-turn").addEventListener("click", function () {
  Game.endTurn();
});

document.getElementById("restart").addEventListener("click", function () {
  UI.hideResult();
  UI.showCharacterSelect();
});

UI.showCharacterSelect();

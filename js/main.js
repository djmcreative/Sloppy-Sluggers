// Startup and button wiring.

function startRun(characterId) {
  Run.start(characterId);
  UI.messages = [];
  UI.hideOverlays();
  Match.startGame();
}

function boot() {
  UI.showCharacterSelect();

  document.getElementById("end-turn").addEventListener("click", function () {
    UI.dealNext = true;
    Match.endTurn();
  });

  document.getElementById("restart").addEventListener("click", function () {
    document.getElementById("result").classList.add("hidden");
    UI.showCharacterSelect();
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
}

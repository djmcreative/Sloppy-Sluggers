import * as Run from './engine/run.js';
import { playCard, endTurn } from './engine/battle.js';
import { loadRun, saveRun } from './engine/storage.js';
import { html, topbar, relicbar, button } from './ui/components.js';
import * as Screens from './ui/screens.js';
import { helpContent, deckContent, relicContent, logContent } from './ui/modals.js';
import { playSound } from './ui/audio.js';

const app = document.querySelector('#app'),
  modal = document.querySelector('#modal');
let saved = loadRun(),
  run = null,
  selected = 'dean',
  muted = true,
  screen = 'title',
  toastTimer;

function render(animated = false) {
  let content;
  if (screen === 'title') content = Screens.titleScreen(selected, saved);
  else if (screen === 'roster') content = Screens.rosterScreen(selected);
  else {
    const renderers = {
      map: Screens.mapScreen,
      battle: (r) => Screens.battleScreen(r, animated),
      reward: Screens.rewardScreen,
      rest: Screens.restScreen,
      training: Screens.restScreen,
      event: Screens.eventScreen,
      shop: Screens.shopScreen,
      won: Screens.endScreen,
      lost: Screens.endScreen,
    };
    content = renderers[run.phase](run);
  }
  document.body.dataset.screen = screen === 'game' ? run.phase : screen;
  const playing = screen === 'game';
  app.innerHTML =
    topbar(playing ? run : null, screen, muted) + (playing ? relicbar(run) : '') + content;
  if (playing && run.phase === 'map') {
    const map = app.querySelector('.journey-scroll');
    const current = app.querySelector('.journey-node.available');
    if (map && current) map.scrollTop = Math.max(0, current.offsetTop - map.clientHeight * 0.68);
  }
}
function persist() {
  saved = run;
  if (!saveRun(run))
    toast('Saving is unavailable in this browser. Keep this tab open to continue your run.');
}
function toast(message) {
  const element = document.querySelector('#toast');
  element.textContent = message;
  element.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('visible'), 4000);
}
function openModal(content) {
  modal.innerHTML = html`<button class="modal-close" data-action="close" aria-label="Close dialog">
      ×</button
    >${content}`;
  if (!modal.open) modal.showModal();
}
function startRun() {
  run = Run.createRun(selected);
  screen = 'game';
  modal.close();
  persist();
  render();
  window.scrollTo(0, 0);
}
function updateBattle(action) {
  const oldRuns = run.battle.runs;
  if (!action()) return;
  const completed = Run.finishBattle(run);
  playSound(
    completed && run.battle.status === 'won' ? 'win' : run.battle.runs > oldRuns ? 'hit' : 'pitch',
    muted,
  );
  document.querySelector('#announcer').textContent = run.battle.log.slice(-2).join(' ');
  persist();
  render(true);
  if (completed) window.scrollTo(0, 0);
}

document.addEventListener('click', (event) => {
  const control = event.target.closest('[data-action]');
  if (!control || control.disabled) return;
  const { action, id, uid } = control.dataset;
  switch (action) {
    case 'character':
      selected = id;
      render();
      break;
    case 'select-slugger':
      screen = 'roster';
      render();
      break;
    case 'starter-deck':
      openModal(deckContent(Run.createRun(selected, 1)));
      break;
    case 'fullscreen':
      if (!document.fullscreenElement)
        document.documentElement
          .requestFullscreen?.()
          .catch(() => toast('Fullscreen is unavailable here.'));
      else document.exitFullscreen?.();
      break;
    case 'start':
      if (saved && !['won', 'lost'].includes(saved.phase))
        openModal(
          html`<h2 id="modal-title">Start a new run?</h2>
            <p>This replaces your saved run at inning ${saved.inning}.</p>
            ${button('START NEW RUN', 'confirm-start', 'primary')}${button(
              'KEEP MY RUN',
              'close',
              'secondary',
            )}`,
        );
      else startRun();
      break;
    case 'confirm-start':
      startRun();
      break;
    case 'continue':
      run = saved;
      screen = 'game';
      render();
      break;
    case 'home':
      screen = 'title';
      modal.close();
      render();
      window.scrollTo(0, 0);
      break;
    case 'sound':
      muted = !muted;
      playSound('click', muted);
      render();
      break;
    case 'help':
      openModal(helpContent());
      break;
    case 'close':
      modal.close();
      break;
    case 'menu':
      if (screen === 'title') openModal(helpContent());
      else
        openModal(
          html`<h2 id="modal-title">Back in the dugout.</h2>
            <p>Your run saves after every play on this browser.</p>
            ${button('KEEP PLAYING', 'close', 'primary')}${button(
              'HOW TO PLAY',
              'help',
              'secondary',
            )}${button('RETURN TO CLUBHOUSE', 'home', 'secondary')}`,
        );
      break;
    case 'deck':
      if (run) openModal(deckContent(run));
      break;
    case 'pile':
      if (run?.phase === 'battle') openModal(deckContent(run, 'view', id));
      break;
    case 'relic':
      if (run) openModal(relicContent(run, id));
      break;
    case 'log':
      if (run?.battle) openModal(logContent(run));
      break;
    case 'node':
      if (Run.enterNode(run, id)) {
        persist();
        render();
        window.scrollTo(0, 0);
      }
      break;
    case 'play':
      if (run?.phase === 'battle') updateBattle(() => playCard(run.battle, uid));
      break;
    case 'end-turn':
      if (run?.phase === 'battle') updateBattle(() => endTurn(run.battle));
      break;
    case 'reward':
    case 'skip-reward':
      if (Run.chooseReward(run, action === 'reward' ? uid : 'skip')) {
        persist();
        render();
        window.scrollTo(0, 0);
      }
      break;
    case 'rest':
      if (Run.takeRest(run, 'rest')) {
        persist();
        render();
      }
      break;
    case 'upgrade':
      openModal(deckContent(run, 'upgrade'));
      break;
    case 'upgrade-card':
      if (Run.takeRest(run, 'upgrade', uid)) {
        modal.close();
        persist();
        render();
        toast('Card upgraded. Make it count.');
      }
      break;
    case 'event':
      if (Run.takeEvent(run, id)) {
        persist();
        render();
      }
      break;
    case 'buy-card':
      if (Run.buy(run, 'card', uid)) {
        persist();
        render();
        toast('Added to your playbook.');
      }
      break;
    case 'buy-relic':
      if (Run.buy(run, 'relic')) {
        persist();
        render();
        toast('Equipment is active next inning.');
      }
      break;
    case 'buy-recover':
      if (Run.buy(run, 'recover')) {
        persist();
        render();
        toast('Recovered 20 stamina.');
      }
      break;
    case 'remove':
      openModal(deckContent(run, 'remove'));
      break;
    case 'remove-card':
      if (Run.buy(run, 'remove', uid)) {
        modal.close();
        persist();
        render();
        toast('Card removed from your playbook.');
      }
      break;
    case 'leave-shop':
      if (run.phase === 'shop') {
        Run.nextInning(run);
        persist();
        render();
      }
      break;
  }
});
document.addEventListener('keydown', (event) => {
  if (event.repeat || modal.open || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName))
    return;
  if (screen !== 'game') return;
  if (event.key.toLowerCase() === 'd') {
    event.preventDefault();
    openModal(deckContent(run));
    return;
  }
  if (run.phase !== 'battle') return;
  if (event.code === 'Space' && event.target.tagName !== 'BUTTON') {
    event.preventDefault();
    updateBattle(() => endTurn(run.battle));
  }
  const index = Number(event.key) - 1;
  if (index >= 0 && index < 9 && run.battle.hand[index]) {
    event.preventDefault();
    updateBattle(() => playCard(run.battle, run.battle.hand[index].uid));
  }
});
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    const r = modal.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      modal.close();
  }
});
render();

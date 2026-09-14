export const html = String.raw;
import { art } from '../data/assets.js';
import { definition, description } from '../data/cards.js';
import { CHARACTERS } from '../data/characters.js';
import { RELICS } from '../data/encounters.js';
export const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export const img = (name, cls = '', alt = '') =>
  html`<img class="pixel ${cls}" src="${art(name)}" alt="${escape(alt)}" draggable="false" />`;
export const button = (label, action, cls = '', extra = '') =>
  html`<button class="button ${cls}" data-action="${action}" ${extra}>${label}</button>`;
export function cardMarkup(
  instance,
  {
    action = '',
    disabled = false,
    index = null,
    extra = '',
    label = '',
    side = 'offense',
    showBoth = false,
  } = {},
) {
  const c = definition(instance, side),
    reverse = side === 'offense' ? 'defense' : 'offense',
    back = definition(instance, reverse),
    tag = action ? 'button' : 'article';
  return html`<${tag} class="game-card two-sided ${c.type} ${instance.upgraded ? 'upgraded' : ''} ${disabled ? 'unavailable' : ''}" ${action ? `data-action="${action}" data-uid="${instance.uid}" ${disabled ? 'disabled' : ''}` : ''} ${action ? `aria-label="${escape(label || `${c.name}, ${c.cost} energy. ${description(instance, side)}${showBoth ? ` Reverse: ${back.name}, ${back.cost} energy. ${description(instance, reverse)}` : ''}`)}"` : ''} ${extra}>
    <div class="card-face-label">${side.toUpperCase()}${index !== null ? `<kbd>${index + 1}</kbd>` : ''}</div>
    <div class="card-heading"><span class="card-cost">${c.cost}</span><span class="card-name">${c.name}</span></div>
    <div class="card-picture">${img(c.icon)}<span class="card-type">${side === 'offense' ? 'BAT' : 'PITCH'}</span></div>
    <div class="card-copy">${description(instance, side)}${c.exhaust ? '<span class="exhaust">Exhaust this half</span>' : ''}</div>
    ${
      showBoth
        ? html`<div class="card-reverse">
            <span>${reverse.toUpperCase()} · ${back.cost} ENERGY</span><strong>${back.name}</strong>
            <p>${description(instance, reverse)}${back.exhaust ? ' Exhaust this half.' : ''}</p>
          </div>`
        : ''
    }
    <div class="card-footer"><span>${instance.upgraded ? 'BOTH FACES UPGRADED' : c.class ? 'SIGNATURE PAIR' : 'TWO-WAY PLAYBOOK'}</span></div>
  </${tag}>`;
}
export function topbar(run, screen, muted) {
  return html`<header class="topbar">
    <button class="brand" data-action="menu" aria-label="Open game menu">
      ☰<span>SLOPPY<br />SLUGGERS</span>
    </button>
    ${run
      ? html`<div class="run-stats">
          <span class="act-label">ACT ${run.act}<em>SERIES ${run.stage}/3</em></span
          ><span title="Below 30 stamina: draw 4 cards instead of 5."
            >${img('energy drink')}<strong>${run.stamina}</strong
            ><span class="stat-label">${run.stamina < 30 ? 'TIRED' : 'STAMINA'}</span></span
          ><span
            >${img('sunflower seeds')}<strong>$${run.cash}</strong
            ><span class="stat-label">CASH</span></span
          >
        </div>`
      : '<span class="edition">BOTH SIDES OF THE GAME.</span>'}
    <nav aria-label="Game controls">
      <button class="icon-button" data-action="fullscreen" aria-label="Toggle fullscreen">⛶</button
      >${run
        ? `<button class="nav-button" data-action="deck">DECK <b>${run.deck.length}</b></button>`
        : ''}<button
        class="icon-button"
        data-action="sound"
        aria-label="${muted ? 'Enable' : 'Mute'} sound"
      >
        ${muted ? '♪ ×' : '♪'}</button
      ><button class="icon-button" data-action="help" aria-label="How to play">?</button>
    </nav>
  </header>`;
}
export function relicbar(run) {
  const c = CHARACTERS[run.character];
  return html`<div class="relic-bar">
    <button
      class="relic starter-relic"
      data-action="relic"
      data-id="starter"
      title="${escape(c.rule)}"
    >
      ${img(c.icon)}<span>${c.perk}</span></button
    >${run.relics
      .map(
        (id) =>
          html`<button
            class="relic"
            data-action="relic"
            data-id="${id}"
            title="${escape(RELICS[id].text)}"
          >
            ${img(RELICS[id].icon)}<span>${RELICS[id].name}</span>
          </button>`,
      )
      .join('')}<span class="run-seed">SEED ${run.seed}</span>
  </div>`;
}
export const pips = (count, total, cls) =>
  html`<span class="pips ${cls}" aria-label="${count} of ${total}"
    >${Array.from({ length: total }, (_, i) => `<i class="${i < count ? 'on' : ''}"></i>`).join(
      '',
    )}</span
  >`;

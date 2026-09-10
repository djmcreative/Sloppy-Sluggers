export const html = String.raw;
import { art } from '../data/assets.js';
import { definition, description } from '../data/cards.js';
import { CHARACTERS } from '../data/characters.js';
import { RELICS } from '../data/encounters.js';
import { CARD_ART } from '../data/card-art.js';
export const escape = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export const img = (name, cls = '', alt = '') =>
  html`<img class="pixel ${cls}" src="${art(name)}" alt="${escape(alt)}" draggable="false" />`;
export function button(label, action, cls = '', extra = '') {
  return html`<button class="button ${cls}" data-action="${action}" ${extra}>${label}</button>`;
}
export function cardMarkup(
  instance,
  { action = '', disabled = false, index = null, extra = '', label = '' } = {},
) {
  const c = definition(instance);
  const tag = action ? 'button' : 'article';
  return html`<${tag} class="game-card ${c.type} ${instance.upgraded ? 'upgraded' : ''} ${disabled ? 'unavailable' : ''}" ${action ? `data-action="${action}" data-uid="${instance.uid}" ${disabled ? 'disabled' : ''}` : ''}
    ${action ? `aria-label="${escape(label || `${c.name}, ${c.cost} energy. ${description(instance)}${c.exhaust ? ' Exhaust.' : ''}`)}"` : ''} ${extra}>
    <div class="card-heading"><span class="card-cost">${c.unplayable ? '—' : c.cost}</span><span class="card-name">${c.name}</span></div>
    <div class="card-picture ${CARD_ART[instance.id] ? 'illustrated' : ''}">${img(CARD_ART[instance.id] || c.icon)}<span class="card-type">${c.type === 'hit' ? 'Hit' : c.type === 'skill' ? 'Skill' : c.type}</span></div>
    <div class="card-copy">${description(instance)}${c.exhaust ? '<span class="exhaust">Exhaust</span>' : ''}</div>
    <div class="card-footer"><span>${instance.upgraded ? 'UPGRADED' : c.class ? 'SIGNATURE' : 'SLOPPY SLUGGERS'}</span>${index !== null ? html`<kbd>${index + 1}</kbd>` : ''}</div>
  </${tag}>`;
}
export function topbar(run, screen, muted) {
  return html`<header class="topbar">
    <button class="brand" data-action="menu" aria-label="Open game menu">
      ☰<span>SLOPPY<br />SLUGGERS</span>
    </button>
    ${run
      ? html`<div class="run-stats">
          <span class="act-label">WAYZATA <em>01</em></span
          ><span title="Below 30 stamina: draw 4 instead of 5 cards each turn."
            >${img('energy drink')}<strong>${run.stamina}</strong
            ><span class="stat-label">${run.stamina < 30 ? 'TIRED' : 'STAMINA'}</span></span
          ><span
            >${img('sunflower seeds')}<strong>$${run.cash}</strong
            ><span class="stat-label">CASH</span></span
          >
        </div>`
      : '<span class="edition">NINE INNINGS. ONE SHOT.</span>'}
    <nav aria-label="Game controls">
      <button class="icon-button" data-action="fullscreen" aria-label="Toggle fullscreen">⛶</button
      >${run
        ? html`<button class="nav-button" data-action="deck">
            DECK <b>${run.deck.length}</b>
          </button>`
        : ''}<button
        class="icon-button"
        data-action="sound"
        aria-label="${muted ? 'Enable' : 'Mute'} sound"
        title="${muted ? 'Sound off' : 'Sound on'}"
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
    >${Array.from({ length: total }, (_, i) => html`<i class="${i < count ? 'on' : ''}"></i>`).join(
      '',
    )}</span
  >`;

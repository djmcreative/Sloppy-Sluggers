import { html, cardMarkup, button, escape, img } from './components.js';
import { CHARACTERS } from '../data/characters.js';
import { RELICS } from '../data/encounters.js';
export function helpContent() {
  return html`<h2 id="modal-title">Welcome to the ballpark.</h2>
    <p class="modal-intro">
      Score the target runs before you collect 3 outs. Win nine innings to beat the run.
    </p>
    <div class="rules-grid">
      <section>
        <h3>01 / Play your hand</h3>
        <p>
          Start with 3 energy and 5 cards. Cards can hit, move runners, or protect you. Play them in
          any order, then end your turn.
        </p>
      </section>
      <section>
        <h3>02 / Read the pitch</h3>
        <p>
          The pitcher shows his next move. Foul cancels strikes one-for-one and resets next turn.
          Fully block a strike pitch to draw an extra card next turn. Painted Corner ignores Foul.
        </p>
      </section>
      <section>
        <h3>03 / Work the count</h3>
        <p>
          3 strikes become 1 out. Strikes can overflow into the next count. 4 balls grant a walk and
          clear your strikes. Hits keep the count—these cards are tactical plays, not literal
          at-bats.
        </p>
      </section>
      <section>
        <h3>04 / Bring them home</h3>
        <p>
          Hits move all runners, then place your batter. Advance effects can score from third. A
          home run scores everyone. Runners stay on base between turns and outs.
        </p>
      </section>
      <section>
        <h3>05 / Build a better deck</h3>
        <p>
          Choose rewards, buy equipment, and upgrade cards between innings. Exhaust removes a card
          for this inning only. Curveball’s Bad Read cards also disappear after the inning.
        </p>
      </section>
      <section>
        <h3>06 / Go the distance</h3>
        <p>
          Each inning costs 8 stamina, each out 4. Below 30 stamina you draw 4 cards; energy stays
          at 3. Rest stops after innings 3 and 6 let you recover 28 stamina or upgrade. Pitchers
          gain +1 strike after turns 4 and 8, capped at +2 within an inning. Later tiers add +1
          strike from inning 4 and +2 from inning 7. Stadium curfew ends an inning after 40 turns.
        </p>
      </section>
    </div>
    <p class="fine-print">KEYS: 1–9 PLAY CARDS · SPACE END TURN · D DECK · ESC CLOSE</p>
    ${button('GOT IT. LET’S PLAY.', 'close', 'primary')}`;
}
export function deckContent(run, mode = 'view', pile = null) {
  const titles = {
    view: 'Your playbook',
    upgrade: 'Put in the extra reps',
    remove: 'Clean out the bag',
    drawPile: 'Draw pile',
    discard: 'Discard pile',
    exhausted: 'Exhausted this inning',
  };
  let cards = pile ? run.battle[pile] : run.deck;
  if (mode === 'upgrade') cards = cards.filter((c) => !c.upgraded);
  // Draw order is hidden; browsing the pile must not reveal the next card.
  if (pile === 'drawPile') cards = cards.slice().sort((a, b) => a.id.localeCompare(b.id));
  return html`<h2 id="modal-title">${titles[pile || mode]}</h2>
    <p class="modal-intro">
      ${mode === 'upgrade'
        ? 'Choose a card to upgrade permanently. Upgraded effects are shown below.'
        : mode === 'remove'
          ? 'Choose a card to permanently remove for $35.'
          : pile === 'drawPile'
            ? 'Cards remaining, in alphabetical order. Your next draw is hidden.'
            : `${cards.length} cards · ${CHARACTERS[run.character].name}`}
    </p>
    <div class="deck-grid">
      ${cards
        .map((c) =>
          cardMarkup(mode === 'upgrade' ? { ...c, upgraded: true } : c, {
            action: mode === 'upgrade' ? 'upgrade-card' : mode === 'remove' ? 'remove-card' : '',
          }),
        )
        .join('') || '<p>No cards here.</p>'}
    </div>`;
}
export function relicContent(run, id) {
  const c = CHARACTERS[run.character],
    item = id === 'starter' ? { name: c.perk, icon: c.icon, text: c.rule } : RELICS[id];
  return html`<div class="relic-detail">
    ${img(item.icon)}
    <h2 id="modal-title">${item.name}</h2>
    <p>${item.text}</p>
    <span class="eyebrow"
      >${id === 'starter' ? 'STARTING EQUIPMENT' : 'EQUIPMENT · ACTIVE EVERY INNING'}</span
    >
  </div>`;
}
export function logContent(run) {
  return html`<h2 id="modal-title">Play-by-play</h2>
    <ol class="play-log">
      ${run.battle.log.map((l) => html`<li>${escape(l)}</li>`).join('')}
    </ol>`;
}

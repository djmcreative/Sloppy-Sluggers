import { html, cardMarkup, button, escape, img } from './components.js';
import { CHARACTERS } from '../data/characters.js';
import { RELICS } from '../data/encounters.js';
export function helpContent() {
  return html`<h2 id="modal-title">Both sides of the ball.</h2>
    <p class="modal-intro">
      Outscore your opponent over three innings. Win two games to take a series. Lose two in the
      same series and the run ends.
    </p>
    <div class="rules-grid">
      <section>
        <h3>The numbers on screen</h3>
        <p>
          <b>Contact</b> is batting power. <b>Pitch</b> is pitching strength, not a number of
          pitches. <b>Field</b> removes bases from an enemy hit. <b>Energy</b> pays for cards. These
          reset each at-bat.
        </p>
      </section>
      <section>
        <h3>Pitcher adjustment</h3>
        <p>
          The old “Scouting +1” label means the enemy pitcher has adjusted after facing a batter.
          Their Pitch rises by 1 per at-bat this half. The displayed Pitch total already includes
          it. It resets when sides switch.
        </p>
      </section>
      <section>
        <h3>01 / One turn, one at-bat</h3>
        <p>
          Draw 5 cards and gain 3 Energy. Play cards in any order, then resolve the at-bat. On
          offense, build Contact to meet the opponent’s Pitch: that is a single. Each 2 extra
          Contact adds a base, up to a home run. Below their Pitch is an out.
        </p>
      </section>
      <section>
        <h3>02 / Take the mound</h3>
        <p>
          On defense your cards automatically flip. Your Pitch reduces enemy Contact. Every 2
          Contact left (rounded up) becomes a hit base, capped at four. Field removes hit bases;
          zero means an out. The predicted outcome includes your character’s perk.
        </p>
      </section>
      <section>
        <h3>03 / Switch sides</h3>
        <p>
          Three outs end a half-inning. Runners clear and your full deck reshuffles, including
          exhausted cards. The score stays. Game 2 of a series is at home; games 1 and 3 are away. A
          home team already leading can skip its final at-bat or win on a walk-off.
        </p>
      </section>
      <section>
        <h3>04 / Choose a pair</h3>
        <p>
          Each card’s offensive and defensive faces are fixed. Rewards show both costs and effects.
          Upgrading improves both faces. Exhaust lasts only this half. Contact, Pitch and Field
          reset each at-bat; effects marked “next at-bat” carry once.
        </p>
      </section>
      <section>
        <h3>05 / Win the series</h3>
        <p>
          Each act contains three branching best-of-three series. A first loss gives another chance,
          cash and a card reward. Choose one dugout stop between games. Elites have +1 Pitch and
          Contact and award equipment when you win the series. Win all nine series to finish the
          run.
        </p>
      </section>
      <section>
        <h3>06 / Sudden death</h3>
        <p>
          A tie after three innings gives each team one bases-loaded at-bat. More runs wins. If
          still tied, higher Contact margin wins: your Contact minus their Pitch, compared with
          their Contact minus your Pitch. An exact tie goes to the home team. The rule is shown
          during the showdown.
        </p>
      </section>
      <section>
        <h3>07 / Pace and stamina</h3>
        <p>
          Each game costs 10 stamina; below 30 you draw 4 instead of 5. Rest restores 28. A new act
          restores 25. Enemy Pitch rises by 1 each at-bat within a half. Every fourth enemy at-bat
          is a routine pop-up; use it to set up your next play.
        </p>
      </section>
      <section>
        <h3>08 / Bring runners home</h3>
        <p>
          Hits advance all runners by the hit distance, then place the batter. A walk only forces
          occupied bases. Advance cards can score runners before you swing. A sacrifice advances
          runners only with fewer than two outs, when it resolves. It forces an out; a later walk
          card can replace that outcome. Read the result bar before resolving.
        </p>
      </section>
    </div>
    <p class="fine-print">
      DRAG TO FIELD OR CLICK · 1–9 PLAY CARDS · SPACE RESOLVE / SWITCH · D INSPECT BOTH FACES · ESC
      CLOSE
    </p>
    ${button('PLAY BALL', 'close', 'primary')}`;
}
export function deckContent(run, mode = 'view', pile = null) {
  const titles = {
    view: 'Your playbook',
    upgrade: 'Put in the extra reps',
    remove: 'Clean out the bag',
    drawPile: 'Draw pile',
    discard: 'Discard pile',
    exhausted: 'Exhausted this half',
  };
  let cards = pile ? run.battle[pile] : run.deck;
  if (mode === 'upgrade') cards = cards.filter((c) => !c.upgraded);
  // Draw order is hidden; browsing the pile must not reveal the next card.
  if (pile === 'drawPile') cards = cards.slice().sort((a, b) => a.id.localeCompare(b.id));
  return html`<h2 id="modal-title">${titles[pile || mode]}</h2>
    <p class="modal-intro">
      ${mode === 'upgrade'
        ? 'Choose a pair to upgrade permanently. Both upgraded faces are shown below.'
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
            showBoth: !pile,
            side: pile ? run.battle.side : 'offense',
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
      >${id === 'starter' ? 'STARTING EQUIPMENT' : 'EQUIPMENT · ACTIVE EACH HALF'}</span
    >
  </div>`;
}
export function logContent(run) {
  return html`<h2 id="modal-title">Play-by-play</h2>
    <ol class="play-log">
      ${run.battle.log.map((l) => html`<li>${escape(l)}</li>`).join('')}
    </ol>`;
}

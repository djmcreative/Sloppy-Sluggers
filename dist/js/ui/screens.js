import { CHARACTERS } from '../data/characters.js';
import { RELICS } from '../data/encounters.js';
import { canPlay, incoming } from '../engine/battle.js';

import { html, img, button, cardMarkup, pips, escape } from './components.js';
import { routeScreen } from './route.js';

export function titleScreen(selected, saved) {
  return html`<main class="arcade-title">
    <div class="game-logo"><span>Sloppy</span><strong>Sluggers</strong></div>
    <div class="title-cast">
      ${img('Speedster in game', 'cast-speed')}${img('Dean Kean in game', 'cast-dean')}${img(
        'All Purpose in game',
        'cast-captain',
      )}
    </div>
    <div class="title-menu">
      ${saved && !['won', 'lost'].includes(saved.phase)
        ? button(`Continue · Inning ${saved.inning}`, 'continue', 'continue-game')
        : ''}${button('Play', 'select-slugger', 'play-game')}${button(
        'How to play',
        'help',
        'help-game',
      )}
    </div>
    <div class="title-corner">A baseball deckbuilding roguelike</div>
    <span class="title-version">Wayzata · Act I</span>
  </main>`;
}

export function rosterScreen(selected) {
  const c = CHARACTERS[selected];
  return html`<main class="select-screen">
    <button class="back-button" data-action="home">← Back</button>
    <h1>Choose your slugger</h1>
    <div class="select-stage">
      <section class="select-profile">
        <span class="player-role">${c.role}</span>
        <h2>${c.name}</h2>
        <p class="character-flavor">${c.tagline}</p>
        <div class="character-perk">
          ${img(c.icon)}
          <div>
            <h3>${c.perk}</h3>
            <p>${c.rule}</p>
          </div>
        </div>
        <div class="select-deck">
          <span>Starting playbook</span>
          <p>12 cards · 3 energy per turn</p>
          <button data-action="starter-deck">Inspect cards</button>
        </div>
      </section>
      <div class="select-hero">${img(c.sprite)}<span class="select-nameplate">${c.name}</span></div>
    </div>
    <div class="select-bottom">
      <div class="portrait-selectors">
        ${Object.entries(CHARACTERS)
          .map(
            ([id, char]) =>
              html`<button
                class="portrait-selector ${id === selected ? 'selected' : ''}"
                data-action="character"
                data-id="${id}"
                aria-label="Choose ${char.name}"
                aria-pressed="${id === selected}"
              >
                ${img(char.portrait)}<span>${char.name}</span>
              </button>`,
          )
          .join('')}
      </div>
      ${button('Play ball!', 'start', 'primary')}
    </div>
  </main>`;
}

export function mapScreen(run) {
  return routeScreen(run);
}

export function battleScreen(run, actionAnimation = false) {
  const b = run.battle,
    c = CHARACTERS[run.character],
    pitch = b.pitch;
  const through = incoming(b);
  return html`<main class="battle-screen ${actionAnimation ? 'action-animation' : ''}">
    <div class="match-heading">
      <span
        >WAYZATA HIGH SCHOOL <i>/</i> ${b.node.elite
          ? 'ACE MATCHUP'
          : b.inning === 9
            ? 'THE FINAL INNING'
            : 'REGULAR MATCHUP'}</span
      ><span>INNING ${String(b.inning).padStart(2, '0')} <i>/</i> 09</span>
    </div>
    <section class="field" aria-label="Baseball field and score">
      <div class="field-vignette"></div>
      <div class="scoreboard">
        <div class="score-main">
          <span>SLUGGERS</span><strong>${String(b.runs).padStart(2, '0')}</strong
          ><small>/ ${String(b.target).padStart(2, '0')} TO WIN</small>
        </div>
        <div class="count-board">
          <div><span>BALLS</span>${pips(b.balls, 4, 'balls')}</div>
          <div><span>STRIKES</span>${pips(b.strikes, 3, 'strikes')}</div>
          <div><span>OUTS</span>${pips(b.outs, 3, 'outs')}</div>
        </div>
        <div class="score-turn">
          <span>TURN</span><strong>${String(b.turn).padStart(2, '0')}</strong>
        </div>
      </div>
      <div class="batter-unit">
        ${img(c.sprite, 'batter-sprite')}
        <div class="unit-label"><strong>${c.name}</strong><span>${c.role}</span></div>
      </div>
      <div
        class="base-board"
        aria-label="Bases: ${b.bases
          .map((v, i) => (v ? `runner on ${i + 1}` : ''))
          .filter(Boolean)
          .join(', ') || 'empty'}"
      >
        <div class="diamond-line"></div>
        ${[1, 2, 0]
          .map(
            (i) =>
              html`<span class="base base-${i} ${b.bases[i] ? 'occupied' : ''}"
                ><b>${['1B', '2B', '3B'][i]}</b></span
              >`,
          )
          .join('')}<span class="home-plate">◆</span
        ><small>${b.bases.filter(Boolean).length} ON BASE</small>
      </div>
      <div class="pitcher-unit">
        <div class="pitch-intent ${pitch.pierce ? 'piercing' : ''}" title="${escape(pitch.text)}">
          ${img(pitch.icon)}
          <div>
            <span>COMING NEXT</span><strong>${pitch.name}</strong
            ><small
              >${pitch.strikes
                ? `${pitch.strikes} STRIKE${pitch.strikes === 1 ? '' : 'S'}${pitch.pierce ? ' · UNBLOCKABLE' : ''}`
                : '+2 BALLS'}${pitch.runners
                ? ` · −${pitch.runners} RUNNER${pitch.runners === 1 ? '' : 'S'}`
                : ''}${pitch.junk ? ' · +JUNK' : ''}</small
            >
          </div>
        </div>
        ${img(b.node.art, 'pitcher-sprite')}
        <div class="unit-label">
          <strong>${b.node.name}${b.node.elite ? ' ★' : ''}</strong
          ><span
            >${Math.floor((b.turn - 1) / 4) > 0
              ? `SETTLED IN +${Math.min(2, Math.floor((b.turn - 1) / 4))}`
              : b.node.title}</span
          >
        </div>
      </div>
    </section>
    <div class="battle-mid">
      <div class="defense-status">
        ${img('shield')}<strong>${b.foul}</strong><span>FOUL</span><i></i
        ><span class="pitch-outcome ${through ? 'danger' : 'safe'}"
          >${through
            ? `${through} strike${through === 1 ? '' : 's'} will get through`
            : pitch.strikes
              ? 'Pitch covered · draw +1 next turn'
              : 'Free pitch · gain 2 balls'}</span
        >
      </div>
      <div class="focus-status">
        ${b.focus
          ? `${img('crosshair')} Next hit +${b.focus} base${b.focus === 1 ? '' : 's'}`
          : ''}${b.powers.discipline ? ' · Discipline active' : ''}${b.powers.rhythm
          ? ' · Rhythm active'
          : ''}
      </div>
      <button class="text-button" data-action="log">PLAY-BY-PLAY ↗</button>
    </div>
    <section class="hand-area" aria-label="Your hand">
      <div class="energy-panel">
        <div class="energy-orb"><strong>${b.energy}</strong><span>/ 3</span></div>
        <span>ENERGY</span
        ><button data-action="pile" data-id="drawPile" class="pile-button">
          ${b.drawPile.length}<small>DRAW PILE</small>
        </button>
      </div>
      <div class="hand">
        ${b.hand
          .map((card, i) =>
            cardMarkup(card, {
              action: 'play',
              disabled: !canPlay(b, card.uid),
              index: i < 9 ? i : null,
              extra: `style="--fan-x:${(i - (b.hand.length - 1) / 2) * Math.min(120, 620 / b.hand.length)}px;--fan-angle:${(i - (b.hand.length - 1) / 2) * 3}deg;--fan-y:${Math.pow(i - (b.hand.length - 1) / 2, 2) * 2}px"`,
            }),
          )
          .join('') || '<p class="empty-hand">Your hand is empty. End your turn to draw again.</p>'}
      </div>
      <div class="turn-panel">
        ${button('END TURN <span>→</span>', 'end-turn', 'primary end-turn')}<span
          class="keyboard-hint"
          >SPACE TO END TURN</span
        ><button data-action="pile" data-id="discard" class="pile-button">
          ${b.discard.length}<small>DISCARD</small></button
        ><button data-action="pile" data-id="exhausted" class="exhaust-pile">
          EXHAUSTED ${b.exhausted.length}
        </button>
      </div>
    </section>
    <div class="battle-footer">
      <span>${b.tired ? 'TIRED · 4 CARDS PER TURN' : 'PLAY CARDS IN ANY ORDER · 1–9 TO PLAY'}</span>
      <p aria-hidden="true">${escape(b.log.at(-1) || '')}</p>
      <span>3 STRIKES = 1 OUT</span>
    </div>
  </main>`;
}

export function rewardScreen(run) {
  return html`<main class="intermission reward-screen">
    <span class="eyebrow">INNING ${run.inning} / IN THE BOOKS</span>
    <h1>That’s a <em>ballgame.</em></h1>
    <p class="screen-description">
      ${run.battle.runs} runs on the board. Pick one card for the road ahead.
    </p>
    <div class="reward-loot">
      <span>+$${run.lastCash} CASH</span>${run.lastRelic
        ? html`<button data-action="relic" data-id="${run.lastRelic}">
            ${img(RELICS[run.lastRelic].icon)} FOUND: ${RELICS[run.lastRelic].name}
          </button>`
        : ''}
    </div>
    <div class="reward-cards">
      ${run.rewards.map((c) => cardMarkup(c, { action: 'reward' })).join('')}
    </div>
    ${button('SKIP CARD →', 'skip-reward', 'secondary')}
    <p class="fine-print">A smaller deck finds its best cards more often.</p>
  </main>`;
}

export function restScreen(run) {
  const rest = run.phase === 'rest';
  return html`<main class="intermission stop-screen">
    ${img('rest day node', 'stop-art')}<span class="eyebrow"
      >BETWEEN INNINGS / ${rest ? 'THE DUGOUT' : 'BATTING CAGES'}</span
    >
    <h1>${rest ? 'Take a <em>breather.</em>' : 'Make it <em>count.</em>'}</h1>
    <p class="screen-description">
      ${rest
        ? 'The lights hum. Your teammates pass the seeds. A little time to reset.'
        : 'A bucket of baseballs and a few quiet minutes. Put in the work.'}
    </p>
    <div class="choice-grid">
      <button class="choice-card" data-action="rest">
        ${img('energy drink')}
        <h2>Catch your breath</h2>
        <p>Recover ${rest ? 28 : 16} stamina.</p>
        <strong>${run.stamina} → ${Math.min(100, run.stamina + (rest ? 28 : 16))}</strong></button
      ><button
        class="choice-card"
        data-action="upgrade"
        ${run.deck.every((c) => c.upgraded) ? 'disabled' : ''}
      >
        ${img('dumbell')}
        <h2>Extra reps</h2>
        <p>Permanently upgrade one card.</p>
        <strong>CHOOSE A CARD ↗</strong>
      </button>
    </div>
  </main>`;
}

export function eventScreen(run) {
  const events = {
    hotdog: {
      title: 'The hot dog <em>contest.</em>',
      copy: 'The concession guy knows a competitor when he sees one. “Twenty dogs. Ten minutes. You in?”',
      safe: 'Just have lunch',
      safeCopy: 'Recover 18 stamina.',
      risk: 'Enter the contest',
      riskCopy: 'Gain $35. Lose 10 stamina.',
      icon: 'energy drink',
    },
    cage: {
      title: 'One more <em>bucket.</em>',
      copy: 'The groundskeeper is locking up. He’ll leave the lights on for one last round of batting practice.',
      safe: 'Help him close up',
      safeCopy: 'Gain $15.',
      risk: 'Stay for extra reps',
      riskCopy: 'Upgrade a random unupgraded card. Lose 8 stamina.',
      icon: 'dumbell',
    },
    trade: {
      title: 'Dugout <em>dealmaker.</em>',
      copy: 'A teammate slides a dog-eared playbook across the bench. “Got a play you’re willing to part with?”',
      safe: 'Keep your playbook',
      safeCopy: 'Collect your $20 appearance fee.',
      risk: 'Make the trade',
      riskCopy:
        'Replace one basic Find the Gap with a random reward card. If you have none, just gain the card.',
      icon: 'question',
    },
  };
  const e = events[run.event];
  return html`<main class="intermission stop-screen">
    ${img(e.icon, 'stop-art')}<span class="eyebrow">BETWEEN INNINGS / AROUND THE BALLPARK</span>
    <h1>${e.title}</h1>
    <p class="screen-description">${e.copy}</p>
    <div class="choice-grid">
      <button class="choice-card" data-action="event" data-id="safe">
        <span class="eyebrow">PLAY IT SAFE</span>
        <h2>${e.safe}</h2>
        <p>${e.safeCopy}</p></button
      ><button class="choice-card" data-action="event" data-id="risk">
        <span class="eyebrow">MAKE A MOVE</span>
        <h2>${e.risk}</h2>
        <p>${e.riskCopy}</p>
      </button>
    </div>
  </main>`;
}

export function shopScreen(run) {
  const s = run.shop,
    relic = s.relic ? RELICS[s.relic] : null;
  return html`<main class="intermission shop-screen">
    <span class="eyebrow">BETWEEN INNINGS / THE CLUBHOUSE STORE</span>
    <h1>A little <em>extra edge.</em></h1>
    <p class="screen-description">New plays. Well-worn gear. Cash only.</p>
    <div class="shop-cards">
      ${s.cards
        .map(
          (i) =>
            html`<div>
              ${cardMarkup(i.card, {
                action: 'buy-card',
                disabled: i.sold || run.cash < i.price,
              })}<span class="price">${i.sold ? 'SOLD' : `$${i.price}`}</span>
            </div>`,
        )
        .join('')}
    </div>
    <div class="shop-services">
      ${relic
        ? html`<button
            class="service"
            data-action="buy-relic"
            ${s.relicSold || run.cash < 65 ? 'disabled' : ''}
          >
            ${img(relic.icon)}
            <div>
              <strong>${relic.name}</strong>
              <p>${relic.text}</p>
            </div>
            <b>${s.relicSold ? 'SOLD' : '$65'}</b>
          </button>`
        : ''}<button
        class="service"
        data-action="buy-recover"
        ${s.recoverySold || run.cash < 20 || run.stamina === 100 ? 'disabled' : ''}
      >
        ${img('energy drink')}
        <div>
          <strong>Cold drink</strong>
          <p>Recover 20 stamina.</p>
        </div>
        <b>${s.recoverySold ? 'SOLD' : '$20'}</b></button
      ><button
        class="service"
        data-action="remove"
        ${s.removalSold || run.cash < 35 || run.deck.length <= 8 ? 'disabled' : ''}
      >
        ${img('glove')}
        <div>
          <strong>Clean out the bag</strong>
          <p>Remove one card. Minimum 8 cards.</p>
        </div>
        <b>${s.removalSold ? 'SOLD' : '$35'}</b>
      </button>
    </div>
    ${button('BACK TO THE ROAD →', 'leave-shop', 'primary')}
  </main>`;
}

export function endScreen(run) {
  const won = run.phase === 'won';
  return html`<main class="intermission ending">
    ${img(won ? CHARACTERS[run.character].sprite : 'Closer', 'ending-art')}<span class="eyebrow"
      >${won ? 'WAYZATA CHAMPIONS' : 'THE FINAL OUT'}</span
    >
    <h1>${won ? 'You own <em>the night.</em>' : 'See you <em>next season.</em>'}</h1>
    <p class="screen-description">
      ${won
        ? 'Nine innings. One unforgettable run. The closer never saw you coming.'
        : `${run.battle.node.name} got the last word. A new deck and a different route are waiting.`}
    </p>
    <div class="end-stats">
      <div>
        <strong>${run.completed}<small>/9</small></strong
        ><span>INNINGS WON</span>
      </div>
      <div><strong>${run.totalRuns}</strong><span>RUNS SCORED</span></div>
      <div><strong>${run.deck.length}</strong><span>CARDS IN DECK</span></div>
    </div>
    ${button('BACK TO THE CLUBHOUSE ↗', 'home', 'primary')}${button(
      'INSPECT FINAL DECK',
      'deck',
      'secondary',
    )}<span class="fine-print"
      >SEED ${run.seed} · ${CHARACTERS[run.character].name.toUpperCase()}</span
    >
  </main>`;
}

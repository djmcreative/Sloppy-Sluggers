import { CHARACTERS } from '../data/characters.js';
import { RELICS } from '../data/encounters.js';
import { canPlay, previewAtBat } from '../engine/battle.js';

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
        ? button(`Continue · Act ${saved.act}`, 'continue', 'continue-game')
        : ''}${button('Play', 'select-slugger', 'play-game')}${button(
        'How to play',
        'help',
        'help-game',
      )}
    </div>
    <div class="title-corner">A baseball deckbuilding roguelike</div>
    <span class="title-version">Two-Way Baseball</span>
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
          <p>12 paired cards · 3 energy per at-bat</p>
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

export function battleScreen(run, actionAnimation = false, sideTransition = false) {
  const b = run.battle,
    c = CHARACTERS[run.character],
    offense = b.side === 'offense',
    result = previewAtBat(b),
    switching = b.status === 'switch';
  const line = (team) =>
    b.lines.map((l, i) => `<td>${i > b.inning - 1 ? '—' : l[team]}</td>`).join('') +
    Array.from({ length: Math.max(0, 3 - b.lines.length) }, () => '<td>—</td>').join('');
  return html`<main
    class="battle-screen two-way-battle ${sideTransition ? 'side-transition' : ''} ${offense
      ? 'on-offense'
      : 'on-defense'} ${actionAnimation ? 'action-animation' : ''}"
  >
    <div class="match-heading">
      <span>${b.node.park.toUpperCase()} / ${b.node.elite ? 'ELITE SERIES' : 'BEST OF THREE'}</span
      ><span>GAME ${b.game} · SERIES ${run.series.wins}–${run.series.losses}</span>
    </div>
    <section class="field" aria-label="Baseball field and score">
      <div class="field-vignette"></div>
      <div class="scoreboard match-scoreboard">
        <table class="line-score">
          <caption>
            ${b.showdown
              ? 'SUDDEN-DEATH SHOWDOWN'
              : `INNING ${b.inning} / 3 · ${b.half === 0 ? 'TOP' : 'BOTTOM'}`}
          </caption>
          <thead>
            <tr>
              <th>TEAM</th>
              <th>1</th>
              <th>2</th>
              <th>3</th>
              ${b.showdown ? '<th>SD</th>' : ''}
              <th>R</th>
            </tr>
          </thead>
          <tbody>
            <tr class="${offense ? 'batting-row' : ''}">
              <th>SLUGGERS ${b.home ? '(H)' : '(A)'}</th>
              ${line('player')}
              <td class="total-score">${b.score.player}</td>
            </tr>
            <tr class="${!offense ? 'batting-row' : ''}">
              <th>${escape(b.node.name.split(' · ')[0])} ${b.home ? '(A)' : '(H)'}</th>
              ${line('enemy')}
              <td class="total-score">${b.score.enemy}</td>
            </tr>
          </tbody>
        </table>
        <div class="count-board">
          <div><span>OUTS</span>${pips(b.outs, 3, 'outs')}</div>
          <strong class="side-indicator">${offense ? 'YOU BAT' : 'YOU PITCH'}</strong
          ><small>AT-BAT ${b.halfTurn}</small>
        </div>
      </div>
      <div class="field-scene">
        <div class="field-world">
          <div class="stadium-art"></div>
          <div class="field-player player-unit ${offense ? 'at-plate' : 'at-mound'}">
            ${img(
              offense ? c.sprite : c.pitching,
              'batter-sprite',
              `${c.name} ${offense ? 'batting' : 'pitching'}`,
            )}
            <div class="unit-label">
              <strong>${c.name}</strong><span>${offense ? 'AT THE PLATE' : 'ON THE MOUND'}</span>
            </div>
          </div>
          <div class="field-player enemy-unit ${offense ? 'at-mound' : 'at-plate'}">
            ${img(
              offense ? b.node.pitching : b.node.batting,
              'pitcher-sprite',
              `${b.node.name} ${offense ? 'pitching' : 'batting'}`,
            )}
            <div class="unit-label">
              <strong>${b.node.name}</strong><span>${b.node.title}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="pitch-intent" title="${escape(b.intent.text)}">
        ${img(b.intent.icon)}
        <div>
          <span>${offense ? 'ENEMY PITCH' : 'ENEMY SWING'}</span><strong>${b.intent.name}</strong
          ><small
            >${b.intent.strength}
            ${offense ? 'PITCH STRENGTH' : 'BATTING CONTACT'}${b.intent.scouting
              ? ` · ADJUSTMENT +${b.intent.scouting}`
              : ''}</small
          >
        </div>
      </div>

      <div class="card-play-zone" aria-label="Play card on field"><span>RELEASE TO PLAY</span></div>
      <div
        class="base-board"
        aria-label="${offense ? 'Your' : 'Enemy'} runners: ${b.bases
          .map((v, i) => (v ? `${i + 1}B` : ''))
          .filter(Boolean)
          .join(', ') || 'bases empty'}"
      >
        <div class="diamond-line"></div>
        ${[1, 2, 0]
          .map(
            (i) =>
              `<span class="base base-${i} ${b.bases[i] ? 'occupied' : ''}"><b>${['1B', '2B', '3B'][i]}</b></span>`,
          )
          .join('')}<span class="home-plate">◆</span
        ><small>${offense ? 'YOUR' : 'ENEMY'} RUNNERS</small>
      </div>
    </section>
    <div class="battle-mid">
      <div class="defense-status">
        ${img(offense ? 'batting gloves' : 'fastball')}<strong
          >${offense ? b.contact : b.pitch}</strong
        ><span>${offense ? 'CONTACT' : 'PITCH'}</span>${!offense
          ? `<strong>${b.field}</strong><span>FIELD</span>`
          : ''}<i></i
        ><span
          class="pitch-outcome ${result.kind === 'out'
            ? offense
              ? 'danger'
              : 'safe'
            : offense
              ? 'safe'
              : 'danger'}"
          >${switching
            ? 'HALF-INNING COMPLETE'
            : `IF YOU RESOLVE: ${result.label.toUpperCase()}`}</span
        >
      </div>
      <button class="text-button" data-action="log">PLAY-BY-PLAY ↗</button>
    </div>
    ${b.showdown
      ? '<p class="showdown-rule">One bases-loaded at-bat each. More runs wins; tied runs use Contact margins, then home field.</p>'
      : ''}
    <section class="hand-area" aria-label="Your ${b.side} hand">
      <div class="energy-panel">
        <div class="energy-orb"><strong>${b.energy}</strong><span>/ 3</span></div>
        <span>ENERGY</span
        ><button data-action="pile" data-id="drawPile" class="pile-button">
          ${b.drawPile.length}<small>DRAW PILE</small>
        </button>
      </div>
      <div class="hand">
        ${switching
          ? html`<div class="half-inning-break">
              <span>${b.inning === 3 && b.half === 1 ? 'TIED BALLGAME' : 'SIDE RETIRED'}</span>
              <h2>
                ${b.inning === 3 && b.half === 1
                  ? 'Time for a showdown.'
                  : offense
                    ? 'Take the mound.'
                    : 'Grab your bat.'}
              </h2>
              <p>Your cards turn over. A fresh deck and three energy await.</p>
              ${button(
                b.inning === 3 && b.half === 1 ? 'START SHOWDOWN →' : 'SWITCH SIDES →',
                'next-half',
                'primary',
              )}
            </div>`
          : b.hand
              .map((card, i) =>
                cardMarkup(card, {
                  action: 'play',
                  side: b.side,
                  disabled: !canPlay(b, card.uid),
                  index: i < 9 ? i : null,
                  extra: `style="--fan-x:${(i - (b.hand.length - 1) / 2) * Math.min(132, 640 / b.hand.length)}px;--fan-angle:${(i - (b.hand.length - 1) / 2) * 2}deg;--fan-y:${Math.pow(i - (b.hand.length - 1) / 2, 2)}px"`,
                }),
              )
              .join('') || '<p class="empty-hand">No cards left. Resolve this at-bat.</p>'}
      </div>
      <div class="turn-panel">
        ${button(
          offense ? 'SWING / RESOLVE →' : 'PITCH / RESOLVE →',
          'end-turn',
          'primary end-turn',
          switching ? 'disabled' : '',
        )}<span class="keyboard-hint">SPACE TO RESOLVE</span
        ><button data-action="pile" data-id="discard" class="pile-button">
          ${b.discard.length}<small>DISCARD</small></button
        ><button data-action="pile" data-id="exhausted" class="exhaust-pile">
          EXHAUSTED ${b.exhausted.length}
        </button>
      </div>
    </section>
    <div class="battle-footer">
      <span
        >${b.tired ? 'TIRED · DRAW 4' : 'DRAG TO FIELD · CLICK · 1–9'} ·
        ${b.powers.rhythm ? 'RHYTHM ACTIVE · ' : ''}NEXT AT-BAT
        +${offense ? b.nextContact : b.nextPitch} ${offense ? 'CONTACT' : 'PITCH'}</span
      >
      <p aria-hidden="true">${escape(b.log.at(-1) || '')}</p>
      <span
        >${offense
          ? 'MATCH PITCH TO HIT · +2 = EXTRA BASE'
          : 'PITCH REDUCES CONTACT · FIELD REDUCES BASES'}</span
      >
    </div>
  </main>`;
}
export function rewardScreen(run) {
  const won = run.battle.status === 'won',
    clinched = run.series.wins === 2;
  return html`<main class="intermission reward-screen">
    <span class="eyebrow">ACT ${run.act} · SERIES ${run.stage} · GAME ${run.battle.game}</span>
    <h1>
      ${clinched
        ? 'Series <em>clinched.</em>'
        : won
          ? 'One in <em>the books.</em>'
          : 'Still in <em>the fight.</em>'}
    </h1>
    <p class="screen-description">
      Final: Sluggers ${run.battle.score.player} — ${escape(run.battle.node.name.split(' · ')[0])}
      ${run.battle.score.enemy}. Series
      ${run.series.wins}–${run.series.losses}.${clinched
        ? ' Choose a pair for the next opponent.'
        : run.series.losses
          ? ' Win the next game to stay alive.'
          : ' Two wins take the series.'}
    </p>
    <div class="reward-loot">
      <span>+$${run.lastCash} CASH</span>${run.lastRelic
        ? `<button data-action="relic" data-id="${run.lastRelic}">${img(RELICS[run.lastRelic].icon)} FOUND: ${RELICS[run.lastRelic].name}</button>`
        : ''}
    </div>
    <p class="pairing-note">ONE CARD · TWO FACES · Compare offense and defense before choosing.</p>
    <div class="reward-cards">
      ${run.rewards.map((c) => cardMarkup(c, { action: 'reward', showBoth: true })).join('')}
    </div>
    ${button('SKIP CARD →', 'skip-reward', 'secondary')}
    <p class="fine-print">
      Both faces upgrade together. A lean deck finds its best pairs more often.
    </p>
  </main>`;
}
export function restScreen(run) {
  const rest = run.phase === 'rest';
  return html`<main class="intermission stop-screen">
    ${img('rest day node', 'stop-art')}<span class="eyebrow"
      >BETWEEN GAMES / ${rest ? 'THE DUGOUT' : 'BATTING CAGES'}</span
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
        <p>Permanently upgrade both faces of one card.</p>
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
    ${img(e.icon, 'stop-art')}<span class="eyebrow">BETWEEN GAMES / AROUND THE BALLPARK</span>
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
    <span class="eyebrow">BETWEEN GAMES / THE CLUBHOUSE STORE</span>
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
    ${button('FINISH SHOP VISIT →', 'leave-shop', 'primary')}
  </main>`;
}

export function endScreen(run) {
  const won = run.phase === 'won';
  return html`<main class="intermission ending">
    ${img(won ? CHARACTERS[run.character].sprite : run.battle.node.pitching, 'ending-art')}<span
      class="eyebrow"
      >${won ? 'THREE-ACT CHAMPIONS' : 'SERIES LOST'}</span
    >
    <h1>${won ? 'You own <em>the diamond.</em>' : 'See you <em>next season.</em>'}</h1>
    <p class="screen-description">
      ${won
        ? 'Nine series won. You earned it on both sides of the ball.'
        : `${run.battle.node.name} take the series ${run.series.losses}–${run.series.wins}. Final game: ${run.battle.score.player}–${run.battle.score.enemy}.`}
    </p>
    <div class="end-stats">
      <div>
        <strong>${run.completed}<small>/9</small></strong
        ><span>SERIES WON</span>
      </div>
      <div><strong>${run.gamesWon}–${run.gamesLost}</strong><span>GAME RECORD</span></div>
      <div>
        <strong>${run.totalRuns}–${run.totalAllowed}</strong><span>RUNS FOR / AGAINST</span>
      </div>
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

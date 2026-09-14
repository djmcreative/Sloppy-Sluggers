import { TEAMS } from '../data/encounters.js';
import { html, img, escape } from './components.js';
import { buildActRoute, ROUTE_HEIGHT, ROUTE_WIDTH } from './route-layout.js';

export function routeScreen(run) {
  const { nodes, links, sections } = buildActRoute(run);
  const instruction =
    run.phase === 'dugout'
      ? 'Choose a stop after your last game.'
      : run.phase === 'ready'
        ? 'Choose the next game node.'
        : 'Choose a Game 1 opponent to start the series.';
  const paths = links
    .map(({ from, to, traveled, bypass }) => {
      const d = bypass
        ? `M ${from.x} ${from.y - 28} C 20 ${from.y - 70}, 20 ${to.y + 70}, ${to.x} ${to.y}`
        : `M ${from.x} ${from.y - 28} C ${from.x} ${from.y - 85}, ${to.x} ${to.y + 85}, ${to.x} ${to.y + 28}`;
      return `<path class="${traveled ? 'traveled' : ''}" d="${d}"/>`;
    })
    .join('');
  return html`<main class="journey full-act-journey">
    <aside class="journey-heading">
      <span>ACT ${run.act} / SERIES ${run.stage} OF 3</span>
      <h1>${TEAMS[run.act - 1].park}</h1>
      <p class="route-instruction">${instruction}</p>
      <ul class="journey-legend">
        <li>${img('combat node')} One three-inning game</li>
        <li>${img('rest day node')} Rest site</li>
        <li>${img('dumbell')} Training</li>
        <li>${img('batting gloves')} Shop</li>
        <li>${img('question')} Event</li>
        <li>${img('elite combat node')} Elite opponent</li>
      </ul>
      <div class="journey-equipment">
        ${img(TEAMS[run.act - 1].pitching)}<strong
          >${run.opponent ? escape(run.opponent.name) : 'Three series to win'}</strong
        ><span
          >${run.opponent
            ? `Series ${run.series.wins}–${run.series.losses}`
            : 'Two wins advance. Two losses end the run.'}</span
        >
      </div>
    </aside>
    <section class="journey-scroll" aria-label="Games and branching stops map">
      <div class="journey-paper full-act-paper" style="height:${ROUTE_HEIGHT}px">
        <div class="paper-title">
          THE ROAD TO THE PENNANT<span>ALL THREE SERIES · GAMES AND STOPS</span>
        </div>
        <svg
          class="route-paths"
          viewBox="0 0 ${ROUTE_WIDTH} ${ROUTE_HEIGHT}"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          ${paths}
        </svg>
        ${sections
          .map(
            (s) =>
              `<div class="series-map-heading" style="top:${s.y}px">SERIES ${s.stage}<small>${escape(s.name)}</small></div>`,
          )
          .join('')}
        ${nodes
          .map(
            (n) =>
              html`<button
                class="journey-node route-${n.kind} ${n.active ? 'available' : ''} ${n.visited
                  ? 'visited'
                  : ''} ${n.abandoned ? 'route-abandoned' : ''}"
                style="left:${(n.x / ROUTE_WIDTH) * 100}%;top:${n.y}px"
                data-route-id="${n.id}"
                data-action="${n.action}"
                data-id="${n.actionId || ''}"
                ${n.active ? '' : 'disabled'}
                aria-label="${escape(n.detail)}"
                title="${escape(n.detail)}"
              >
                ${img(n.icon)}<span class="journey-node-title"
                  >${n.title}<small>${escape(n.sub)}</small></span
                >${n.visited ? '<b>✓</b>' : ''}
              </button>`,
          )
          .join('')}
      </div>
    </section>
    <aside class="journey-notes">
      <h2>Your route</h2>
      <p>
        Start at the bottom and follow the paths upward. Every baseball is one game, not an entire
        series.
      </p>
      <p>
        After each game, choose a connected rest, training, shop or event node. Those paths
        reconnect at the next game.
      </p>
      <p>Game 3 is only needed at 1–1. Win 2–0 and your final stop opens the next series.</p>
      <p>All games and stops are shown from the start. Only glowing nodes can be selected.</p>
      <div><span>Series won</span><strong>${run.completed} / 9</strong></div>
    </aside>
  </main>`;
}

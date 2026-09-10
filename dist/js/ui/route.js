import { reachable } from '../engine/run.js';
import { html, img, escape } from './components.js';

function position(node) {
  return {
    x: node.x,
    y: node.y,
  };
}

export function routeScreen(run) {
  const links = [];
  for (let row = 0; row < 8; row++) {
    for (const from of run.map[row])
      for (const to of run.map[row + 1]) {
        if (!from.next.includes(to.id)) continue;
        const a = position(from),
          b = position(to),
          visited = run.route.includes(from.id) && run.route.includes(to.id);
        links.push(
          html`<path
            class="${visited ? 'traveled' : run.route.at(-1) === from.id ? 'next-path' : ''}"
            d="M ${a.x} ${a.y - 24} C ${a.x} ${a.y - 50}, ${b.x} ${b.y + 50}, ${b.x} ${b.y + 24}"
          />`,
        );
      }
  }
  return html`<main class="journey">
    <aside class="journey-heading">
      <span>ACT I</span>
      <h1>Wayzata</h1>
      <p>Inning ${run.inning} of 9</p>
      <div class="journey-equipment">
        ${img('Closer')}<strong>The Closer</strong><span>Waiting in the ninth</span>
      </div>
      <ul class="journey-legend">
        <li>${img('combat node')} Game</li>
        <li>${img('elite combat node')} Ace</li>
        <li>${img('rest day node')} Rest</li>
        <li>${img('batting gloves')} Shop</li>
        <li>${img('question')} Event</li>
        <li>${img('dumbell')} Training</li>
      </ul>
      <p class="route-instruction">
        Follow the dotted paths.<br />Small badges show your stop after each game.
      </p>
    </aside>
    <section class="journey-scroll" aria-label="Branching inning map">
      <div class="journey-paper">
        <div class="paper-title">WAYZATA HIGH SCHOOL<span>THE ROAD TO THE NINTH</span></div>
        <svg
          class="route-paths"
          viewBox="0 0 680 900"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          ${links.join('')}</svg
        >${run.map
          .flat()
          .map((n) => {
            const p = position(n),
              active = reachable(run, n),
              visited = run.route.includes(n.id);
            return html`<button
              class="journey-node ${active ? 'available' : ''} ${visited
                ? 'visited'
                : ''} ${n.inning === 9 ? 'final-node' : ''} ${n.elite ? 'ace-node' : ''}"
              style="left:${(p.x / 680) * 100}%;top:${p.y}px"
              data-action="node"
              data-id="${n.id}"
              ${active ? '' : 'disabled'}
              aria-label="Inning ${n.inning}. ${n.name}${n.elite
                ? ', ace'
                : ''}. ${n.target} runs to win. ${n.stop} afterward."
              title="${escape(
                `${n.name}${n.elite ? ' · Ace (+1 strike)' : ''}\nScore ${n.target} runs\nNext stop: ${n.stop}`,
              )}"
            >
              ${img(
                n.inning === 9
                  ? 'Closer combat node'
                  : n.elite
                    ? 'elite combat node'
                    : 'combat node',
              )}${n.inning < 9
                ? html`<span class="node-stop" aria-hidden="true"
                    >${img(
                      {
                        rest: 'rest day node',
                        shop: 'batting gloves',
                        event: 'question',
                        training: 'dumbell',
                      }[n.stop],
                    )}</span
                  >`
                : ''}<span class="journey-node-title"
                >${n.name}${n.elite ? ' ★' : ''}<small
                  >${n.target} RUNS${n.inning < 9 ? ' · ' + n.stop.toUpperCase() : ''}</small
                ></span
              >${visited ? '<b>✓</b>' : ''}
            </button>`;
          })
          .join('')}
        <div class="journey-start">START</div>
      </div>
    </section>
    <aside class="journey-notes">
      <h2>Scouting report</h2>
      <p>Paths split and reconnect. Only connected stops can be chosen.</p>
      <p>Every route plays nine innings.</p>
      <p>Aces demand one more run and throw one extra strike. Beat one to earn equipment.</p>
      <div><span>Completed</span><strong>${run.completed} / 9</strong></div>
    </aside>
  </main>`;
}

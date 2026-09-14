import { reachable } from '../engine/run.js';

const STOPS = [
  ['rest', 'rest day node', 'Rest site', 'Recover stamina or upgrade a card'],
  ['training', 'dumbell', 'Training', 'Upgrade a card or recover stamina'],
  ['shop', 'batting gloves', 'Shop', 'Cards, gear and services'],
  ['event', 'question', 'Event', 'An encounter around the park'],
];

export const ROUTE_WIDTH = 680;
export const ROUTE_HEIGHT = 3540;

// Expand each series into actual games and stops on one persistent act map.
// These nodes only expose actions already validated by the run engine.
export function buildActRoute(run) {
  const nodes = [],
    links = [],
    sections = [];
  const connect = (from, to, traveled = false, bypass = false) =>
    links.push({ from, to, traveled, bypass });
  let previousExit = null,
    previousOpponent = null;
  for (let stage = 1; stage <= 3; stage++) {
    const startY = ROUTE_HEIGHT - 180 - (stage - 1) * 1100;
    const opponents = run.map[stage - 1];
    const chosen = opponents.find((n) => run.route.includes(n.id));
    const games = run.history.filter((g) => g.act === run.act && g.stage === stage);
    const wins = games.filter((g) => g.won).length;
    const sweep = wins === 2 && games.length === 2;
    const current = run.stage === stage;
    const team = chosen?.name || 'Same opponent';
    sections.push({ stage, y: startY + 112, name: chosen?.name || 'Choose an opponent at Game 1' });
    const opening = opponents.map((opponent) => {
      const selected = chosen?.id === opponent.id;
      const disconnected = previousOpponent && !previousOpponent.next.includes(opponent.id);
      const node = {
        id: `game-${opponent.id}-1`,
        x: opponent.x,
        y: startY,
        title: 'Game 1',
        sub: opponent.name,
        detail: `Series ${stage}. ${opponent.name}. Game 1. ${opponent.elite ? 'Elite opponent.' : 'Regular opponent.'}`,
        icon: opponent.boss
          ? 'Closer combat node'
          : opponent.elite
            ? 'elite combat node'
            : 'combat node',
        active: reachable(run, opponent),
        visited: selected && games.length > 0,
        abandoned: (!!chosen && !selected) || !!disconnected,
        kind: 'game',
        action: 'node',
        actionId: opponent.id,
      };
      nodes.push(node);
      if (previousExit && !disconnected) connect(previousExit, node, selected);
      return node;
    });
    let priorStops = [];
    for (let game = 1; game <= 3; game++) {
      const y = startY - (game - 1) * 340;
      const result = games[game - 1];
      const skipped = game === 3 && sweep;
      let gameNodes = opening;
      if (game > 1) {
        const node = {
          id: `game-${stage}-${game}`,
          x: 340,
          y,
          title: `Game ${game}`,
          sub: result
            ? `${result.won ? 'WIN' : 'LOSS'} · ${result.player}–${result.enemy}`
            : skipped
              ? 'SKIPPED · SERIES WON'
              : game === 3
                ? 'Only if tied 1–1'
                : `${team} · Home game`,
          detail: `Series ${stage}. Game ${game}. ${team}. ${game === 3 ? 'Only played if the series is tied.' : 'Home game.'}`,
          icon: chosen?.elite ? 'elite combat node' : 'combat node',
          active: current && run.phase === 'ready' && game === games.length + 1 && !skipped,
          visited: !!result,
          abandoned: skipped,
          kind: 'game',
          action: 'next-game',
        };
        nodes.push(node);
        if (!skipped) for (const stop of priorStops) connect(stop, node, stop.visited && !!result);
        gameNodes = [node];
      }
      if (skipped) continue;
      const selectedStop =
        run.stopHistory?.[`${run.act}-${stage}-${game}`] ||
        (current ? run.seriesStops?.[game - 1] : null);
      const stops = STOPS.map(([id, icon, title, sub], index) => {
        const node = {
          id: `stop-${stage}-${game}-${id}`,
          x: 85 + index * 170,
          y: y - 170,
          title,
          sub,
          detail: `Series ${stage}, after Game ${game}. ${title}. ${sub}.`,
          icon,
          active: current && run.phase === 'dugout' && game === games.length,
          visited: selectedStop === id,
          abandoned: !!selectedStop && selectedStop !== id,
          kind: 'stop',
          action: 'stop',
          actionId: id,
        };
        nodes.push(node);
        for (const source of gameNodes) connect(source, node, node.visited && !source.abandoned);
        return node;
      });
      priorStops = stops;
    }
    const exit = { x: 340, y: startY - 990 };
    for (const stop of priorStops) connect(stop, exit, stop.visited && wins === 2, sweep);
    previousExit = exit;
    previousOpponent = chosen;
  }
  return { nodes, links, sections };
}

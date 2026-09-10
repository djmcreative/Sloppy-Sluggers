const root = './assets/art/originals/';
const characters = {
  'Dean Kean in game': 'dean-batting',
  'Dean Kean character selection': 'dean-portrait',
  'All Purpose in game': 'captain-batting',
  'All Purpose character selection': 'captain-portrait',
  'Speedster in game': 'speedster-batting',
  'Speedster character selection': 'speedster-portrait',
};
export const art = (name) =>
  characters[name]
    ? `./assets/art/characters/${characters[name]}.png`
    : root + encodeURIComponent(name + '.png');
export const ASSETS = {
  field: art('baseball-bg'),
  dean: art('Dean Kean in game'),
  speed: art('Speedster in game'),
  captain: art('All Purpose in game'),
  starter: art('Enemy'),
  ace: art('Elite'),
  closer: art('Closer'),
};

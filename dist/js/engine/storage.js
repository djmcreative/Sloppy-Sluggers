import { CHARACTERS } from '../data/characters.js';
import { CARDS } from '../data/cards.js';
import { migrateMap } from './map.js';
const KEY = 'sloppy-sluggers-save-v1';
export function saveRun(run) {
  try {
    localStorage.setItem(KEY, JSON.stringify(run));
    return true;
  } catch {
    return false;
  }
}
export function loadRun() {
  try {
    const run = JSON.parse(localStorage.getItem(KEY));
    if (
      !run ||
      run.version !== 1 ||
      !CHARACTERS[run.character] ||
      !Array.isArray(run.deck) ||
      !run.deck.every((c) => CARDS[c.id]) ||
      !Array.isArray(run.map) ||
      run.inning < 1 ||
      run.inning > 9
    )
      return null;
    return migrateMap(run);
  } catch {
    return null;
  }
}
export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* Storage may be disabled. */
  }
}

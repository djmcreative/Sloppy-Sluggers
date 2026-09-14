import { CHARACTERS } from '../data/characters.js';
import { CARDS } from '../data/cards.js';
const KEY = 'sloppy-sluggers-save-v2';
// v1 is intentionally preserved under its old key; its run cannot use these rules.
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
      run.version !== 2 ||
      !CHARACTERS[run.character] ||
      !Array.isArray(run.deck) ||
      !run.deck.every((c) => CARDS[c.id]) ||
      !Array.isArray(run.map) ||
      run.act < 1 ||
      run.act > 3 ||
      run.stage < 1 ||
      run.stage > 3 ||
      !run.series
    )
      return null;
    return run;
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

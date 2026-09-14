// Baseline baseball advancement, shared by both teams.
export function advance(bases, distance, all = true) {
  let runs = 0;
  for (let i = 2; i >= 0; i--) {
    if (!bases[i]) continue;
    const next = i + distance;
    if (next < 3 && bases[next]) continue;
    bases[i] = false;
    if (next >= 3) runs++;
    else bases[next] = true;
    if (!all) break;
  }
  return runs;
}
export function baseHit(bases, distance) {
  const runs = advance(bases, distance);
  if (distance >= 4) return runs + 1;
  bases[distance - 1] = true;
  return runs;
}
export function walk(bases) {
  let runs = 0;
  if (bases[0]) {
    if (bases[1]) {
      if (bases[2]) runs++;
      bases[2] = true;
    }
    bases[1] = true;
  }
  bases[0] = true;
  return runs;
}

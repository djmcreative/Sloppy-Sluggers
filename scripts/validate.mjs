import { readdir, readFile, access } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
async function walk(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = resolve(dir, entry.name);
    if (entry.isDirectory()) result.push(...(await walk(file)));
    else result.push(file);
  }
  return result;
}
const files = await walk(root);
let checked = 0;
for (const file of files) {
  if (extname(file) === '.js') {
    const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(r.stderr);
    const source = await readFile(file, 'utf8');
    for (const m of source.matchAll(/from\s+['"]([^'"]+)['"]/g))
      await access(resolve(file, '..', m[1]));
    checked++;
  }
  if (extname(file) === '.css') {
    const css = await readFile(file, 'utf8');
    for (const match of css.matchAll(/url\(['"]?(\.\.?\/[^)'"\s]+)['"]?\)/g)) {
      await access(resolve(file, '..', decodeURIComponent(match[1])));
    }
  }
}
const html = await readFile(resolve(root, 'index.html'), 'utf8');
for (const m of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g))
  await access(resolve(root, decodeURIComponent(m[1])));
const { CARDS } = await import('../dist/js/data/cards.js');
const { CHARACTERS } = await import('../dist/js/data/characters.js');
const { PITCHERS, PITCHES, RELICS } = await import('../dist/js/data/encounters.js');
const { CARD_ART } = await import('../dist/js/data/card-art.js');
const { art } = await import('../dist/js/data/assets.js');
const images = [
  ...Object.values(CARDS).map((c) => c.icon),
  ...Object.values(CHARACTERS).flatMap((c) => [c.sprite, c.portrait, c.icon]),
  ...PITCHERS.map((p) => p.art),
  ...Object.values(PITCHES).map((p) => p.icon),
  ...Object.values(RELICS).map((r) => r.icon),
  ...Object.values(CARD_ART),
];
for (const name of images) await access(resolve(root, decodeURIComponent(art(name))));
console.log(
  `Validated ${checked} JavaScript modules, entrypoint references, and ${new Set(images).size} referenced artwork files.`,
);

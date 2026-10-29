// A szimulációs modul kanonikus helye a mobil app (`mobile/src/sim`). A szerver
// ugyanazt a kódot futtatja (PRD 13.3); amíg nincs közös csomag, másolatként
// (PRD 13.5: „először másolással”). `--check` módban a CI eltérésnél elbukik.

import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, '..', '..', 'mobile', 'src', 'sim');
const target = join(here, '..', 'src', 'sim');
const check = process.argv.includes('--check');

const isSource = (name) => name.endsWith('.ts') && statSync(join(source, name)).isFile();
const files = readdirSync(source).filter(isSource).sort();
const problems = [];

if (!check) mkdirSync(target, { recursive: true });
for (const name of files) {
  const want = readFileSync(join(source, name), 'utf8');
  let have = null;
  try {
    have = readFileSync(join(target, name), 'utf8');
  } catch {
    have = null;
  }
  if (have === want) continue;
  if (check) problems.push(have === null ? `hiányzik: ${name}` : `eltér: ${name}`);
  else writeFileSync(join(target, name), want);
}

let existing = [];
try {
  existing = readdirSync(target).filter((n) => n.endsWith('.ts'));
} catch {
  existing = [];
}
for (const name of existing) {
  if (files.includes(name)) continue;
  if (check) problems.push(`fölösleges: ${name}`);
  else rmSync(join(target, name));
}

if (problems.length > 0) {
  console.error('A game-api/src/sim nem egyezik a mobile/src/sim tartalmával:');
  for (const p of problems) console.error(`  ${p}`);
  console.error('Javítás: npm run sync-sim');
  process.exit(1);
}
console.log(check ? 'A szimulációs másolat naprakész.' : `Szinkronizálva: ${files.length} fájl.`);

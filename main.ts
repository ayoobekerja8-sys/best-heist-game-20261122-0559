// Packages this make.fun bounty entry into an output directory.
//
// It finds its own folder, reads MAKEFUN_OUTPUT_DIR (default /output), creates that
// directory, copies game/ into it, copies the screenshots into it, and then writes
// dossier.json built by vendor/makefun-game.ts from the copied game/ and screenshots/.
// Node 22 standard library only: no dependencies, no network, no build step.
import { copyFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const SHOT_LIMIT = 4;

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const src = join(from, entry.name);
    const dst = join(to, entry.name);
    if (entry.isDirectory()) copyTree(src, dst);
    else if (entry.isFile()) copyFileSync(src, dst);
  }
}

// The dossier takes at most four renders, the first by name the cover, so hand over the
// first four images by relative path and leave any extra working renders behind.
function copyScreenshots(from, to) {
  const images = [];
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
      if (entry.isDirectory()) walk(join(dir, entry.name), rel);
      else if (entry.isFile() && /\.(png|jpe?g)$/i.test(entry.name)) images.push(rel);
    }
  };
  walk(from, '');
  mkdirSync(to, { recursive: true });
  for (const rel of images.sort().slice(0, SHOT_LIMIT)) {
    const dst = join(to, rel);
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(join(from, rel), dst);
  }
}

const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');
if (!existsSync(gameDir)) throw new Error(`no game/ directory at ${gameDir}`);
if (!existsSync(shotsDir)) throw new Error(`no screenshots/ directory at ${shotsDir}`);

mkdirSync(outputDir, { recursive: true });
copyTree(gameDir, join(outputDir, 'game'));
copyScreenshots(shotsDir, join(outputDir, 'screenshots'));

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
const dossierPath = join(outputDir, 'dossier.json');
writeFileSync(dossierPath, dossier);
console.log(`wrote ${dossierPath} (${dossier.byteLength} bytes) from ${gameDir}`);

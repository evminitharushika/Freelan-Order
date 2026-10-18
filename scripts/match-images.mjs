#!/usr/bin/env node
/**
 * Matches product photos in public/products/items/ to items in src/data/products.json
 * and writes an `image` field (URL path or null) onto every record.
 *
 *   npm run match-images
 *
 * Priority:
 *   1. src/data/image-overrides.json   { "Product name": "filename.jpg" }  (exact product name, case-insensitive)
 *   2. exact slug                       e.g. "turmeric-powder-100g.png" ↔ "Turmeric powder" 100g
 *   3. slug without weight / suffixes   e.g. "Turmeric Powder.jpg"      ↔ "Turmeric powder" (all sizes)
 *   4. fuzzy (Levenshtein ratio or token overlap) ≥ THRESHOLD
 * Matching is done per product NAME, so one image serves every size of that product.
 * Anything below the threshold is reported as "needs manual match" and never guessed.
 */
import sharp from 'sharp';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const DIR = 'public/products/items';
const URL_BASE = '/products/items';
const PRODUCTS = 'src/data/products.json';
const OVERRIDES = 'src/data/image-overrides.json';
const REPORT = 'scripts/image-report.txt';
const THRESHOLD = 0.85;
const LARGE_KB = 300;
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg']);

const TYPOS = [
  [/\bcorriander\b|\bcorriender\b/g, 'coriander'],
  [/\bappertizers?\b/g, 'appetizers'],
  [/\bcordamom\b/g, 'cardamom'],
  [/\bbarly\b/g, 'barley'],
  [/\bpumking\b/g, 'pumpkin'],
];
const WEIGHT = /\b\d+(?:\.\d+)?\s*(?:kg|g|ml|l)\b/g;
const SUFFIXES = /\b(?:-\s*)?(?:bottles?|canisters?|unprinted\s+pouch|printed\s+pouch|standup\s+pouch|pouch|box|cup)\b/g;

/** Light normalisation: case, typos, separators. Keeps weights. */
function slugLight(s) {
  let t = String(s).toLowerCase().trim();
  for (const [re, to] of TYPOS) t = t.replace(re, to);
  return t
    .replace(/&/g, ' and ')
    .replace(/[\s_.,()/]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Full normalisation: also strips weights and pack-type suffixes. */
function slugCore(s) {
  let t = String(s).toLowerCase().trim();
  for (const [re, to] of TYPOS) t = t.replace(re, to);
  t = t.replace(WEIGHT, ' ').replace(SUFFIXES, ' ').replace(/\s+/g, ' ');
  return slugLight(t);
}

function levenshteinRatio(a, b) {
  if (!a.length || !b.length) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return 1 - prev[b.length] / Math.max(a.length, b.length);
}

function tokenOverlap(a, b) {
  const A = new Set(a.split('-').filter(Boolean));
  const B = new Set(b.split('-').filter(Boolean));
  if (!A.size || !B.size) return 0;
  let common = 0;
  for (const t of A) if (B.has(t)) common++;
  return (2 * common) / (A.size + B.size); // Dice coefficient
}

const similarity = (a, b) => Math.max(levenshteinRatio(a, b), tokenOverlap(a, b));

/* ------------------------------------------------------------------ inputs */

const products = JSON.parse(readFileSync(PRODUCTS, 'utf8'));
const overrides = existsSync(OVERRIDES) ? JSON.parse(readFileSync(OVERRIDES, 'utf8')) : {};
const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => IMAGE_EXT.has(extname(f).toLowerCase()) && statSync(join(DIR, f)).isFile()) : [];

const images = [];
for (const file of files) {
  const path = join(DIR, file);
  const sizeKB = statSync(path).size / 1024;
  let width = null;
  let height = null;
  try {
    const meta = await sharp(path).metadata();
    width = meta.width ?? null;
    height = meta.height ?? null;
  } catch {
    /* unreadable image: still listed */
  }
  const base = file.slice(0, -extname(file).length);
  images.push({ file, ext: extname(file).toLowerCase(), width, height, sizeKB, light: slugLight(base), core: slugCore(base) });
}

/* Unique product names (matching is per name, not per size). */
const names = new Map(); // lower name -> { name, light, core, weights:Set, ids:[] }
for (const p of products) {
  const key = p.name.toLowerCase();
  if (!names.has(key)) names.set(key, { name: p.name, light: slugLight(p.name), core: slugCore(p.name), lightWithWeights: new Set(), ids: [] });
  const n = names.get(key);
  n.ids.push(p.id);
  n.lightWithWeights.add(slugLight(`${p.name} ${p.weight}`));
}

/* ------------------------------------------------------------------ matching */

const assignment = new Map(); // lower name -> { file, method, score }
const overrideErrors = [];

for (const [name, file] of Object.entries(overrides)) {
  if (name.startsWith('_')) continue; // allow "_comment" keys
  const key = name.trim().toLowerCase();
  if (!names.has(key)) overrideErrors.push(`Override product not found: "${name}"`);
  else if (!files.includes(file)) overrideErrors.push(`Override file not found in ${DIR}: "${file}" (for "${name}")`);
  else assignment.set(key, { file, method: 'override', score: 1 });
}

const needsManual = [];
for (const img of images) {
  let best = null;
  for (const [key, n] of names) {
    let method = null;
    let score = 0;
    if (n.lightWithWeights.has(img.light) || n.light === img.light) [method, score] = ['exact slug', 1];
    else if (n.core && n.core === img.core) [method, score] = ['slug without weight', 1];
    else {
      score = similarity(img.core, n.core);
      method = 'fuzzy';
    }
    if (!best || score > best.score || (score === best.score && method !== 'fuzzy' && best.method === 'fuzzy')) best = { key, method, score };
    // Exact/no-weight matches can legitimately cover several product names (e.g. "Pepper Powder" and "Pepper Powder -Canisters").
    if (method !== 'fuzzy' && !assignment.has(key)) assignment.set(key, { file: img.file, method, score });
  }
  if (best && best.method === 'fuzzy') {
    if (best.score >= THRESHOLD && !assignment.has(best.key)) assignment.set(best.key, { file: img.file, method: 'fuzzy', score: best.score });
    else if (best.score < THRESHOLD) needsManual.push({ file: img.file, candidate: names.get(best.key).name, score: best.score });
  }
}

/* ------------------------------------------------------------------ output */

for (const p of products) {
  const a = assignment.get(p.name.toLowerCase());
  p.image = a ? `${URL_BASE}/${a.file}` : null;
}
writeFileSync(PRODUCTS, JSON.stringify(products, null, 2) + '\n');

const usedFiles = new Set([...assignment.values()].map((a) => a.file));
const matchedItems = products.filter((p) => p.image).length;
const unmatchedNames = [...names.values()].filter((n) => !assignment.has(n.name.toLowerCase()));
const pct = (n, d) => (d ? ((100 * n) / d).toFixed(1) : '0.0');

const lines = [];
lines.push(`Image match report  ·  ${new Date().toISOString()}`);
lines.push('='.repeat(72));
lines.push('');
lines.push(`Files in ${DIR}: ${images.length}`);
for (const i of images) {
  lines.push(`  ${i.file}  ${i.ext}  ${i.width ?? '?'}×${i.height ?? '?'}  ${i.sizeKB.toFixed(0)} KB${i.sizeKB > LARGE_KB ? `  ⚠ over ${LARGE_KB} KB` : ''}`);
}
lines.push('');
lines.push(`Items with an image:     ${matchedItems} / ${products.length} (${pct(matchedItems, products.length)}%)`);
lines.push(`Product names matched:   ${assignment.size} / ${names.size} (${pct(assignment.size, names.size)}%)`);
lines.push(`Items without an image:  ${products.length - matchedItems} (${pct(products.length - matchedItems, products.length)}%)`);
lines.push('');
lines.push('Matches:');
if (!assignment.size) lines.push('  (none)');
for (const [key, a] of assignment) lines.push(`  ${names.get(key).name}  ←  ${a.file}  [${a.method}${a.method === 'fuzzy' ? ` ${a.score.toFixed(2)}` : ''}]`);
lines.push('');
lines.push(`Needs manual match (best candidate below ${THRESHOLD}; add to ${OVERRIDES}):`);
if (!needsManual.length) lines.push('  (none)');
for (const m of needsManual) lines.push(`  ${m.file}  →  closest "${m.candidate}" (score ${m.score.toFixed(2)})`);
lines.push('');
lines.push('Unused image files (no product):');
const unused = images.filter((i) => !usedFiles.has(i.file));
if (!unused.length) lines.push('  (none)');
for (const i of unused) lines.push(`  ${i.file}`);
if (overrideErrors.length) {
  lines.push('');
  lines.push('Override problems:');
  for (const e of overrideErrors) lines.push(`  ${e}`);
}
lines.push('');
lines.push(`Product names without an image (${unmatchedNames.length}):`);
for (const n of unmatchedNames) lines.push(`  ${n.name}  (NO. ${n.ids.join(', ')})`);

const report = lines.join('\n') + '\n';
writeFileSync(REPORT, report);
console.log(report);

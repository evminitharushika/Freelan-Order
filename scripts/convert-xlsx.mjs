#!/usr/bin/env node
/**
 * Converts the Freelan order form workbook into src/data/products.json.
 *
 *   npm run convert                       # uses ./order-form.xlsx
 *   npm run convert -- path/to/file.xlsx  # custom workbook
 *
 * Sheet layout ("OIF 09.17 Update"):
 *   Row 4 = header. Category rows have a name in column B and no NO./Weight.
 *   D..I  = pack type columns; exactly one holds packets-per-box, the rest "X".
 *   J     = CBM per box (may be a formula such as =(14.5*36.5*21.5)/1000000).
 *   N     = kg per packet ("Column1").
 *   K, L, M, O are order formulas and are ignored (the app recomputes them).
 */
import ExcelJS from 'exceljs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SHEET = 'OIF 09.17 Update';
const HEADER_ROW = 4;
const input = resolve(process.argv[2] ?? 'order-form.xlsx');
const output = resolve('src/data/products.json');

const PACK_COLUMNS = [
  { col: 4, type: 'Printed Pouch' },
  { col: 5, type: 'Unprinted Pouch' },
  { col: 6, type: 'Standup Pouch' },
  { col: 7, type: 'Bottle/Canister' },
  { col: 8, type: 'Box' },
  { col: 9, type: 'Cup' },
];

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

const slugify = (s) =>
  clean(s)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Safe evaluator for simple arithmetic formulas: numbers, + - * / and parentheses only. */
function evalArithmetic(expr) {
  const src = String(expr).replace(/^=/, '').replace(/\s+/g, '');
  if (!/^[\d.+\-*/()]+$/.test(src)) return null;
  let i = 0;
  const peek = () => src[i];
  const number = () => {
    const m = /^\d*\.?\d+(?:e[+-]?\d+)?/i.exec(src.slice(i));
    if (!m) throw new Error(`Bad number in ${src}`);
    i += m[0].length;
    return parseFloat(m[0]);
  };
  const factor = () => {
    if (peek() === '-') { i++; return -factor(); }
    if (peek() === '+') { i++; return factor(); }
    if (peek() === '(') { i++; const v = expression(); if (src[i++] !== ')') throw new Error('Missing )'); return v; }
    return number();
  };
  const term = () => {
    let v = factor();
    while (peek() === '*' || peek() === '/') { const op = src[i++]; const r = factor(); v = op === '*' ? v * r : v / r; }
    return v;
  };
  const expression = () => {
    let v = term();
    while (peek() === '+' || peek() === '-') { const op = src[i++]; const r = term(); v = op === '+' ? v + r : v - r; }
    return v;
  };
  try {
    const v = expression();
    return i === src.length && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

/** Normalises an ExcelJS cell value to a primitive. */
function raw(cell) {
  const v = cell.value;
  if (v == null) return null;
  if (typeof v !== 'object') return v;
  if (v instanceof Date) return v.toISOString();
  if ('richText' in v) return v.richText.map((t) => t.text).join('');
  if ('formula' in v || 'sharedFormula' in v) {
    if (typeof v.result === 'number') return v.result;
    if (v.formula) return evalArithmetic(v.formula);
    return null;
  }
  if ('text' in v) return v.text;
  if ('result' in v) return v.result;
  return null;
}

function num(cell) {
  const v = raw(cell);
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t || /^x$/i.test(t)) return null;
    if (t.startsWith('=')) return evalArithmetic(t);
    const n = Number(t.replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Fallback when column N is empty: derive kg from a weight label like "250g", "2.5kg", "350ml". */
function kgFromWeight(weight) {
  const m = /^([\d.]+)\s*(kg|g|ml|l)?$/i.exec(weight);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const unit = (m[2] ?? 'g').toLowerCase();
  if (unit === 'kg' || unit === 'l') return n;
  return n / 1000;
}

const round = (n, dp = 6) => Math.round(n * 10 ** dp) / 10 ** dp;

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(input);
const ws = wb.getWorksheet(SHEET);
if (!ws) {
  console.error(`Sheet "${SHEET}" not found. Sheets: ${wb.worksheets.map((w) => w.name).join(', ')}`);
  process.exit(1);
}

const products = [];
const warnings = [];
let category = 'Uncategorised';

for (let r = HEADER_ROW + 1; r <= ws.rowCount; r++) {
  const row = ws.getRow(r);
  const no = num(row.getCell(1));
  const name = clean(raw(row.getCell(2)));
  const weight = clean(raw(row.getCell(3)));

  if (no == null) {
    // Category header: name in B, no NO., no weight. Skip "Update :-..." footer notes.
    if (name && !weight && !/^update\b/i.test(name)) category = name;
    continue;
  }
  if (!name) {
    warnings.push(`Row ${r}: NO. ${no} has no item name — skipped`);
    continue;
  }

  const packs = PACK_COLUMNS.map((p) => ({ ...p, value: num(row.getCell(p.col)) })).filter((p) => p.value != null && p.value > 0);
  if (packs.length !== 1) {
    warnings.push(`Row ${r}: NO. ${no} "${name} ${weight}" has ${packs.length} pack-type values${packs.length ? ` (${packs.map((p) => p.type).join(', ')}) — using first` : ' — packType/packetsPerBox left null'}`);
  }
  const pack = packs[0] ?? null;

  const cbmPerBox = num(row.getCell(10));
  if (cbmPerBox == null) warnings.push(`Row ${r}: NO. ${no} "${name} ${weight}" has no CBM per box`);

  let kgPerPacket = num(row.getCell(14));
  if (kgPerPacket == null) {
    kgPerPacket = kgFromWeight(weight);
    warnings.push(`Row ${r}: NO. ${no} "${name} ${weight}" has no kg/packet — ${kgPerPacket != null ? `derived ${kgPerPacket} from weight` : 'left null'}`);
  }

  const id = Math.round(no);
  products.push({
    id,
    category,
    name,
    weight,
    packType: pack?.type ?? null,
    packetsPerBox: pack?.value ?? null,
    cbmPerBox: cbmPerBox == null ? null : round(cbmPerBox),
    kgPerPacket: kgPerPacket == null ? null : round(kgPerPacket),
    slug: slugify(`${name}-${weight}${pack ? `-${pack.type}` : ''}-${id}`),
  });
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, JSON.stringify(products, null, 2) + '\n');

const counts = products.reduce((acc, p) => ((acc[p.category] = (acc[p.category] ?? 0) + 1), acc), {});
console.log(`\nWrote ${products.length} items to ${output}\n`);
console.table(Object.entries(counts).map(([Category, Items]) => ({ Category, Items })));
const ids = products.map((p) => p.id);
const missing = [];
for (let i = 1; i <= Math.max(...ids); i++) if (!ids.includes(i)) missing.push(i);
if (missing.length) console.log(`Missing NO.s: ${missing.join(', ')}`);
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log('  - ' + w);
}

/**
 * One-shot codemod: v2 palette/type → v3.
 *
 * Rewrites the mechanical parts of the polish brief §1 and §2 across every
 * consumer — palette keys, the two font stacks collapsing into one, oversized
 * letter-spacing, and stray uppercase. The screens the brief calls out by name
 * (day list, banners, gap alert, Charts) are then done by hand.
 *
 * Kept in the repo as the record of what was changed en masse. Run once.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'src';
const SKIP = new Set(['tokens.js']);

/** Old palette key → new. Order matters: longest keys first. */
const COLOUR = [
  ['C.amberDim', 'C3.amberWarm'],
  ['C.cardHi', 'C3.raise2'],
  ['C.warnDim', 'C3.warnFaint'],
  ['C.success', 'C3.pr'],
  ['C.border', 'C3.line2'],
  ['C.navBg', 'C3.raise'],
  ['C.amber', 'C3.amber'],
  ['C.muted', 'C3.soft'],
  ['C.card', 'C3.raise2'],
  ['C.text', 'C3.text'],
  ['C.warn', 'C3.warn'],
  ['C.user', 'C3.you'],
  ['C.dim', 'C3.muted'],
  ['C.bg', 'C3.bg'],
  ['C.vs', 'C3.crew'],
  // config/constants aliases
  ['COLORS.', 'C3.'],
  ['CARD_DEPTH', 'INNER_HIGHLIGHT'],
];

/** Every literal hex the old palette used, in case one was inlined. */
const HEX = [
  ['#0a0a0f', 'C3.bg'],
  ['#141422', 'C3.raise2'],
  ['#1a1a2e', 'C3.raise2'],
  ['#2a2a3e', 'C3.line2'],
  ['#0f0f18', 'C3.raise'],
  ['#f5f5f5', 'C3.text'],
  ['#9ca3af', 'C3.soft'],
  ['#6b7280', 'C3.muted'],
  ['#3b82f6', 'C3.you'],
  ['#14b8a6', 'C3.crew'],
  ['#22c55e', 'C3.pr'],
  ['#d97706', 'C3.amber'],
  ['#f43f5e', 'C3.warn'],
];

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(jsx?|mjs)$/.test(entry) && !SKIP.has(entry)) files.push(p);
  }
})(ROOT);

let touched = 0;
for (const file of files) {
  const before = readFileSync(file, 'utf8');
  let s = before;

  // ── Palette ──
  for (const [from, to] of COLOUR) {
    s = s.replaceAll(new RegExp(`\\b${from.replace('.', '\\.')}(?![\\w])`, 'g'), to);
  }
  for (const [hex, token] of HEX) {
    // Only inside a JS string, e.g. background: '#0a0a0f'
    s = s.replaceAll(new RegExp(`(['"\`])${hex}\\1`, 'gi'), token);
  }

  // ── One font family ──
  s = s.replaceAll(/\bfontFamily:\s*SERIF\b/g, 'fontFamily: FONTS.sans');
  s = s.replaceAll(/\bFONTS\.serif\b/g, 'FONTS.sans');
  s = s.replaceAll(/\bFONTS\.mono\b/g, 'FONTS.sans');
  s = s.replaceAll(/\bSERIF\b(?!\s*[:=])/g, 'FONTS.sans');
  // Inlined Georgia stacks
  s = s.replaceAll(/["']Georgia['"],\s*['"]Times New Roman['"],\s*serif["']?/g, 'FONTS.sans');
  s = s.replaceAll(/Georgia,\s*'Times New Roman',\s*serif/g, '${FONTS.sans}');
  // Inlined monospace stacks
  s = s.replaceAll(/ui-monospace[^"'`]*monospace/g, '${FONTS.sans}');

  // ── Letter-spacing never above 1.2 ──
  s = s.replaceAll(/letterSpacing:\s*(\d+(?:\.\d+)?)/g, (m, n) =>
    `letterSpacing: ${Math.min(parseFloat(n), 1.2)}`);
  s = s.replaceAll(/letterSpacing:\s*['"](\d+(?:\.\d+)?)px['"]/g, (m, n) =>
    `letterSpacing: ${Math.min(parseFloat(n), 1.2)}`);

  // ── Radius: every box is 4 ──
  s = s.replaceAll(/borderRadius:\s*(?:6|8|10|12|14|16|20|24)\b/g, 'borderRadius: C3.radius');

  // ── Imports ──
  if (/\bC3\.|INNER_HIGHLIGHT|FONTS\./.test(s)) {
    // Drop the old names from any design/constants import and add the new ones.
    s = s.replace(
      /import\s*\{([^}]*)\}\s*from\s*(['"])([^'"]*(?:design|config\/constants))\2;?/g,
      (full, names, q, from) => {
        const kept = names
          .split(',')
          .map((n) => n.trim())
          .filter(Boolean)
          .filter((n) => !['C', 'COLORS', 'SERIF', 'CARD_DEPTH'].includes(n));
        const want = ['C3', 'FONTS', 'INNER_HIGHLIGHT', 'TYPE', 'TABULAR']
          .filter((t) => new RegExp(`\\b${t}\\b`).test(s) && !kept.includes(t));
        // constants no longer holds any of this — point everything at design.
        const target = from.includes('config/constants')
          ? from.replace(/config\/constants/, 'design').replace(/\/design$/, '/design')
          : from;
        const all = [...new Set([...want, ...kept])].sort();
        return all.length ? `import { ${all.join(', ')} } from ${q}${target}${q};` : '';
      },
    );
  }

  if (s !== before) {
    writeFileSync(file, s);
    touched += 1;
    console.log('  rewrote', file);
  }
}
console.log(`\n${touched} file(s) rewritten of ${files.length} scanned`);

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The black-screen guard.
 *
 * A design-system name used in a file that never imports it is a ReferenceError
 * at render time. React unmounts the whole tree, and because the page is already
 * near-black you get a black screen with nothing in the UI to tell you why.
 * That is exactly what shipped when SplashScreen used FONTS.sans with only C3
 * imported — at the app root, so every load died.
 *
 * Vite doesn't catch it (a bare identifier is legal until it runs) and the tests
 * didn't render those components. So this walks the source instead.
 */

const SRC = path.resolve(__dirname, '..');
const DESIGN = path.join(SRC, 'design');

function walk(dir, skipDesign = false) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skipDesign && entry.name === 'design') continue;
      out.push(...walk(full, skipDesign));
    } else if (/\.jsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Every name the design system exports. */
function designExports() {
  const names = new Set();
  for (const file of walk(DESIGN)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(/export\s+(?:const|function|let|class)\s+([A-Za-z0-9_$]+)/g)) {
      names.add(m[1]);
    }
  }
  return names;
}

/** Strip comments and string/template literals so prose can't trip the check. */
function code(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, '``');
}

const WORD = /[A-Za-z0-9_$]/;
// Characters that can sit in front of an identifier in an expression. Prose in
// a JSX text node is preceded by a letter instead, which is how "Add to Home
// Screen" stays out of this.
const OPENER = /[:,;({[=&|?!+\-*/%<\n]/;

/** True if `name` is used as a value in `text`, not just present in it. */
function usesIdentifier(text, name) {
  let i = 0;
  while ((i = text.indexOf(name, i)) !== -1) {
    const before = text[i - 1];
    const after = text[i + name.length];
    const wholeWord = !(before && WORD.test(before)) && !(after && WORD.test(after));
    if (wholeWord) {
      const member = after === '.' || after === '(' || after === '[';
      const prev = text.slice(0, i).replace(/[ \t]+$/, '').slice(-1);
      if (member || prev === '' || OPENER.test(prev)) return true;
    }
    i += name.length;
  }
  return false;
}

function boundNames(text) {
  const bound = new Set();
  for (const m of text.matchAll(/import\s+([\s\S]*?)\s+from\s+['"][^'"]+['"]/g)) {
    for (const n of m[1].matchAll(/[A-Za-z0-9_$]+/g)) bound.add(n[0]);
  }
  for (const m of text.matchAll(/(?:const|let|var|function|class)\s+([A-Za-z0-9_$]+)/g)) {
    bound.add(m[1]);
  }
  return bound;
}

describe('design-system imports', () => {
  it('never uses a design token or component without importing it', () => {
    const names = designExports();
    expect(names.size).toBeGreaterThan(10); // the scan itself still works

    const offences = [];
    for (const file of walk(SRC, true)) {
      const text = fs.readFileSync(file, 'utf8');
      const bound = boundNames(text);
      const body = code(text.replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, ' '));
      for (const name of names) {
        if (bound.has(name)) continue;
        if (usesIdentifier(body, name)) {
          offences.push(`${path.relative(SRC, file)} uses ${name} without importing it`);
        }
      }
    }

    expect(offences).toEqual([]);
  });
});

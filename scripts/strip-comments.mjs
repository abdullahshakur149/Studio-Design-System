import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import stripComments from 'strip-comments';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const INCLUDE_DIRS = ['src', 'supabase/functions'];
const ALSO_INCLUDE_FILES = ['vite.config.ts', 'tailwind.config.ts'];
const CSS_DIRS = ['src/styles'];

const SKIP_FILES = new Set([
  path.join(ROOT, 'src/types/database.ts'),
  path.join(ROOT, 'supabase/functions/_shared/templates.ts'),
]);

const EXT_TS = new Set(['.ts', '.tsx', '.js', '.mjs']);

function walk(dir, exts, out) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, exts, out);
    else if (exts.has(path.extname(entry.name))) out.push(full);
  }
}

function tidy(content) {
  let out = content;
  out = out.replace(/^[ \t]+$/gm, '');
  out = out.replace(/\n{3,}/g, '\n\n');
  out = out.replace(/^\s*\n+/, '');
  if (!out.endsWith('\n')) out += '\n';
  return out;
}

function stripCss(content) {
  return content.replace(/\/\*[\s\S]*?\*\//g, '');
}

const tsFiles = [];
for (const d of INCLUDE_DIRS) walk(path.join(ROOT, d), EXT_TS, tsFiles);
for (const f of ALSO_INCLUDE_FILES) tsFiles.push(path.join(ROOT, f));

const cssFiles = [];
for (const d of CSS_DIRS) walk(path.join(ROOT, d), new Set(['.css']), cssFiles);

let touched = 0;
let skipped = 0;

for (const f of tsFiles) {
  if (SKIP_FILES.has(f)) {
    skipped++;
    continue;
  }
  const content = fs.readFileSync(f, 'utf8');
  const stripped = tidy(stripComments(content, { preserve: false }));
  if (stripped !== content) {
    fs.writeFileSync(f, stripped);
    touched++;
  }
}

for (const f of cssFiles) {
  const content = fs.readFileSync(f, 'utf8');
  const stripped = tidy(stripCss(content));
  if (stripped !== content) {
    fs.writeFileSync(f, stripped);
    touched++;
  }
}

console.log(`Stripped ${touched} files. Skipped ${skipped} auto-generated.`);

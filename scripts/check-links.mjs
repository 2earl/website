// Fails if any internal link or asset in public/*.html points to a file that does not exist.
// Uses Node built-ins only.
import { readdir, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const root = 'public';
const pages = (await readdir(root)).filter((f) => f.endsWith('.html'));
const pattern = /(?:href|src)="(\/[^"#?]*)/g;
const missing = [];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

for (const page of pages) {
  const html = await readFile(join(root, page), 'utf8');
  for (const [, target] of html.matchAll(pattern)) {
    const candidates =
      target === '/'
        ? [join(root, 'index.html')]
        : [join(root, target), join(root, `${target}.html`), join(root, target, 'index.html')];
    let found = false;
    for (const c of candidates) {
      if (await exists(c)) {
        found = true;
        break;
      }
    }
    if (!found) missing.push(`${page}: ${target}`);
  }
}

if (missing.length > 0) {
  console.error(`Broken internal links:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}
console.log(`Checked internal links in ${pages.length} pages: all resolve.`);

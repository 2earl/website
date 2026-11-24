// Builds the site's pages into public/ from src/: one page per language and page, each linked to
// its translations (hreflang, canonical, Open Graph locale, a language switcher), and
// public/sitemap.xml listing every indexable page with its translations.
//
//   node scripts/build.mjs          write public/
//   node scripts/build.mjs --check  fail if public/ isn't what src/ builds (run by `pnpm lint`)
//
// Uses Node built-ins and Prettier (so the output matches `prettier --check`).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { FOOTER, LOCALES, ORIGIN, PAGES } from '../src/site.mjs';

const check = process.argv.includes('--check');
const DEFAULT = LOCALES[0];
const layout = await readFile('src/layout.html', 'utf8');
const prettierConfig = (await resolveConfig('public/index.html')) ?? {};

const escape = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The path a page has in a language: /, /privacy, /tr, /tr/privacy. */
function pathOf(locale, page) {
  const prefix = locale.code === DEFAULT.code ? '' : `/${locale.code}`;
  if (page === 'index') return prefix || '/';
  return `${prefix}/${page}`;
}

/** Where the page's file goes under public/. */
function fileOf(locale, page) {
  const dir = locale.code === DEFAULT.code ? 'public' : join('public', locale.code);
  return join(dir, `${page}.html`);
}

function parse(source, where) {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source);
  if (!match) throw new Error(`${where}: no front matter`);
  const meta = {};
  for (const line of match[1].split('\n')) {
    const at = line.indexOf(':');
    if (at < 0) throw new Error(`${where}: bad front matter line “${line}”`);
    meta[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  for (const key of ['title', 'description', 'main']) {
    if (!meta[key]) throw new Error(`${where}: front matter needs ${key}`);
  }
  return { meta, content: match[2].trimEnd() };
}

/** Links to pages of the site point at the same language's page. */
function localiseLinks(content, locale) {
  if (locale.code === DEFAULT.code) return content;
  return content.replace(/href="\/([a-z0-9-]*)(#[^"]*)?"/g, (whole, page, hash = '') => {
    const name = page === '' ? 'index' : page;
    if (!PAGES.includes(name)) return whole;
    return `href="${pathOf(locale, name)}${hash}"`;
  });
}

function jsonLd(locale, page, meta) {
  if (page !== 'index') return '';
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${ORIGIN}/#organization`,
        name: '2earl',
        url: `${ORIGIN}/`,
        logo: `${ORIGIN}/favicon.svg`,
        email: 'legal@2earl.com',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Westfälische Straße 21',
          postalCode: '10709',
          addressLocality: 'Berlin',
          addressCountry: 'DE',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${ORIGIN}/#website`,
        url: `${ORIGIN}/`,
        name: '2earl',
        description: meta.description,
        inLanguage: LOCALES.map((l) => l.code),
        publisher: { '@id': `${ORIGIN}/#organization` },
      },
    ],
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function seo(locale, page, meta) {
  if (meta.noindex === 'true') return '<meta name="robots" content="noindex" />';
  const url = `${ORIGIN}${pathOf(locale, page)}`;
  const lines = [
    `<link rel="canonical" href="${url}" />`,
    ...LOCALES.map(
      (l) => `<link rel="alternate" hreflang="${l.code}" href="${ORIGIN}${pathOf(l, page)}" />`,
    ),
    `<link rel="alternate" hreflang="x-default" href="${ORIGIN}${pathOf(DEFAULT, page)}" />`,
    '<meta property="og:site_name" content="2earl" />',
    '<meta property="og:type" content="website" />',
    `<meta property="og:title" content="${escape(meta.title)}" />`,
    `<meta property="og:description" content="${escape(meta.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:locale" content="${locale.ogLocale}" />`,
    ...LOCALES.filter((l) => l !== locale).map(
      (l) => `<meta property="og:locale:alternate" content="${l.ogLocale}" />`,
    ),
    '<meta name="twitter:card" content="summary" />',
  ];
  return lines.join('\n');
}

function languages(locale, page) {
  const links = LOCALES.map((l) =>
    l === locale
      ? `<a href="${pathOf(l, page)}" lang="${l.code}" aria-current="true">${l.name}</a>`
      : `<a href="${pathOf(l, page)}" hreflang="${l.code}" lang="${l.code}">${l.name}</a>`,
  );
  return `<nav class="languages" aria-label="${locale.words.language}">${links.join('')}</nav>`;
}

function footer(locale, page) {
  return FOOTER.map(
    (p) =>
      `<a href="${pathOf(locale, p)}"${p === page ? ' aria-current="page"' : ''}>${locale.words[p]}</a>`,
  ).join('');
}

const fill = (template, values) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`layout: no value for {{${key}}}`);
    return values[key];
  });

const outputs = new Map();
const sitemap = [];

for (const page of PAGES) {
  const sources = {};
  for (const locale of LOCALES) {
    const where = `src/pages/${locale.code}/${page}.html`;
    let source;
    try {
      source = await readFile(where, 'utf8');
    } catch {
      throw new Error(`${where} is missing: every page needs every language`);
    }
    sources[locale.code] = parse(source, where);
  }

  for (const locale of LOCALES) {
    const { meta, content } = sources[locale.code];
    const html = fill(layout, {
      lang: locale.code,
      title: escape(meta.title),
      description: escape(meta.description),
      seo: seo(locale, page, meta),
      jsonld: jsonLd(locale, page, meta),
      home: pathOf(locale, 'index'),
      section: meta.section ? `<span class="brand-sub">${locale.words[meta.section]}</span>` : '',
      languages: languages(locale, page),
      login: locale.login,
      signIn: locale.words.signIn,
      main: meta.main,
      content: localiseLinks(content, locale),
      legalNav: locale.words.legalNav,
      footer: footer(locale, page),
    });
    outputs.set(fileOf(locale, page), await format(html, { ...prettierConfig, parser: 'html' }));
  }

  const meta = sources[DEFAULT.code].meta;
  if (meta.noindex === 'true') continue;
  for (const locale of LOCALES) {
    const updated = sources[locale.code].meta.updated ?? meta.updated;
    sitemap.push(
      '  <url>\n' +
        `    <loc>${ORIGIN}${pathOf(locale, page)}</loc>\n` +
        (updated ? `    <lastmod>${updated}</lastmod>\n` : '') +
        LOCALES.map(
          (l) =>
            `    <xhtml:link rel="alternate" hreflang="${l.code}" href="${ORIGIN}${pathOf(l, page)}" />\n`,
        ).join('') +
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${pathOf(DEFAULT, page)}" />\n` +
        '  </url>\n',
    );
  }
}

outputs.set(
  join('public', 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    sitemap.join('') +
    '</urlset>\n',
);

const stale = [];
for (const [file, text] of outputs) {
  if (check) {
    const current = await readFile(file, 'utf8').catch(() => null);
    if (current !== text) stale.push(file);
  } else {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, text);
  }
}
if (stale.length > 0) {
  console.error(`Out of date, run \`pnpm build:pages\`:\n  ${stale.join('\n  ')}`);
  process.exit(1);
}
console.log(
  `${check ? 'Checked' : 'Built'} ${outputs.size - 1} pages in ${LOCALES.length} languages and the sitemap.`,
);

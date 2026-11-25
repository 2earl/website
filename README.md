# website

The public site at [2earl.com](https://2earl.com): start page, privacy policy, terms of service and
imprint for all 2earl services, including the 2earl account at
[login.2earl.com](https://github.com/2earl/login).

Static files only (`public/`), served by Cloudflare Workers static assets. No cookies, no scripts,
no analytics. The pages are built from `src/` in every language (English at `/`, Turkish at
`/tr/`); 2earl.com is the only 2earl site meant to be found by search engines.

## Development

Requires Node.js 24 and pnpm.

```sh
pnpm install
pnpm dev     # local preview on http://localhost:8787
pnpm build:pages  # build public/ (pages in every language, sitemap.xml) from src/
pnpm lint    # pages up to date, HTML validation, formatting, internal link check
```

## Pages and languages

- `src/pages/<language>/<page>.html`: front matter (`title`, `description`, `main`, optional
  `section`, `updated`, `noindex`) and the page's content. Link to pages as `/privacy`; the build
  points Turkish pages at `/tr/privacy`.
- `src/layout.html`: the frame around every page. `src/site.mjs`: languages, header and footer
  words, the page list.
- The build adds, per page: `<html lang>`, the canonical address, `hreflang` links to every
  translation and `x-default` (English), Open Graph locales, the language switcher, and
  `public/sitemap.xml` with every translation. Edit `src/`, never the generated `public/*.html`.

**Adding a language:** add it to `LOCALES` in `src/site.mjs`, copy `src/pages/en/` to
`src/pages/<code>/`, translate, add a 1200×630 preview image `public/og-<code>.png`,
`pnpm build:pages`. Lint fails while a page is missing.

Response headers (CSP and others) are in `public/_headers`. HSTS is set for the whole zone in
`2earl/login` `infra/zone.tf`.

## Deploying

Merges to `main` run the `deploy` workflow, which waits for owner approval, deploys, and then
checks that every page responds. Wrangler attaches the `2earl.com` custom domain itself.

## Legal texts

The privacy policy, terms and imprint must match how the services actually work. When a service
changes how it handles data, update `src/pages/*/privacy.html` (every language) in the same change
and bump its "Last updated" date and `updated`. The English text prevails; translations say so.

## License

Proprietary. All rights reserved; see [LICENSE](LICENSE).

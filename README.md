# website

The public site at [2earl.com](https://2earl.com): start page, privacy policy, terms of service and
imprint for all 2earl services, including the 2earl account at
[login.2earl.com](https://github.com/2earl/login).

Static files only (`public/`), served by Cloudflare Workers static assets. No cookies, no scripts,
no analytics.

## Development

Requires Node.js 24 and pnpm.

```sh
pnpm install
pnpm dev     # local preview on http://localhost:8787
pnpm lint    # HTML validation, formatting, internal link check
```

Response headers (CSP and others) are in `public/_headers`. HSTS is set for the whole zone in
`2earl/login` `infra/zone.tf`.

## Deploying

Merges to `main` run the `deploy` workflow, which waits for owner approval, deploys, and then
checks that every page responds. Wrangler attaches the `2earl.com` custom domain itself.

## Legal texts

The privacy policy, terms and imprint must match how the services actually work. When a service
changes how it handles data, update `public/privacy.html` in the same change and bump its
"Last updated" date.

## License

[AGPL-3.0](LICENSE)

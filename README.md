# Sphericon website

The marketing site at <https://getsphericon.com>. Built with [Astro](https://astro.build) and
Tailwind, hosted on GitHub Pages, with the product documentation at <https://getsphericon.com/docs>
(Starlight).

## Editing content (no code)

Blog posts are Markdown files in `src/content/blog/`. Edit them in the browser with
[Pages CMS](https://pagescms.org) (sign in with GitHub, choose this repository), or directly on
GitHub (open a file, press the pencil icon).

1. Make your change on a branch and open a pull request.
2. CI builds the site; a red check means something is broken, so ask a developer.
3. Merge to `main`. The site deploys in about a minute.

A post with `draft: true` is not published.

## Documentation

The pages are Markdown files in `src/content/docs/docs/`, edited like blog posts (Pages CMS, collection
Documentation) and published on the site's own cycle. The sidebar is in `astro.config.ts`. The API
reference is generated from the app's OpenAPI documents, which `pnpm build` fetches at the commit
pinned in `docs-source.json` into `src/generated/` (not committed): move the pin to the new release
tag when the app ships one. A link that no longer resolves fails the build.

## Links to the product

Sign-up, docs and app URLs are defined once in `src/site.ts`.

## Development

```sh
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # static output in dist/
```

Node 22.18 or newer. Pages live in `src/pages/`, shared pieces in `src/components/` and
`src/layouts/`.

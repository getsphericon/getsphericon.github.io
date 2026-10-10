# Sphericon website

The marketing site at <https://getsphericon.com>. Built with [Astro](https://astro.build) and
Tailwind, hosted on GitHub Pages. The product and its docs live elsewhere.

## Editing content (no code)

Blog posts are Markdown files in `src/content/blog/`. Edit them in the browser with
[Pages CMS](https://pagescms.org) (sign in with GitHub, choose this repository), or directly on
GitHub (open a file, press the pencil icon).

1. Make your change on a branch and open a pull request.
2. CI builds the site; a red check means something is broken, so ask a developer.
3. Merge to `main`. The site deploys in about a minute.

A post with `draft: true` is not published.

## Links to the product

Sign-up, docs and app URLs are defined once in `src/site.ts`.

## Development

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static output in dist/
```

Node 22.12 or newer. Pages live in `src/pages/`, shared pieces in `src/components/` and
`src/layouts/`.

# iamsimr.com

Personal site and blog. Astro, deployed to AWS (S3 + CloudFront + Route 53) by GitHub Actions.

## Everyday use

```bash
npm install        # once
npm run dev        # live preview at http://localhost:4321
npm run build      # what CI runs; output goes to dist/
```

## Writing (headless, with Sanity)

Posts ("Notes") and projects are written in **Sanity Studio**, a hosted editor at
`https://iamsimr.sanity.studio`. Hit **Publish** there and a webhook tells GitHub
Actions to rebuild and deploy the site, so the new content is live in about two minutes.
No code changes needed. The site stays fully static: Sanity is only called at build time.

```bash
cd studio && npm install
npm run dev        # run the editor locally at http://localhost:3333
npm run deploy     # publish the editor to iamsimr.sanity.studio
```

The content model lives in `studio/schemas/`. The bridge that turns Sanity content
into pages is `src/lib/sanity.ts`.

### Local Markdown fallback

Run with `SANITY_DISABLE=1` (e.g. `SANITY_DISABLE=1 npm run dev`) to build from the
Markdown files in `src/content/` instead, which is handy offline.

**Write a post in Markdown:** add `src/content/blog/my-post-slug.md`:

```md
---
title: 'My post'
description: 'One sentence that shows in lists and search results.'
date: 2026-11-20
tags: [hobbies]
draft: true   # visible in `npm run dev` only; remove to publish
---

Write in Markdown here.
```

Commit and push to `main`; it's live in about two minutes.

**Add a project:** same idea in `src/content/projects/`. `featured: true` puts it on the home page; `order` sorts it.

**Change your details** (name, email, socials, availability): `src/site.config.ts`.
**Change the look** (colours, fonts, spacing): the tokens at the top of `src/styles/global.css`.

Search the repo for `TODO` to find every placeholder waiting on real content.

## Layout

```
src/
  site.config.ts        your name, links, nav
  content/blog/         posts (Markdown/MDX)
  content/projects/     portfolio entries
  content.config.ts     the schema each post/project must follow
  pages/                one file = one URL
  layouts/ components/  shared page chrome
  styles/global.css     design tokens + base styles
studio/                 Sanity Studio (the CMS editor) + content schemas
infra/
  dns.yaml              Route 53 zone + iCloud mail records
  site.yaml             S3, CloudFront, certificate, DNS aliases, deploy role
.github/workflows/
  deploy.yml            build on every push; deploy on main
docs/
  LAUNCH.md             one-time AWS + DNS setup, step by step
```

How the whole pipeline works is explained in the post
[`src/content/blog/how-this-site-is-built.md`](src/content/blog/how-this-site-is-built.md).
First-time AWS setup: [`docs/LAUNCH.md`](docs/LAUNCH.md).

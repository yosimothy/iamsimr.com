---
title: 'How this site is built (and deployed on AWS)'
description: 'From a Markdown file on my laptop to a page on your screen: Astro, GitHub Actions, S3, CloudFront and Route 53, explained.'
date: 2026-11-15
tags: [aws, web-dev, meta]
---

One of my goals for this site was to understand every step between writing a post and you reading it. Here's the whole pipeline, one piece at a time.

## The big picture

```text
 You write          GitHub             GitHub Actions          AWS
┌──────────┐ push ┌──────────┐ trigger ┌───────────────┐ upload ┌──────────────┐
│ post.md  │ ───▶ │   repo   │ ──────▶ │ npm run build │ ─────▶ │  S3 bucket   │
└──────────┘      └──────────┘         └───────────────┘        └──────┬───────┘
                                                                        │ reads
 Your browser ◀── HTTPS ── CloudFront (edge cache, worldwide) ◀─────────┘
       ▲
       └── "where is iamsimr.com?"  ──▶  Route 53 (DNS)
```

There is no server running my site. Every page is a plain HTML file, built ahead of time, and served from a global cache. That's why it's fast, cheap (about a dollar a month), and very hard to break.

## 1. Astro: turning Markdown into HTML

Every post is a Markdown file in `src/content/blog/`. [Astro](https://astro.build) is a *static site generator*: when I run `npm run build`, it reads those files, drops them into page templates, and writes out a folder called `dist/` full of finished HTML, CSS and fonts.

A few things Astro does for me:

- **Checks my content.** Each post's front matter (title, date, tags) is validated against a schema, so a typo fails the build instead of shipping a broken page.
- **Ships zero JavaScript by default.** Pages are just HTML and CSS unless I opt in.
- **Fingerprints assets.** CSS files get names like `about.3f9a1c.css`. If the content changes, so does the name, which lets browsers cache them forever (more on that below).

## 2. GitHub and GitHub Actions: the conveyor belt

The code lives in a GitHub repository. When I push to the `main` branch, a *workflow* (`.github/workflows/deploy.yml`) kicks off on GitHub's machines. It:

1. Checks out the code and installs dependencies.
2. Runs `npm run build`.
3. Logs in to AWS and uploads `dist/` to S3.
4. Tells CloudFront to drop its cached copies so you get the new version.

Pull requests run steps 1 and 2 only, so I find out a change breaks the build *before* it goes live.

### Logging in without passwords: OIDC

The obvious way to let GitHub talk to AWS is to paste an AWS access key into GitHub's secrets. The problem is that keys live forever, and if they leak, someone has your account.

Instead this site uses **OIDC** (OpenID Connect). GitHub issues each workflow run a signed token that says, in effect, *"I am a workflow running in repo `yosimothy/iamsimr.com` on branch `main`."* AWS checks the signature, checks the claim against a rule I set up, and hands back credentials that expire within the hour. There's nothing to leak.

Those credentials belong to an **IAM role** that can do exactly three things: list and write files in one bucket, and clear one CloudFront cache. That's *least privilege*: even a compromised workflow couldn't touch anything else in my account.

## 3. S3: where the files live

**Amazon S3** (Simple Storage Service) is a place to store files ("objects") in a container ("bucket"). My bucket holds the contents of `dist/`.

The important part: **the bucket is completely private.** If you tried to load a file from it directly you'd get "Access Denied." Only CloudFront is allowed in, via something called **Origin Access Control**: CloudFront signs every request it makes to S3, and the bucket's policy says "allow reads only when the request is signed by *this* distribution."

## 4. CloudFront: the fast, secure front door

**CloudFront** is AWS's CDN (content delivery network): hundreds of data centres ("edge locations") around the world that keep copies of my files. When you visit, you're served from one near you instead of from a single bucket in Virginia.

CloudFront also handles:

- **HTTPS**, using a free certificate from **AWS Certificate Manager (ACM)**. Any `http://` request is redirected to `https://`.
- **Compression** (gzip/Brotli) on the fly.
- **Security headers** like HSTS, which tells browsers to only ever use HTTPS for this domain.
- **A tiny edge function.** S3 doesn't really have folders, so a request for `/blog/hello-world/` needs to become `/blog/hello-world/index.html`. A few lines of JavaScript run at the edge to do that rewrite, and to redirect `www.iamsimr.com` to `iamsimr.com`.

### Caching, in one paragraph

Fingerprinted assets (`/_astro/…`) are uploaded with `Cache-Control: max-age=31536000, immutable`: *"keep this for a year, it will never change."* HTML is uploaded with `max-age=0, must-revalidate`: *"always check for a newer version."* After each deploy the workflow sends an **invalidation** so CloudFront's edges fetch fresh copies. The result: new posts show up immediately, and repeat visits load almost nothing.

## 5. Route 53: the address book

**DNS** turns a name like `iamsimr.com` into the address of a machine. **Route 53** is AWS's DNS service, and my domain's *hosted zone* lives there.

It holds two kinds of records:

- **Alias records** pointing `iamsimr.com` and `www.iamsimr.com` at CloudFront. An alias is a Route 53 extra that works like a CNAME but is allowed on the bare domain.
- **Email records** (MX, SPF, DKIM) for iCloud Mail, so `hey@iamsimr.com` keeps working. Moving a domain's DNS without copying these is the classic way to accidentally break your email.

## 6. Infrastructure as code: CloudFormation

I didn't click any of this together by hand. Everything above (bucket, policy, CDN, certificate, DNS records, IAM role) is described in two YAML files in `infra/`, deployed with **CloudFormation**. That means:

- The setup is documented by definition: the template *is* the documentation.
- I can tear it down and rebuild it identically.
- Changes are reviewed like code, in pull requests.

## What it costs

| Service | Monthly cost |
| --- | --- |
| Route 53 hosted zone | $0.50 |
| S3 storage + requests | a few cents |
| CloudFront | free tier covers 1 TB/month |
| ACM certificate | free |
| GitHub Actions | free for this usage |

Plus the domain itself, about $10–15 a year.

## What I'd add next

- **Preview deploys** for pull requests, so I can click through a change before it's live.
- **Privacy-friendly analytics** to see which posts people actually read.
- **A newsletter** for people who prefer email to RSS.

If you'd like a setup like this for your own site, [get in touch](/work-with-me/).

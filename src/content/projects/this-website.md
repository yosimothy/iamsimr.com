---
title: 'iamsimr.com'
summary: 'This site: a fast, static personal site and blog built with Astro and deployed on AWS with fully automated, keyless deploys.'
role: 'Design & development'
stack: [Astro, TypeScript, AWS S3, CloudFront, Route 53, CloudFormation, GitHub Actions]
repo: 'https://github.com/yosimothy/iamsimr.com'
order: 1
featured: true
---

## The goal

Build a personal site that I fully own and understand, end to end, while keeping hosting costs to roughly a dollar a month.

## What I built

- A content-driven Astro site with a typed schema for posts and projects.
- A small, warm design system (two typefaces, a handful of colour tokens, light and dark modes).
- Infrastructure as code: a private S3 bucket behind CloudFront with HTTPS, security headers and an edge function for clean URLs.
- CI/CD with GitHub Actions using OIDC, so there are no long-lived AWS keys anywhere.



## What I learned

<!-- TODO: fill in once it's live. What surprised you? What would you do differently? -->

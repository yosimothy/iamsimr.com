# Voice memo → note

How a photo and a few minutes of talking become a note on iamsimr.com.
Nothing goes live without Sim saying so.

```
 Sim                         Claude                          Sanity / AWS
 ───                         ──────                          ────────────
 photo + voice memo  ──▶  polish into a note (Sim's voice)
                          save as an UNPUBLISHED draft  ──▶  drafts.post-<slug>
                          send a preview screenshot
 "publish" / edits   ──▶  apply edits, or publish       ──▶  post-<slug>
                          rebuild + upload site          ──▶  S3 + CloudFront
```

## 1. Hand it over

In the project chat, send:

- **a photo** (it becomes the cover), and
- **what you want to say**: tap the mic in the Claude app and talk, or paste
  the transcript from Voice Memos (iPhone: open the memo → ⋯ → *View
  transcript* → copy). Ramble freely; it gets tidied.

## 2. Claude drafts it

Claude writes a Markdown note (same format as `src/content/blog/*.md`) with:

- a short title and a one-sentence summary,
- **the short version**: up to three one-line takeaways for skimmers,
- short sections under plain headings, in Sim's voice. Sim's words set the
  tone; the copy is written fresh, not pasted.

Then saves it to Sanity as a draft, which never appears on the site:

```sh
SANITY_WRITE_TOKEN=… npm run note -- draft notes/my-note.md
```

…and builds a private preview that includes drafts, so Sim sees exactly how
it will look:

```sh
SANITY_WRITE_TOKEN=… npm run build:drafts && npx astro preview
```

## 3. Sim reviews

Reply with edits ("shorter intro", "drop the last bit") or open the draft in
[Studio](https://iamsimr.sanity.studio) and change it directly. Repeat until
it's right.

## 4. Publish (only on Sim's explicit yes)

```sh
SANITY_WRITE_TOKEN=… npm run note -- publish <slug>
```

## 5. Put it on the site

**Today this is a manual step.** Publishing in Sanity doesn't rebuild the
site, because GitHub Actions can't deploy to this AWS account yet (its
guardrails block the OIDC role). So the deploy runs on Sim's Mac:

```sh
cd ~/iamsimr.com && git pull && ./scripts/deploy.sh
```

Claude can start that on the Mac for you (you approve it there). Once the
AWS guardrail is lifted, the Sanity webhook will do this automatically and
this step disappears.

## One-time setup

1. **A Sanity token.** sanity.io/manage → *iamsimr.com* → **API** →
   **Tokens** → *Add API token*, name it `claude-notes`, role **Editor**.
   It's used for both writing drafts and reading them for previews.
2. **Give it to Claude's environment** as a secret named `SANITY_WRITE_TOKEN`
   (Claude settings for this project's cloud environment). Never commit it.
3. **Redeploy Studio** so the new fields (cover image, *The short version*)
   show up: `cd ~/iamsimr.com/studio && npx sanity deploy`.

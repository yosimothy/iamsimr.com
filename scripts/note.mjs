#!/usr/bin/env node
/*
  Voice memo → note, the command-line half.

  Claude turns Sim's photo and voice memo into a Markdown file (same format as
  src/content/blog/*.md, plus a local cover image). This script moves it into
  Sanity, where nothing goes live until it's published.

    node scripts/note.mjs draft notes/my-note.md   # create/replace an UNPUBLISHED draft in Sanity
    node scripts/note.mjs list                     # drafts waiting for review
    node scripts/note.mjs publish <slug>           # publish a draft (only after Sim says yes)

  Needs SANITY_WRITE_TOKEN: a Sanity API token with the Editor role
  (sanity.io/manage → iamsimr.com → API → Tokens). Never commit it.

  Publishing in Sanity doesn't put it on iamsimr.com by itself yet: the site
  still has to be rebuilt and uploaded (scripts/deploy.sh on Sim's Mac).
*/
import { readFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@sanity/client';
import yaml from 'js-yaml';

const token = process.env.SANITY_WRITE_TOKEN;
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'j76vr3np',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2025-01-01',
  useCdn: false,
  token,
});

const key = () => Math.random().toString(36).slice(2, 12);
const publishedId = (slug) => `post-${slug}`;
const draftId = (slug) => `drafts.post-${slug}`;

// ---------- Markdown → Portable Text (the subset notes use) ----------

/** Inline text with **bold**, *italic*, `code` and [links](url) → spans + link defs. */
function inline(text) {
  const children = [];
  const markDefs = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((\S+?)\)/g;
  let last = 0;
  const push = (t, marks = []) => t && children.push({ _type: 'span', _key: key(), text: t, marks });
  for (const m of text.matchAll(re)) {
    push(text.slice(last, m.index));
    if (m[1]) push(m[1], ['strong']);
    else if (m[2]) push(m[2], ['em']);
    else if (m[3]) push(m[3], ['code']);
    else if (m[4]) {
      const k = key();
      markDefs.push({ _type: 'link', _key: k, href: m[5] });
      push(m[4], [k]);
    }
    last = m.index + m[0].length;
  }
  push(text.slice(last));
  if (!children.length) push(' ');
  return { children, markDefs };
}

const block = (text, style = 'normal', list) => ({
  _type: 'block', _key: key(), style, ...inline(text),
  ...(list ? { listItem: list, level: 1 } : {}),
});

export function toPortableText(md) {
  const out = [];
  let para = [];
  const flush = () => { if (para.length) out.push(block(para.join(' '))); para = []; };
  for (const raw of md.replace(/<!--[\s\S]*?-->/g, '').split('\n')) {
    const line = raw.trim();
    let m;
    if (!line) flush();
    else if ((m = line.match(/^(#{2,3})\s+(.*)/))) { flush(); out.push(block(m[2], m[1].length === 2 ? 'h2' : 'h3')); }
    else if ((m = line.match(/^>\s?(.*)/))) { flush(); out.push(block(m[1], 'blockquote')); }
    else if ((m = line.match(/^[-*]\s+(.*)/))) { flush(); out.push(block(m[1], 'normal', 'bullet')); }
    else if ((m = line.match(/^\d+[.)]\s+(.*)/))) { flush(); out.push(block(m[1], 'normal', 'number')); }
    else para.push(line);
  }
  flush();
  return out;
}

function parseNote(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('Note needs front matter between --- lines.');
  return { data: yaml.load(m[1]), body: m[2] };
}

const slugify = (s) => s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

// ---------- commands ----------

async function draft(file) {
  const path = resolve(file);
  const { data, body } = parseNote(await readFile(path, 'utf8'));
  for (const f of ['title', 'description']) if (!data[f]) throw new Error(`Missing "${f}" in front matter.`);
  const slug = data.slug || slugify(data.title);

  let cover;
  if (data.cover?.file) {
    const imgPath = resolve(dirname(path), data.cover.file);
    const asset = await client.assets.upload('image', await readFile(imgPath), { filename: basename(imgPath) });
    cover = {
      _type: 'image',
      asset: { _type: 'reference', _ref: asset._id },
      alt: data.cover.alt || '',
      ...(data.cover.caption ? { caption: data.cover.caption } : {}),
    };
  }

  const doc = {
    _id: draftId(slug),
    _type: 'post',
    title: data.title,
    slug: { _type: 'slug', current: slug },
    description: data.description,
    publishedAt: new Date(data.date || Date.now()).toISOString(),
    tags: data.tags || [],
    keyPoints: (data.keyPoints || []).slice(0, 3),
    ...(cover ? { cover } : {}),
    body: toPortableText(body),
  };
  await client.createOrReplace(doc);
  console.log(`Draft saved (not live): ${slug}`);
  console.log(`Review in Studio: https://iamsimr.sanity.studio/structure/post;${publishedId(slug)}`);
}

async function list() {
  const drafts = await client.fetch(`*[_id in path("drafts.**") && _type == "post"]{ title, "slug": slug.current, _updatedAt } | order(_updatedAt desc)`);
  if (!drafts.length) return console.log('No drafts waiting.');
  for (const d of drafts) console.log(`${d.slug}  ·  ${d.title}  ·  edited ${d._updatedAt}`);
}

async function publish(slug) {
  const d = await client.getDocument(draftId(slug));
  if (!d) throw new Error(`No draft called "${slug}". Run "list" to see drafts.`);
  const { _id, _rev, _createdAt, _updatedAt, ...fields } = d;
  // Date it today, unless it's an edit to a note that's already live.
  const live = await client.getDocument(publishedId(slug));
  const doc = { ...fields, _id: publishedId(slug), publishedAt: live?.publishedAt ?? new Date().toISOString() };
  if (live) doc.updatedAt = new Date().toISOString();
  await client.transaction().createOrReplace(doc).delete(draftId(slug)).commit();
  console.log(`Published in Sanity: ${slug}. Rebuild and deploy the site to put it on iamsimr.com.`);
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
const [cmd, arg] = isCli ? process.argv.slice(2) : [];
if (isCli) main();
function main() {
const needsToken = ['draft', 'list', 'publish'].includes(cmd);
if (needsToken && !token) { console.error('Set SANITY_WRITE_TOKEN first (an Editor token from sanity.io/manage).'); process.exit(1); }
const run = { draft: () => draft(arg), list, publish: () => publish(arg) }[cmd];
if (!run || (cmd !== 'list' && !arg)) {
  console.error('Usage: node scripts/note.mjs draft <file.md> | list | publish <slug>');
  process.exit(1);
}
run().catch((e) => { console.error(e.message); process.exit(1); });
}

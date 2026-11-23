/*
  Sanity → Astro bridge.

  The blog and projects collections are loaded from Sanity at build time.
  Set SANITY_DISABLE=1 to build from the Markdown files in src/content/ instead
  (handy offline, or if Sanity is ever down).

  Each document's rich text (Portable Text) is turned into HTML here, at build
  time, so pages stay static: no CMS calls happen when someone visits the site.
*/
import { createClient } from '@sanity/client';
import { toHTML, escapeHTML } from '@portabletext/to-html';
import { codeToHtml } from 'shiki';
import type { Loader } from 'astro/loaders';

const env = (k: string) => (import.meta.env?.[k] as string | undefined) ?? process.env[k];

export const sanityConfig = {
  projectId: env('SANITY_PROJECT_ID') || 'j76vr3np', // public ID, safe to commit
  dataset: env('SANITY_DATASET') ?? 'production',
};
export const useSanity = !env('SANITY_DISABLE');

// 'published' for the real site. 'drafts' (needs SANITY_READ_TOKEN) builds a
// private preview that includes unpublished drafts, for reviewing a note
// before it goes live: `npm run build:drafts`.
const perspective = env('SANITY_PERSPECTIVE') === 'drafts' ? 'drafts' : 'published';

function client() {
  return createClient({
    projectId: sanityConfig.projectId!,
    dataset: sanityConfig.dataset,
    apiVersion: '2025-01-01',
    useCdn: false, // builds want the freshest published content
    perspective, // drafts never reach the live site
    // Only needed if the dataset is private, or to see drafts (the notes token works too).
    token: env('SANITY_READ_TOKEN') || (perspective === 'drafts' ? env('SANITY_WRITE_TOKEN') : undefined),
    ...(env('SANITY_API_HOST') ? { apiHost: env('SANITY_API_HOST'), useProjectHostname: false } : {}), // for local testing
  });
}

type Block = { _type: string; _key: string; [k: string]: any };

/** Portable Text → HTML, with syntax-highlighted code and responsive images. */
async function renderBody(blocks: Block[] = []): Promise<string> {
  // Highlight code blocks first (async), then render everything (sync).
  const highlighted = new Map<string, string>();
  for (const b of blocks) {
    if (b._type === 'code' && b.code) {
      try {
        highlighted.set(b._key, await codeToHtml(b.code, {
          lang: b.language || 'text',
          themes: { light: 'github-light', dark: 'github-dark' },
        }));
      } catch {
        highlighted.set(b._key, `<pre><code>${escapeHTML(b.code)}</code></pre>`);
      }
    }
  }
  return toHTML(blocks as any, {
    components: {
      types: {
        code: ({ value }) => highlighted.get(value._key) ?? '',
        image: ({ value }) => {
          if (!value?.url) return '';
          const alt = escapeHTML(value.alt ?? '');
          const cap = value.caption ? `<figcaption>${escapeHTML(value.caption)}</figcaption>` : '';
          return `<figure><img src="${value.url}?w=1400&auto=format" alt="${alt}" loading="lazy" />${cap}</figure>`;
        },
      },
      marks: {
        link: ({ children, value }) => {
          const href = escapeHTML(value?.href ?? '#');
          const ext = /^https?:\/\//.test(href) ? ' rel="noopener"' : '';
          return `<a href="${href}"${ext}>${children}</a>`;
        },
      },
    },
  });
}

/** Plain text of a body, used for reading-time estimates. */
function plainText(blocks: Block[] = []) {
  return blocks
    .filter((b) => b._type === 'block')
    .map((b) => (b.children ?? []).map((c: any) => c.text).join(''))
    .join('\n\n');
}

// Pull image URLs alongside the body so the renderer doesn't need extra lookups.
const BODY = `body[]{..., _type == "image" => {..., "url": asset->url}}`;

// An image with its URL, alt text and chosen focus point (hotspot).
const IMAGE = `{ "url": asset->url, alt, hotspot }`;

export type SanityImage = { url: string; alt?: string; hotspot?: { x: number; y: number } };

/** A resized, cropped URL from Sanity's image CDN, centred on the hotspot. */
export function imageUrl(img: SanityImage, w: number, h?: number) {
  const p = new URLSearchParams({ w: String(w), auto: 'format', q: '80' });
  if (h) {
    p.set('h', String(h));
    p.set('fit', 'crop');
    if (img.hotspot) {
      p.set('crop', 'focalpoint');
      p.set('fp-x', img.hotspot.x.toFixed(3));
      p.set('fp-y', img.hotspot.y.toFixed(3));
    }
  }
  return `${img.url}?${p}`;
}

const QUERIES = {
  post: `*[_type == "post" && defined(slug.current)]{
    "id": slug.current, title, description,
    "date": publishedAt, "updated": updatedAt,
    "tags": coalesce(tags, []), "keyPoints": coalesce(keyPoints, []),
    "cover": select(defined(cover.asset) => cover{ "url": asset->url, alt, caption, hotspot }), ${BODY}
  }`,
  project: `*[_type == "project" && defined(slug.current)]{
    "id": slug.current, title, summary, role,
    "stack": coalesce(stack, []), link, repo, "cover": select(defined(cover.asset) => cover${IMAGE}),
    "order": coalesce(order, 100), "featured": coalesce(featured, false), ${BODY}
  }`,
};

/** An Astro content loader that reads one Sanity document type. */
export function sanityLoader(type: keyof typeof QUERIES): Loader {
  return {
    name: `sanity-${type}`,
    load: async ({ store, parseData, logger }) => {
      const docs: any[] = await client().fetch(QUERIES[type]);
      logger.info(`Loaded ${docs.length} ${type} document(s) from Sanity`);
      store.clear();
      for (const { id, body, ...fields } of docs) {
        // Drop nulls so schema defaults apply.
        const raw = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== null));
        const data = await parseData({ id, data: raw });
        store.set({ id, data, body: plainText(body), rendered: { html: await renderBody(body) } });
      }
    },
  };
}

export type Profile = {
  name?: string;
  headshot?: SanityImage;
  photoCaption?: string;
  bioHtml?: string;
  now?: string[];
  lately?: { kind?: string; verb: string; text: string }[];
  onRotation?: { kind: 'reading' | 'listening' | 'playing' | 'watching'; title: string; by?: string; note?: string; link?: string }[];
  latelyUpdated?: string;
  availability?: string;
  linkedin?: string;
};

let profileCache: Promise<Profile> | undefined;
/** The single Profile document (photo, bio, now list). Empty when Sanity is off or unset. */
export function getProfile(): Promise<Profile> {
  if (!useSanity) return Promise.resolve({});
  profileCache ??= client()
    .fetch(`*[_id == "profile"][0]{ name, "headshot": headshot${IMAGE}, photoCaption, ${BODY.replace('body[]', 'bio[]')}, now, lately[]{ kind, verb, text }, onRotation[]{ kind, title, by, note, link }, latelyUpdated, availability, linkedin }`)
    .then(async (doc: any) => {
      if (!doc) return {};
      const out = Object.fromEntries(Object.entries(doc).filter(([, v]) => v !== null)) as any;
      if (out.headshot && !out.headshot.url) delete out.headshot;
      if (out.bio?.length) out.bioHtml = await renderBody(out.bio);
      delete out.bio;
      return out as Profile;
    });
  return profileCache;
}

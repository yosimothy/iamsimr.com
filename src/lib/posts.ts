import { getCollection } from 'astro:content';

/** One line in a bullet-journal log: a note, a yap, or a project. */
export type Entry = { kind: 'note' | 'yap' | 'project'; title: string; desc: string; href: string; date?: Date; tags: string[]; draft?: boolean };

/** Published posts, newest first. Drafts show up in `npm run dev` only. */
export async function getPosts() {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

export function readingTime(body = '') {
  const words = body.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 230))} min read`;
}

/** Notes, yaps and projects together, newest first: the home page's "Latest entries". */
export async function getEntries(limit = 6): Promise<Entry[]> {
  const posts: Entry[] = (await getPosts()).map((p) => ({
    kind: p.data.kind, title: p.data.title, desc: p.data.description, href: `/blog/${p.id}/`, date: p.data.date, tags: p.data.tags, draft: p.data.draft,
  }));
  const projects: Entry[] = (await getCollection('projects')).map((p) => ({
    kind: 'project', title: p.data.title, desc: p.data.summary, href: `/projects/${p.id}/`, date: p.data.date, tags: [],
  }));
  return [...posts, ...projects]
    .sort((a, b) => (b.date?.valueOf() ?? 0) - (a.date?.valueOf() ?? 0))
    .slice(0, limit);
}

/** Posts as log entries (for the Notes page). */
export const postEntries = (posts: Awaited<ReturnType<typeof getPosts>>): Entry[] =>
  posts.map((p) => ({ kind: p.data.kind, title: p.data.title, desc: p.data.description, href: `/blog/${p.id}/`, date: p.data.date, tags: p.data.tags, draft: p.data.draft }));

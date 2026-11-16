import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { sanityLoader, useSanity } from './lib/sanity';

// Content comes from Sanity when it's configured (SANITY_PROJECT_ID is set),
// otherwise from the Markdown files in src/content/. Either way it has to match
// the schemas below, so a missing title or bad date fails the build instead of
// shipping a broken page.

const blog = defineCollection({
  loader: useSanity
    ? sanityLoader('post')
    : glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: useSanity
    ? sanityLoader('project')
    : glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    role: z.string().optional(),
    stack: z.array(z.string()).default([]),
    link: z.string().url().optional(),
    repo: z.string().url().optional(),
    order: z.number().default(100),
    featured: z.boolean().default(false),
    cover: z
      .object({ url: z.string().url(), alt: z.string().nullish(), hotspot: z.object({ x: z.number(), y: z.number() }).nullish() })
      .optional(),
  }),
});

export const collections = { blog, projects };

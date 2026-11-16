import { defineField, defineType } from 'sanity';

export const post = defineType({
  name: 'post',
  title: 'Note',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug', type: 'slug', title: 'URL slug',
      description: 'The end of the address: iamsimr.com/blog/<slug>/',
      options: { source: 'title', maxLength: 80 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'description', type: 'text', rows: 2,
      description: 'One or two sentences. Shown in lists, search results and link previews.',
      validation: (r) => r.required().max(200),
    }),
    defineField({ name: 'publishedAt', type: 'datetime', title: 'Published', initialValue: () => new Date().toISOString(), validation: (r) => r.required() }),
    defineField({ name: 'updatedAt', type: 'datetime', title: 'Last updated' }),
    defineField({ name: 'tags', type: 'array', of: [{ type: 'string' }], options: { layout: 'tags' } }),
    defineField({ name: 'body', type: 'body' }),
  ],
  orderings: [{ title: 'Newest first', name: 'publishedDesc', by: [{ field: 'publishedAt', direction: 'desc' }] }],
  preview: { select: { title: 'title', subtitle: 'publishedAt' } },
});

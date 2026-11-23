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
      name: 'kind', type: 'string', title: 'Kind',
      description: 'A note (learnings, write-ups) or a yap (opinions and rambles: a movie, an album, a hot take).',
      options: { list: [{ title: 'Note', value: 'note' }, { title: 'Yap', value: 'yap' }], layout: 'radio', direction: 'horizontal' },
      initialValue: 'note',
    }),
    defineField({
      name: 'description', type: 'text', rows: 2,
      description: 'One or two sentences. Shown in lists, search results and link previews.',
      validation: (r) => r.required().max(200),
    }),
    defineField({
      name: 'cover', type: 'image', title: 'Cover image',
      description: 'The photo at the top of the note. Drag the circle to set the focus point.',
      options: { hotspot: true },
      fields: [
        { name: 'alt', type: 'string', title: 'Alt text', description: 'Describe the image for screen readers.', validation: (r) => r.required() },
        { name: 'caption', type: 'string', title: 'Caption', description: 'Optional. Shown in handwriting under the image.' },
      ],
    }),
    defineField({
      name: 'keyPoints', type: 'array', title: 'The short version',
      description: 'Up to three one-line takeaways, shown in a sticky note above the post so it can be skimmed.',
      of: [{ type: 'string' }],
      validation: (r) => r.max(3),
    }),
    defineField({ name: 'publishedAt', type: 'datetime', title: 'Published', initialValue: () => new Date().toISOString(), validation: (r) => r.required() }),
    defineField({ name: 'updatedAt', type: 'datetime', title: 'Last updated' }),
    defineField({ name: 'tags', type: 'array', of: [{ type: 'string' }], options: { layout: 'tags' } }),
    defineField({ name: 'body', type: 'body' }),
  ],
  orderings: [{ title: 'Newest first', name: 'publishedDesc', by: [{ field: 'publishedAt', direction: 'desc' }] }],
  preview: { select: { title: 'title', subtitle: 'publishedAt', media: 'cover' } },
});

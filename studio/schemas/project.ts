import { defineField, defineType } from 'sanity';

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', title: 'URL slug', options: { source: 'title', maxLength: 80 }, validation: (r) => r.required() }),
    defineField({ name: 'summary', type: 'text', rows: 2, description: 'One sentence: the problem and the result.', validation: (r) => r.required().max(220) }),
    defineField({
      name: 'cover',
      type: 'image',
      title: 'Cover image',
      description: 'A screenshot or photo. Shown on the project card and at the top of the write-up.',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', type: 'string', title: 'Describe the image (for screen readers)' })],
    }),
    defineField({ name: 'role', type: 'string', description: 'e.g. Freelance, Side project, Design & development' }),
    defineField({ name: 'stack', type: 'array', of: [{ type: 'string' }], options: { layout: 'tags' } }),
    defineField({ name: 'link', type: 'url', title: 'Live URL' }),
    defineField({ name: 'repo', type: 'url', title: 'Code URL' }),
    defineField({ name: 'publishedAt', type: 'datetime', title: 'Added', description: 'When this project went up. Used to place it in Latest entries.' }),
    defineField({ name: 'featured', type: 'boolean', description: 'Show on the home page', initialValue: false }),
    defineField({ name: 'order', type: 'number', description: 'Lower numbers show first', initialValue: 100 }),
    defineField({ name: 'body', type: 'body', title: 'Write-up' }),
  ],
  orderings: [{ title: 'Display order', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'title', subtitle: 'role', media: 'cover' } },
});

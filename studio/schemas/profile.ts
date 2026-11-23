import { defineField, defineType } from 'sanity';

// One document holding the facts about you: photo, bio, and what you're up to.
// The About page (and anywhere else that needs them) reads from here.
export const profile = defineType({
  name: 'profile',
  title: 'Profile',
  type: 'document',
  groups: [{ name: 'lately', title: 'Lately (home page)' }],
  fields: [
    defineField({ name: 'name', type: 'string', title: 'Name as shown on the site', validation: (r) => r.required() }),
    defineField({
      name: 'headshot',
      type: 'image',
      title: 'Photo of you',
      description: 'Portrait works best. Click the crop icon to choose the focus point.',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', type: 'string', title: 'Describe the photo (for screen readers)' })],
    }),
    defineField({ name: 'photoCaption', type: 'string', title: 'Handwritten caption under the photo', initialValue: 'me, probably mid-project' }),
    defineField({ name: 'bio', type: 'body', title: 'About me', description: 'Two or three short paragraphs: who you are, what you care about, what you are up to.' }),
    defineField({ name: 'now', type: 'array', title: "What I'm doing now", of: [{ type: 'string' }] }),
    defineField({
      name: 'lately', type: 'array', title: 'Lately (home page)', group: 'lately',
      description: "The short log beside the greeting on the home page. Three or four lines is plenty.",
      of: [{
        type: 'object', name: 'latelyItem',
        fields: [
          defineField({
            name: 'kind', type: 'string', title: 'Bullet', initialValue: 'learning',
            options: { list: [
              { title: '• learning (blue dot)', value: 'learning' },
              { title: '○ tinkering (red circle)', value: 'tinkering' },
              { title: '> next up (yellow arrow)', value: 'next' },
              { title: '✓ shipped (check)', value: 'shipped' },
            ], layout: 'radio' },
          }),
          defineField({ name: 'verb', type: 'string', title: 'Bold word', description: 'e.g. learning, tinkering, shipped', validation: (r) => r.required() }),
          defineField({ name: 'text', type: 'string', title: 'The rest of the line', validation: (r) => r.required().max(70) }),
        ],
        preview: { select: { title: 'verb', subtitle: 'text' } },
      }],
      validation: (r) => r.max(5),
    }),
    defineField({
      name: 'onRotation', type: 'array', title: 'Reading, listening, watching', group: 'lately',
      description: 'Shown under the Lately log. Add one of each (or skip any).',
      of: [{
        type: 'object', name: 'mediaItem',
        fields: [
          defineField({
            name: 'kind', type: 'string', title: 'Type', initialValue: 'reading', validation: (r) => r.required(),
            options: { list: ['reading', 'listening', 'watching'], layout: 'radio', direction: 'horizontal' },
          }),
          defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
          defineField({ name: 'by', type: 'string', title: 'By', description: 'Author, artist, or show/channel. Optional.' }),
          defineField({ name: 'link', type: 'url', description: 'Optional.' }),
        ],
        preview: { select: { title: 'title', subtitle: 'kind' } },
      }],
      validation: (r) => r.max(3),
    }),
    defineField({ name: 'latelyUpdated', type: 'date', title: 'Lately last updated', group: 'lately', description: 'Shown as a small handwritten "updated" date.' }),
    defineField({ name: 'availability', type: 'string', title: 'Availability line', description: 'e.g. Open to freelance web projects.' }),
    defineField({ name: 'linkedin', type: 'url', title: 'LinkedIn URL' }),
  ],
  preview: { select: { title: 'name', media: 'headshot' } },
});

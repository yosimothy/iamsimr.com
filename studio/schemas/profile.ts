import { defineField, defineType } from 'sanity';

// One document holding the facts about you: photo, bio, and what you're up to.
// The About page (and anywhere else that needs them) reads from here.
export const profile = defineType({
  name: 'profile',
  title: 'Profile',
  type: 'document',
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
    defineField({ name: 'availability', type: 'string', title: 'Availability line', description: 'e.g. Open to freelance web projects.' }),
    defineField({ name: 'linkedin', type: 'url', title: 'LinkedIn URL' }),
  ],
  preview: { select: { title: 'name', media: 'headshot' } },
});

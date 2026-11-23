import { defineArrayMember, defineType } from 'sanity';

// Rich text used by posts and projects: paragraphs, headings, lists,
// quotes, links, code blocks and images. The site turns this into HTML at build time.
export const body = defineType({
  name: 'body',
  title: 'Body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading', value: 'h2' },
        { title: 'Subheading', value: 'h3' },
        { title: 'Quote', value: 'blockquote' },
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
          { title: 'Code', value: 'code' },
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [{ name: 'href', type: 'url', title: 'URL', validation: (r) => r.uri({ allowRelative: true, scheme: ['http', 'https', 'mailto'] }) }],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: { hotspot: true },
      fields: [
        { name: 'alt', type: 'string', title: 'Alt text', description: 'Describe the image for screen readers.', validation: (r) => r.required() },
        { name: 'caption', type: 'string', title: 'Caption' },
      ],
    }),
    defineArrayMember({ type: 'code', options: { withFilename: false } }),

    // Plain words beside the technical detail: one idea, explained twice.
    defineArrayMember({
      name: 'layers',
      title: 'Plain words + under the hood',
      type: 'object',
      fields: [
        { name: 'plain', type: 'text', rows: 4, title: 'In plain words', validation: (r) => r.required() },
        { name: 'tech', type: 'array', of: [{ type: 'string' }], title: 'Under the hood (one point per line; wrap code in `backticks`)' },
      ],
      preview: { select: { title: 'plain' }, prepare: ({ title }) => ({ title: 'Layers: ' + (title ?? '') }) },
    }),

    // An image next to a short passage of text.
    defineArrayMember({
      name: 'imageText',
      title: 'Image beside text',
      type: 'object',
      fields: [
        { name: 'image', type: 'image', options: { hotspot: true }, fields: [
        { name: 'alt', type: 'string', title: 'Alt text', validation: (r) => r.required() },
        { name: 'caption', type: 'string', title: 'Caption' },
      ] },
        { name: 'text', type: 'text', rows: 5, title: 'Text (blank line between paragraphs)' },
        { name: 'side', type: 'string', options: { list: ['left', 'right'] }, initialValue: 'right', title: 'Image side' },
      ],
      preview: { select: { title: 'text', media: 'image' } },
    }),

    // Two or three images side by side.
    defineArrayMember({
      name: 'gallery',
      title: 'Image row',
      type: 'object',
      fields: [
        { name: 'images', type: 'array', of: [{ type: 'image', options: { hotspot: true }, fields: [
        { name: 'alt', type: 'string', title: 'Alt text', validation: (r) => r.required() },
        { name: 'caption', type: 'string', title: 'Caption' },
      ] }], validation: (r) => r.min(2).max(3) },
      ],
      preview: { select: { media: 'images.0' }, prepare: ({ media }) => ({ title: 'Image row', media }) },
    }),

    // A row of small facts (e.g. what it costs).
    defineArrayMember({
      name: 'facts',
      title: 'Fact cards',
      type: 'object',
      fields: [
        { name: 'items', type: 'array', of: [{ type: 'object', fields: [{ name: 'value', type: 'string' }, { name: 'label', type: 'string' }] }] },
      ],
      preview: { prepare: () => ({ title: 'Fact cards' }) },
    }),
  ],
});

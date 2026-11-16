import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { codeInput } from '@sanity/code-input';
import { schemaTypes } from './schemas';

// projectId is public (it appears in API URLs), so it's fine to commit.
// Your Sanity project (public ID, safe to commit).
export const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'j76vr3np';
export const dataset = process.env.SANITY_STUDIO_DATASET || 'production';

export default defineConfig({
  name: 'default',
  title: "Sim's notebook",
  projectId,
  dataset,
  plugins: [
    structureTool({
      // Profile is a single page, not a list: it opens straight into the editor.
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem().title('Profile').id('profile').child(S.document().schemaType('profile').documentId('profile')),
            S.divider(),
            ...S.documentTypeListItems().filter((i) => i.getId() !== 'profile'),
          ]),
    }),
    codeInput(),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
    // Hide "Profile" from the "create new" menu: there is only ever one.
    templates: (prev) => prev.filter((t) => t.schemaType !== 'profile'),
  },
  document: {
    actions: (prev, ctx) => (ctx.schemaType === 'profile' ? prev.filter((a) => !['duplicate', 'delete', 'unpublish'].includes(a.action ?? '')) : prev),
  },
});

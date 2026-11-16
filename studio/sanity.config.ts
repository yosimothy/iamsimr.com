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
  plugins: [structureTool(), codeInput(), visionTool()],
  schema: { types: schemaTypes },
});

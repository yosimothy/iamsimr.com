// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// `site` is your public URL. Astro uses it for the sitemap, RSS feed and canonical links.
export default defineConfig({
  site: 'https://iamsimr.com',
  integrations: [mdx(), sitemap()],
  // "directory" means /blog/my-post/ is built as /blog/my-post/index.html.
  // A small CloudFront Function (see infra/site.yaml) maps pretty URLs onto those files.
  build: { format: 'directory' },
  // Old links keep working: each becomes a tiny page that forwards to the new address.
  redirects: {
    '/blog/how-this-site-is-built': '/projects/this-website/',
    '/blog/the-week-of-last-week': '/blog/holiday-decorations-gta-vi/',
  },
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});

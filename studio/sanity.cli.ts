import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'j76vr3np',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // The editor is hosted free by Sanity at https://<studioHost>.sanity.studio
  studioHost: 'iamsimr',
  deployment: { appId: 'an1dtoacuskq701co1dbvmz9' },
});

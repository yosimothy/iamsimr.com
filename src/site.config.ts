// One place for the facts about you. Edit these and every page updates.
// Name, availability and LinkedIn come from the Profile page in Sanity Studio
// when they're filled in there; the values below are the fallbacks.
import { getProfile } from './lib/sanity';

const profile = await getProfile();

export const SITE = {
  name: profile.name ?? 'Sim',
  title: "Sim · notes, projects & things I'm learning",
  description:
    "Notes on the web, hobbies, and the projects that come out of both. Mostly works in progress.", // TODO
  url: 'https://iamsimr.com',
  email: 'hey@iamsimr.com',
  availability: profile.availability ?? 'Currently open to freelance web projects and the right full-time role.',
  socials: [
    { label: 'GitHub', href: 'https://github.com/yosimothy' },
    { label: 'LinkedIn', href: profile.linkedin ?? 'https://www.linkedin.com/' },
  ],
  // Each section of the notebook has a marker colour, used everywhere it appears.
  nav: [
    { label: 'Notes', href: '/blog/', color: 'blue' },
    { label: 'Projects', href: '/projects/', color: 'red' },
    { label: 'About', href: '/about/', color: 'ink' },
    { label: 'Work with me', href: '/work-with-me/', color: 'yellow' },
  ],
};

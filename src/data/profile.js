/**
 * ──────────────────────────────────────────────────────────────────────────
 *  PROFILE: who you are. Start here.
 *
 *  Text fields support *emphasis*: wrap a word in asterisks and it renders
 *  in the italic serif accent face (e.g. 'I build *resilient* systems').
 *  This file is also read by vite.config.js to fill <title> and meta tags.
 * ──────────────────────────────────────────────────────────────────────────
 */
export const profile = {
  firstName: 'Your',
  lastName: 'Name',
  role: 'Full-stack Engineer',

  /** 1–2 letters shown in the emblem logo. Defaults to your initials. */
  monogram: '',

  /** Hero headline. *Emphasis* renders with the animated gradient. */
  headline: 'Resilient systems. *Expressive* interfaces. Real impact.',

  /** Rotating "I build …" phrases in the hero. */
  building: ['realtime platforms', 'payment infrastructure', 'design systems', 'developer tools'],

  /** Shown in the hero's request line: GET / HTTP/2 · host: <domain> */
  domain: 'yourname.dev',

  tagline:
    'I design and build *resilient* systems and *expressive* interfaces — from the database row to the last pixel.',

  location: 'City, Country',
  /** IANA timezone; drives the live clock in the header. */
  timezone: 'America/New_York',
  /** Short label next to the clock, e.g. 'NYC', 'BER', 'UTC-5'. */
  timezoneLabel: 'EST',

  email: 'hello@yourname.dev',

  /** Put a PDF in /public and reference it here, e.g. '/resume.pdf'. Empty string hides it. */
  resumeUrl: '',

  availability: {
    open: true,
    short: 'Available',
    label: 'Open to senior & staff roles — from Q1 2027',
  },

  /** First year you shipped production code. Used for "years shipping" and the hero seal. */
  since: 2016,

  /** Short list shown in the hero meta block. */
  focus: ['React', 'Node.js', 'PostgreSQL', 'AWS'],

  /** `icon`: github | linkedin | x | writing (see components/SocialIcon). */
  socials: [
    { label: 'GitHub', icon: 'github', handle: '@yourhandle', url: 'https://github.com/yourhandle' },
    { label: 'LinkedIn', icon: 'linkedin', handle: 'in/yourname', url: 'https://www.linkedin.com/in/yourname' },
    { label: 'X / Twitter', icon: 'x', handle: '@yourhandle', url: 'https://x.com/yourhandle' },
    { label: 'Writing', icon: 'writing', handle: 'yourname.dev/notes', url: 'https://yourname.dev/notes' },
  ],
}

export const fullName = `${profile.firstName} ${profile.lastName}`

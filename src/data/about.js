import { profile } from './profile.js'

const yearsShipping = new Date().getFullYear() - profile.since

/**
 * 01 / client: the human behind the request.
 */
export const about = {
  title: 'The human *behind* the request.',
  lede: 'Engineer by trade, product-minded by habit. I care about the whole path, not just my slice of it.',

  /** The big opening statement. Keep it to 1–2 sentences. */
  statement:
    'I build software end-to-end — the query plan, the API contract, the render, and the *moment* a person actually feels it.',

  paragraphs: [
    `For ${yearsShipping}+ years I've shipped products for startups and scale-ups: realtime platforms, payment systems, internal tools and design systems. I'm happiest where the hard problems cross boundaries — when a slow screen is really a missing index, or a flaky feature is really a contract nobody wrote down.`,
    'I like small teams, short feedback loops and boring infrastructure that lets the product be bold. Replace this copy with your own story: where you started, what you got obsessed with, and what you want to build next.',
  ],

  /** "Currently" block. Add, remove or rename rows freely. */
  now: [
    { label: 'Building', value: 'A realtime sync engine for collaborative tools' },
    { label: 'Learning', value: 'Rust for latency-critical services' },
    { label: 'Reading', value: 'Designing Data-Intensive Applications (again)' },
  ],

  /** Animated counters. `decimals` and `suffix` are optional. */
  stats: [
    { value: yearsShipping, suffix: '+', label: 'Years in production' },
    { value: 40, suffix: '+', label: 'Releases shipped' },
    { value: 99.98, decimals: 2, suffix: '%', label: 'Uptime held' },
    { value: 2, suffix: 'M+', label: 'Users served' },
  ],

  principles: [
    {
      title: 'Ship small, ship often',
      body: 'Tiny, reversible changes beat heroic launches. Feature flags over feature branches.',
    },
    {
      title: 'Boring tech, bold product',
      body: 'Spend novelty where users can see it. Keep the foundations proven and observable.',
    },
    {
      title: 'Performance is a feature',
      body: 'Latency budgets are product decisions. I measure first, then make it fast.',
    },
    {
      title: 'Leave it better',
      body: 'Docs, tests and a clean handover are part of done — not a follow-up ticket.',
    },
  ],
}

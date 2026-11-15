/**
 * 04 / data: selected projects, stored as "records".
 *
 * - `stack` powers the filter chips. Tags used by 2+ projects become chips.
 * - `image` is optional. Without it, a generative cover is drawn from `id`.
 *   To use a screenshot, put it in /public/projects and set image: '/projects/atlas.jpg'.
 * - `caseStudy` sections appear in the detail sheet. Add or remove keys freely.
 * - Leave a link empty ('') to hide it.
 * - Status badge is automatic: LIVE when `links.live` is set, GITHUB when only
 *   `links.repo` is set, otherwise PRIVATE. Override with `status: 'live'`, etc.
 */
export const projectsIntro = {
  title: 'Selected *work*.',
  lede: 'Products I have designed, built and run in production. Open any card for the full case study.',
}

export const projects = [
  {
    id: 'atlas',
    title: 'Atlas',
    kicker: 'Realtime logistics platform',
    year: 2025,
    role: 'Lead engineer',
    stack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'WebSockets', 'AWS'],
    summary:
      'Live tracking and dispatch for 12,000 vehicles, with sub-second updates from the road to the ops dashboard.',
    metrics: [
      { value: '−63%', label: 'p95 latency' },
      { value: '12k', label: 'vehicles live' },
      { value: '99.98%', label: 'uptime' },
    ],
    caseStudy: {
      Problem:
        'Dispatchers were working from a map that lagged up to 30 seconds behind reality, and the polling backend fell over at peak.',
      Approach:
        'Replaced polling with a WebSocket fan-out backed by Postgres logical replication, partitioned by region. Rebuilt the map layer to diff updates instead of re-rendering.',
      Outcome:
        'Updates land in under 400ms end-to-end. Infrastructure cost dropped 35% while handling 4× the traffic.',
    },
    links: { live: 'https://example.com', repo: '' },
    image: '/images/atlas-preview.webp',
  },
  {
    id: 'ledgerline',
    title: 'Ledgerline',
    kicker: 'Double-entry payments ledger',
    year: 2024,
    role: 'Backend lead',
    stack: ['Node.js', 'TypeScript', 'PostgreSQL', 'Kafka', 'Terraform'],
    summary:
      'An auditable, idempotent ledger service that became the source of truth for every cent moving through the platform.',
    metrics: [
      { value: '$40M+', label: 'monthly volume' },
      { value: '0', label: 'reconciliation gaps' },
      { value: '3ms', label: 'median write' },
    ],
    caseStudy: {
      Problem:
        'Balances were computed from five different tables. Finance reconciled by hand every month, and every edge case was a support ticket.',
      Approach:
        'Designed an append-only double-entry model with idempotency keys and event sourcing to Kafka. Wrote property-based tests for every invariant.',
      Outcome:
        'Month-end close went from four days to an automated report. Zero balance discrepancies since launch.',
    },
    links: { live: '', repo: '' },
    image: '/images/ledgerline-preview.webp',
  },
  {
    id: 'fieldnotes',
    title: 'Fieldnotes',
    kicker: 'Collaborative editor with CRDTs',
    year: 2023,
    role: 'Full-stack engineer',
    stack: ['React', 'TypeScript', 'Redis', 'WebSockets'],
    summary:
      'A local-first, multiplayer document editor that works offline and merges cleanly when you reconnect.',
    metrics: [
      { value: '50', label: 'live cursors / doc' },
      { value: '<50ms', label: 'sync on LAN' },
    ],
    caseStudy: {
      Problem: 'Teams in the field needed to take structured notes with patchy connectivity, without overwriting each other.',
      Approach:
        'Built on Yjs CRDTs with a Redis-backed presence layer and a custom React binding that keeps renders scoped to the changed block.',
      Outcome: 'Shipped to 3,000 field researchers; offline edits merge without conflicts.',
    },
    links: { live: '', repo: 'https://github.com/yourhandle/fieldnotes' },
    image: '',
  },
  {
    id: 'pulse',
    title: 'Pulse',
    kicker: 'Design system & data-viz kit',
    year: 2022,
    role: 'Frontend lead',
    stack: ['React', 'TypeScript', 'D3', 'Storybook'],
    summary:
      'A themeable component library and chart kit adopted by four product teams, documented down to the motion curves.',
    metrics: [
      { value: '120+', label: 'components' },
      { value: '−40%', label: 'UI defects' },
    ],
    caseStudy: {
      Problem: 'Four teams, four button styles, and charts that broke on every new dataset.',
      Approach:
        'Token-driven theming, headless primitives with accessible defaults, and a chart grammar built on D3 scales with React rendering.',
      Outcome: 'Teams ship UI roughly twice as fast. Accessibility audits pass by default.',
    },
    links: { live: '', repo: '' },
    image: '',
  },
  {
    id: 'hatch',
    title: 'Hatch',
    kicker: 'Open-source project scaffolder',
    year: 2021,
    role: 'Author & maintainer',
    stack: ['Node.js', 'TypeScript', 'CLI'],
    summary: 'A zero-config CLI that scaffolds typed full-stack apps with tests, CI and deploy targets wired up.',
    metrics: [
      { value: '2.1k', label: 'GitHub stars' },
      { value: '40', label: 'contributors' },
    ],
    caseStudy: {
      Problem: 'Every new service started with two days of copy-pasting configs from the last one.',
      Approach: 'Composable templates, a plugin API and snapshot-tested generators.',
      Outcome: 'Used by teams at several companies; new services go from idea to deploy in under an hour.',
    },
    links: { live: '', repo: 'https://github.com/yourhandle/hatch' },
    image: '',
  },
]

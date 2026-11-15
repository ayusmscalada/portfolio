/**
 * 03 / services: your career, as a git log.
 *
 * Newest first. Commit hashes are generated from company + role, so they
 * stay stable. `ref` is an optional git-style label: 'HEAD → main',
 * 'tag: v2.0', 'origin/freelance'. `end: null` means "present".
 * Each highlight renders as a "+" line in the diff; lead with the impact.
 */
export const experience = {
  title: 'The *journey* so far.',
  lede: 'Roles, newest first, each with what actually changed because I was there.',

  roles: [
    {
      company: 'Company One',
      role: 'Senior Full-stack Engineer',
      start: '2023',
      end: null,
      location: 'Remote',
      ref: 'HEAD → main',
      summary:
        'Tech lead on the core platform team, owning the realtime data layer and the customer-facing dashboard.',
      highlights: [
        'Cut p95 API latency from 820ms to 190ms by redesigning the caching and query layer',
        'Led the migration from a legacy monolith to typed services with zero customer-facing downtime',
        'Introduced a design system that reduced UI defects by ~40% across four product teams',
        'Mentored five engineers; two promoted to senior within 18 months',
      ],
      stack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
    },
    {
      company: 'Company Two',
      role: 'Full-stack Engineer',
      start: '2020',
      end: '2023',
      location: 'Hybrid · City',
      ref: 'tag: v2.0',
      summary:
        'Early engineer at a fintech scale-up; built payment flows and the internal tooling that ran operations.',
      highlights: [
        'Built a double-entry ledger service processing $40M+ per month',
        'Shipped onboarding that lifted activation from 31% to 52%',
        'Set up CI/CD and preview environments; deploys went from weekly to 20+ per day',
      ],
      stack: ['Next.js', 'NestJS', 'PostgreSQL', 'Kafka', 'Terraform'],
    },
    {
      company: 'Company Three',
      role: 'Frontend Engineer',
      start: '2018',
      end: '2020',
      location: 'On-site · City',
      summary: 'Product engineer on a B2B analytics suite with heavy data visualisation.',
      highlights: [
        'Rebuilt the charting engine on canvas, rendering 1M+ points at 60fps',
        'Drove the accessibility programme to WCAG 2.1 AA',
      ],
      stack: ['React', 'Redux', 'D3', 'GraphQL'],
    },
    {
      company: 'Independent',
      role: 'Freelance Web Developer',
      start: '2016',
      end: '2018',
      location: 'Remote',
      ref: 'initial commit',
      summary: 'Websites and web apps for agencies and small businesses. Learned to own everything end-to-end.',
      highlights: ['Delivered 25+ client projects from discovery to deployment'],
      stack: ['JavaScript', 'PHP', 'MySQL', 'WordPress'],
    },
  ],
}

/**
 * 02 / api: skills, exposed as endpoints.
 *
 * Each endpoint expands to show a JSON "response". The keys inside
 * `response` are free-form: rename them (core / fluent / exploring) or add
 * your own; they render in order. `latency` is purely decorative.
 */
export const capabilities = {
  title: 'Capabilities, *exposed* as endpoints.',
  lede: 'Every layer of the stack, one request away. Open an endpoint to inspect the response.',

  endpoints: [
    {
      method: 'GET',
      path: '/frontend',
      title: 'Interfaces & product engineering',
      description:
        'Accessible, fast, design-system-driven UIs. I live in the gap between design and code: motion, states, edge cases, and the details that make software feel considered.',
      latency: 12,
      response: {
        core: ['React', 'TypeScript', 'Next.js', 'CSS architecture'],
        fluent: ['Vite', 'TanStack Query', 'Zustand', 'Storybook', 'Web Animations'],
        exploring: ['React Server Components', 'View Transitions API'],
      },
    },
    {
      method: 'POST',
      path: '/backend',
      title: 'APIs & distributed services',
      description:
        'Well-typed, well-documented APIs with clear contracts. Event-driven where it helps, a plain monolith where it does not.',
      latency: 24,
      response: {
        core: ['Node.js', 'TypeScript', 'REST', 'GraphQL'],
        fluent: ['NestJS', 'Fastify', 'Go', 'Python', 'tRPC'],
        exploring: ['Rust', 'Effect-TS'],
      },
    },
    {
      method: 'PUT',
      path: '/data',
      title: 'Data modelling & storage',
      description:
        'Schemas that age well, migrations that do not wake anyone up, and queries that stay fast at 100× the data.',
      latency: 31,
      response: {
        core: ['PostgreSQL', 'Redis', 'Prisma / Drizzle'],
        fluent: ['MongoDB', 'Kafka', 'Elasticsearch', 'S3'],
        exploring: ['ClickHouse', 'pgvector'],
      },
    },
    {
      method: 'PATCH',
      path: '/infrastructure',
      title: 'Cloud, delivery & reliability',
      description:
        'Infrastructure as code, pipelines that go green in minutes, and enough observability to answer “why” before anyone asks.',
      latency: 18,
      response: {
        core: ['AWS', 'Docker', 'Terraform', 'GitHub Actions'],
        fluent: ['Kubernetes', 'Cloudflare', 'Vercel', 'Grafana'],
        exploring: ['OpenTelemetry', 'Nix'],
      },
    },
    {
      method: 'GET',
      path: '/practices',
      title: 'How I work',
      description:
        'The non-code parts of the job that make the code matter: testing strategy, reviews, mentoring and writing things down.',
      latency: 9,
      response: {
        core: ['Testing (unit → e2e)', 'Code review', 'System design', 'Accessibility'],
        fluent: ['Mentoring', 'Technical writing', 'Incident response'],
        exploring: ['AI-assisted workflows'],
      },
    },
  ],
}

# Portfolio — Systems Atelier

A responsive, live engineering portfolio: an interactive WebGL particle core in the hero, an animated monogram emblem, glass cards with a cursor spotlight, LIVE/GITHUB/PRIVATE project status, a live local clock and availability signal. Built with React, Vite, CSS Modules, a hand-written WebGL renderer (no 3D library), self-hosted Inter and JetBrains Mono, and a generated subset of Phosphor icons.

## Run locally

```sh
npm install
npm run dev
npm run build
npm run preview
```

## Personalize

All personal content lives in `src/data/`:

| File | Content |
| --- | --- |
| `profile.js` | Name, role, monogram (emblem + favicon), hero headline and rotating "I build …" phrases, email, timezone (live clock), availability, socials, résumé |
| `projects.js` | Featured projects, archive, technology tags, images, case studies |
| `about.js` | Biography, current interests, statistics, principles |
| `capabilities.js` | Skill cards: `level` drives the proficiency bar, `icon` picks the glyph, tiers render as 5/4/3 dots |
| `experience.js` | Roles and career highlights |
| `sections.js` | Section order, nav labels and icons |

The supplied name, links, achievements, and experience remain template content; replace them before publishing. Atlas and Ledgerline previews in `public/images/` are generated interface concepts, not screenshots of live products. Replace them with your actual product captures when available.

Projects with an `image` display it in the card and case study (use WebP, ~1200px wide); others get a generative cover. Status badges are automatic: LIVE when `links.live` is set, GITHUB when only `links.repo` is set, otherwise PRIVATE (override with `status`). The first three projects show by default; the rest sit behind "Show more", and technology chips filter the list.

## Design and interaction

Shared visual tokens are in `src/styles/tokens.css`; section styles use CSS Modules. Text wrapped in `*asterisks*` renders with the animated cyan → violet gradient.

- **Particle core** (`src/components/ParticleCore/`): a breathing sphere of 5–11k points (scaled to the device) that reacts to the pointer, sends a shockwave on click, pulses on its own, and unfolds into a particle wave as you scroll. One draw call; all motion runs in the vertex shader.
- **Emblem** (`src/components/Emblem/`): SVG crest built from your monogram with orbit rings, an energy trace, flare and sparks; tilts toward the cursor.
- **Live signals**: local clock and availability in the nav, live hero telemetry (particles / fps), LIVE project badges, a beacon on your current role.
- Ctrl/Cmd+K or `/` opens the command menu (also the mobile menu). Case studies support ←/→ and Escape.

## Performance

- The WebGL engine is a separate ~8 KB chunk, fetched only after the page has loaded, painted and gone idle; a CSS glow stands in until then or if WebGL is unavailable. Its render loop stops when the hero is offscreen or the tab is hidden.
- Below-the-fold sections use `content-visibility: auto`, so first paint only lays out the hero.
- Icons come from `src/components/ph.jsx`, a generated subset of Phosphor with only the weights used. To add one, list it in `scripts/gen-icons.mjs` and run `npm run icons`.
- `prefers-reduced-motion` freezes the core to a single still frame and disables decorative animation.

# Portfolio — "The Request"

A full-stack developer's portfolio told as a full-stack request.
Scrolling sends one HTTP request down the stack and back. A packet travels the rail on the left, and each section is a layer:

| #  | Layer       | Section      | Metaphor                                         |
| -- | ----------- | ------------ | ------------------------------------------------ |
| 00 | `/request`  | Intro        | Kinetic variable-font name that swells under the cursor |
| 01 | `/client`   | About        | Statement, "currently", live counters, principles |
| 02 | `/api`      | Capabilities | Skills as API endpoints with JSON responses      |
| 03 | `/services` | Experience   | Career as a `git log --graph`                    |
| 04 | `/data`     | Projects     | Records you filter with a live SQL query         |
| 05 | `/response` | Contact      | `200 OK` with response headers                   |

Built with **React 19 + Vite**, CSS Modules and design tokens. There's no UI or animation library; the only runtime dependencies are React and self-hosted fonts.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve the build
```

## Make it yours

All content lives in `src/data/`. You shouldn't need to touch components to fill in your story.

| File                         | What it controls                                                   |
| ---------------------------- | ------------------------------------------------------------------ |
| `src/data/profile.js`        | Name, role, tagline, email, location, timezone, socials, résumé link. Also fills `<title>` and meta tags. |
| `src/data/about.js`          | About title, statement, paragraphs, "currently", stats, principles |
| `src/data/capabilities.js`   | Endpoints (skills). `response` keys are free-form.                 |
| `src/data/experience.js`     | Roles, newest first. Highlights render as `+` diff lines.          |
| `src/data/projects.js`       | Projects plus case studies. Tags shared by 2+ projects become filter chips. |
| `src/data/sections.js`       | Section order, ids, layer names and labels (rail, header and ⌘K menu follow). |

**Emphasis markup:** in any text field, wrap words in `*asterisks*` to render them in the italic serif accent face, e.g. `'I build *resilient* systems'`.

**Project images:** each project gets a generative cover drawn from its `id`. To use a real screenshot, put it in `public/projects/` and set `image: '/projects/name.jpg'`.

**Résumé:** drop `resume.pdf` in `public/` and set `resumeUrl: '/resume.pdf'`. It then appears in Contact and the ⌘K menu.

## Design system

`src/styles/tokens.css` is the single place to re-skin the site:

- **Type:** Bricolage Grotesque (variable weight + optical size) for display and body, Instrument Serif italic for emphasis, JetBrains Mono for technical labels. All are self-hosted via Fontsource.
- **Fluid type scale:** `--text-xs` … `--text-hero`, interpolated linearly between 360px and 1440px viewports.
- **Themes:** `[data-theme='dark' | 'light']`. Toggling uses a circular View Transition reveal.
- **Accents:** `[data-accent='signal' | 'acid' | 'ion' | 'plasma']`. Change `--accent-fill` or add your own. Light mode derives a darker, text-safe variant automatically.
- **Shape:** `--radius: 0px` keeps everything sharp. Raise it for a softer look.

## Interaction details

- **⌘K / Ctrl+K** (or `/`) opens the command menu: navigate, copy email, switch theme, cycle accent, open socials.
- In the project sheet, **← / →** step through the currently filtered records; **Esc** closes it.
- Respects `prefers-reduced-motion`: the kinetic type, reveals and counters switch off.
- Accessibility: semantic landmarks, skip link, real `<dialog>` modals with focus trapping, labelled controls, visible focus rings.

## Project structure

```
src/
  data/          ← your content (edit these)
  styles/        tokens.css (design system), base.css (reset + shared motion)
  components/    Hud, StackRail, CommandPalette, KineticText, Cover, SectionHead, motion/*
  sections/      Hero, About, Capabilities, Experience, Projects, Contact
  context/       UIContext: theme, accent, palette, toasts, clipboard
  hooks/ lib/    useInView, useMediaQuery, scrollSpy store, hashing, rich-text
```

# Portfolio — Systems Atelier

An immersive 3D portfolio: scroll to fly a camera through a three.js world (a crystal core, your emblem as a glass crest, a skills solar system, a gallery of project screens, a light-highway of roles and a portal), with content managed from a hidden admin page backed by Supabase. Built with React, Vite, three.js and CSS Modules.

## Run locally

```sh
npm install
npm run dev
npm run build
npm run preview
```

## Personalize

All personal content (profile, hero, about, skills, projects, experience, contact) is stored in **Supabase** and edited from the hidden admin page. The public site only reads it. `src/data/content.json` is the starter content and the fallback when Supabase is unreachable. `src/data/sections.js` holds the section order, nav labels and icons. In text fields, `*word*` adds the gradient accent and `{years}` inserts the years since `profile.since`.

## Supabase setup (once)

1. Create a Supabase project. In **SQL Editor**, run [`supabase/setup.sql`](supabase/setup.sql). It creates:
   - the `portfolio_content` table (public read, admin write),
   - the `portfolio_admins` table,
   - the public `portfolio` image bucket.
2. **Authentication → Users → Add user**: create your login (tick *Auto Confirm User*). Then run the `insert into public.portfolio_admins …` line at the bottom of the SQL file with your email. Turn off public sign-ups in **Authentication → Sign In / Providers**: only listed admins can write anyway, but nobody needs to sign up.
3. Copy **Project URL** and the **anon / publishable key** (Project Settings → API) into `.env.local`, and into your host's environment variables:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=...
   ```

   Both values are public by design; row-level security is what protects writes. Restart `npm run dev` after changing them.

## Admin page

Open `/<admin path>` (it is not linked anywhere, and the bundle stores only a hash of it) and sign in with your Supabase admin account. The page has a form for every section, and a live preview that updates as you type.

- **Saving:** press **Save** (or Ctrl/⌘ + S) to write to Supabase. Visitors see the change on their next page load, with no rebuild or redeploy.
- **First save:** on the first visit the table is empty, so the admin starts from the starter content and the first save publishes it.
- **Images:** uploaded images are resized, converted to WebP, and stored in the `portfolio` bucket.

The site starts the Supabase request from `index.html`, in parallel with the JavaScript download, and renders once it arrives. If Supabase is down, it waits at most 2.5 s before rendering the starter content.

The supplied name, links, achievements, and experience remain template content; replace them before publishing. Atlas and Ledgerline previews in `public/images/` are generated interface concepts, not screenshots of live products. Replace them with your actual product captures when available.

Projects with an `image` display it in the card and case study (use WebP, ~1200px wide); others get a generative cover. Status badges are automatic: LIVE when `links.live` is set, GITHUB when only `links.repo` is set, otherwise PRIVATE (override with `status`). The first three projects show by default; the rest sit behind "Show more", and technology chips filter the list.

## Design and interaction

The whole site is one 3D world (three.js, `src/world/`) that you fly through as you scroll. Each section marks its camera stops with `data-stage`, and the camera glides along a spline between them. It pauses at each stop, sways with the pointer, and widens its field of view (with star streaks) when you scroll fast.

| Stop | What you see |
| --- | --- |
| Hero (`core.js`) | A crystal core with a burning heart, a particle shell that parts around the pointer and ripples on click, a wire cage and orbit rings with satellites |
| About (`crest.js`) | Your emblem as a 3D glass crest with neon edges, a glowing monogram and orbiting light trails |
| Skills (`system.js`) | A solar system, one planet per skill card. While you scroll, it turns each planet to the front; the planet grows and shows its core skills as moons |
| Projects (`gallery.js`) | Floating screens showing each project's image (or a generated cover). The section pins, and the camera visits each screen |
| Journey (`journey.js`) | A hexagonal gate per role along a light-highway; the current role pulses |
| Contact (`portal.js`) | A swirling portal pulling particles in |
| Throughout (`space.js`) | Stars, nebulae and warp streaks |

Skills and Projects use the pinned `Reel` component (`src/components/Reel/`): one panel that swaps content per stop.

Content-driven parts (planets, screens, gates, monogram) rebuild when content changes, including live in the admin preview. The light theme switches the world to a "blueprint" look. Shared tokens are in `src/styles/tokens.css`, and text in `*asterisks*` gets the animated gradient.

Ctrl/Cmd+K or `/` opens the command menu (also the mobile menu). Case studies support ←/→ and Escape. The nav's pause button freezes all motion; the camera then jumps between stops.

## Performance

- three.js and the scene are a separate chunk (~145 KB gzip). It is fetched only after the page has loaded, painted and gone idle, so first paint is unchanged; a CSS nebula stands in until then, or if WebGL is unavailable.
- **Phones and touch devices:** no bloom, fewer particles, and a lower pixel ratio.
- **Desktop:** half-resolution bloom.
- The render loop stops while the tab is hidden; with motion paused, it renders only when you scroll.

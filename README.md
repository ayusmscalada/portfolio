# Portfolio - Systems Atelier

A simple, clear one-page portfolio with content managed from a hidden admin page backed by Supabase. Built with React, Vite and CSS Modules.

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
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=...
   ```

   Both values are public by design; row-level security is what protects writes. Restart `npm run dev` after changing them.

## Admin page

Open `/<admin path>` (it is not linked anywhere, and the bundle stores only a hash of it) and sign in with your Supabase admin account. The page has a form for every section, and a live preview that updates as you type.

- **Saving:** press **Save** (or Ctrl/⌘ + S) to write to Supabase. Visitors see the change on their next page load, with no rebuild or redeploy.
- **First save:** on the first visit the table is empty, so the admin starts from the starter content and the first save publishes it.
- **Images:** uploaded images are resized, converted to WebP, and stored in the `portfolio` bucket.

The site starts the Supabase request from `index.html`, in parallel with the JavaScript download, and renders once it arrives. If Supabase is down, it waits at most 2.5 s before rendering the starter content.

The supplied name, links, achievements, and experience remain template content; replace them before publishing. Atlas and Ledgerline previews in `public/images/` are generated interface concepts, not screenshots of live products. Replace them with your actual product captures when available.

Projects with an `image` display it in the card and case study (use WebP, ~1200px wide); others get a generative cover. Status badges are automatic: LIVE when `links.live` is set, GITHUB when only `links.repo` is set, otherwise PRIVATE (override with `status`).

## Design and interaction

A single page with plain sections: Hero (your logo emblem), About, Skills (one card per area), Projects (a card grid; each card opens a case study), Experience and Contact. Shared tokens are in `src/styles/tokens.css`, the shared `.card` style is in `src/styles/base.css`, and text in `*asterisks*` is shown in the accent colour.

Ctrl/Cmd+K or `/` opens the command menu (also the mobile menu). Case studies support ←/→ and Escape.

## Performance

- No 3D or canvas libraries: the public page is one small bundle (~91 KB gzip JS) plus CSS.
- Sections fade in with a short CSS transition; the OS "reduce motion" setting turns it off.

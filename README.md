# Portfolio - Systems Atelier

A simple, clear one-page portfolio with content managed from a hidden admin page. The site and its backend deploy together on Vercel: the backend runs as serverless functions under `/api` and keeps everything in Vercel Blob. Built with React, Vite and CSS Modules.

## How it fits together

```
browser (site + admin)  ──►  /api  (server/app.js, Vercel function)  ──►  Vercel Blob (content.json + files)
```

- The browser only talks to `/api`. The storage token and admin password exist only on the server.
- The public site loads its content from `GET /api/content` (the `content.json` blob). Open pages re-check every minute and whenever the tab comes back into view, so an admin save shows up on its own, within a few seconds.
- Images and résumés are stored as `projects/…` and `resumes/…` blobs and served by the backend at `/api/files/…`, so they work with public and private Blob stores.
- The admin signs in with one password (`ADMIN_PASSWORD`) through `/api/auth/login` and gets a signed session token; every write (`/api/admin/…`) checks it. Changing the password signs every session out.
- Uploads go through the backend (max 4 MB each, a Vercel limit).

## Run locally

```sh
npm install
npm run dev       # site + /api on http://127.0.0.1:5173
npm run build
npm run preview   # built site + /api on http://127.0.0.1:4173
```

The dev server mounts the same backend handler, so there is one server and one port. It needs `BLOB_READ_WRITE_TOKEN` and `ADMIN_PASSWORD` in `.env.local` (see [`.env.example`](.env.example)); copy the token from Vercel → Storage → your Blob store → **.env.local** tab. Local development uses the same Blob store as the live site, so saves made locally go live too.

## Personalize

All personal content (profile, hero, about, skills, projects, experience, contact) is edited from the hidden admin page. `src/data/content.json` is the starter content and the fallback when the backend is unreachable. `src/data/sections.js` holds the section order, nav labels and icons. In text fields, `*word*` shows in the accent colour and `{years}` inserts the years since `profile.since`.

## Deploy on Vercel

1. Import the repository in Vercel. It detects Vite; keep the defaults (build `npm run build`, output `dist`). The `api/` folder becomes the backend automatically, and [`vercel.json`](vercel.json) routes `/api/*` to it and everything else to the site.
2. **Storage → Create → Blob**, and connect the store to the project. Vercel adds `BLOB_READ_WRITE_TOKEN` for you.
3. **Settings → Environment Variables:** add `ADMIN_PASSWORD`.
4. Deploy (or **Redeploy** after changing variables: they only apply to new deployments). Check `https://<your-site>/api/health`: it should say `"storage": true` and `"adminPassword": true`.

Content changes need no redeploy: save in the admin and the live site picks them up.

**Backend on a separate domain (optional):** if you deploy the backend as its own Vercel project, set `ALLOWED_ORIGINS=https://<your-site>` on the backend and `API_URL=https://<your-backend>` on the site (the site needs a rebuild after changing `API_URL`).

## Admin page

Open `/<admin path>` (it is not linked anywhere, and the bundle stores only a hash of it) and enter the admin password. The page has a form for every section, and a live preview that updates as you type.

- **Saving:** press **Save** (or Ctrl/⌘ + S). The backend stores it; visitors see it within seconds, with no rebuild or redeploy.
- **First save:** if nothing is stored yet, the admin starts from the starter content and the first save publishes it.
- **Images:** uploads are resized and converted to WebP in the browser, then stored through the backend. Images you remove or replace are deleted from storage when you save.
- **Résumés:** upload PDF or Word files, pick the one visitors see, delete old ones (deleted from storage too).
- **Projects:** the eye button shows or hides a project on the site.

The site starts the content request from `index.html`, in parallel with the JavaScript download. If the backend is down, it waits at most 2.5 s before rendering the starter content.

The supplied name, links, achievements, and experience remain template content; replace them before publishing. Atlas and Ledgerline previews in `public/images/` are generated interface concepts, not screenshots of live products. Replace them with your actual product captures when available.

Projects with an `image` display it in the card and case study (use WebP, ~1200px wide); others get a generative cover. Status badges are automatic: LIVE when `links.live` is set, GITHUB when only `links.repo` is set, otherwise PRIVATE (override with `status`).

## Design and interaction

A single page with plain sections: Hero (your logo emblem), About, Skills (one card per area), Projects (a card grid; each card opens a case study), Experience and Contact. Shared tokens are in `src/styles/tokens.css`, the shared `.card` style is in `src/styles/base.css`, and text in `*asterisks*` is shown in the accent colour.

Ctrl/Cmd+K or `/` opens the command menu (also the mobile menu). Case studies support ←/→ and Escape.

## Performance

- No 3D or canvas libraries: the public page is one small bundle (~91 KB gzip JS) plus CSS.
- Sections fade in with a short CSS transition; the OS "reduce motion" setting turns it off.

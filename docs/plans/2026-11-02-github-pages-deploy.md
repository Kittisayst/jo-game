# Deploy the game to GitHub Pages

- **Date:** 2026-11-02
- **Status:** steps 1, 2, 3, 6 done (font URLs, workflow, local check under /jo-game/, docs); steps 4 and 5 (turn Pages on, first deploy) wait for the owner
- **Project:** jo-game (Knowledge Quest)

## Goal

Publish the production build of the game at `https://kittisayst.github.io/jo-game/` (repository `Kittisayst/jo-game`), rebuilt automatically from `main` by GitHub Actions, so classmates can play in a browser with no install.

## Current context (read from the repository)

- Build: `npm run build-nolog` → `vite build --config vite/config.prod.mjs`, output `dist/`. `base: './'` is already set, so built JS/CSS/HTML use relative URLs and work under the `/jo-game/` sub-path. `npm run build` also sends an anonymous ping (`log.js`): CI must use `build-nolog`.
- Game data and art are fetched with relative paths (`fetch('data/items.json')`, Phaser loads `assets/...`), which also work under a sub-path. The whole `public/` folder is about 4.5 MB, far under the Pages limit.
- **Known break under a sub-path:** `public/style.css` has six `url('/fonts/noto-sans-lao/...')` entries (absolute from the site root). Vite does not rewrite the contents of a file in `public/`, so on `…github.io/jo-game/` those requests go to `github.io/fonts/...` and 404. `index.html` also has `/style.css` and `/favicon.png`; Vite rewrites those two with `base`, so they are fine. The page still has the Google Fonts link as a fallback, so the failure would be silent (wrong font offline), not a blank page.
- Saves, settings and the active-session key live in `localStorage` of the origin `kittisayst.github.io`; the key names are fixed, so nothing there depends on the path. (Other projects on the same user page share that origin, so keys should keep their game prefix.)
- Dev-only hooks (`?stage=N`, `window.__entities`, `__eventBus`, `__advanceClock`) are guarded by `import.meta.env.DEV`, so they are not in the production build; to be confirmed in step 3.
- There is no `.github/workflows` folder yet and the remote is `https://github.com/Kittisayst/jo-game.git`.
- Audio starts only after a click (the title menu already needs one), so browser autoplay rules are not a problem.

## Approach

GitHub Actions with the official Pages actions (`actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`), triggered on push to `main` and by hand. This needs no `gh-pages` branch and no extra npm package. The build runs the checks first (`tsc`, `lint`, unit tests); Playwright is not run in CI (about 7 minutes and flaky under load, see the e2e notes), it stays a local check.

The font URLs are fixed by making them relative (`url('fonts/…')`, the CSS file sits in the site root next to `fonts/`), which works at `/` in dev and at `/jo-game/` in production with no build step.

## Steps

1. **Fix the absolute URLs**: in `public/style.css` change the six `url('/fonts/...')` to `url('fonts/...')`. Check in dev (font still loads) and in `vite preview`.
2. **Add the workflow** `.github/workflows/deploy.yml`: on `push` to `main` and `workflow_dispatch`; permissions `contents: read`, `pages: write`, `id-token: write`; concurrency group `pages`; job `build` (checkout, `actions/setup-node` with Node 20 and npm cache, `npm ci`, `npx tsc --noEmit -p tsconfig.json`, `npm run lint`, `npm run test`, `npm run build-nolog`, `configure-pages`, `upload-pages-artifact` with `path: dist`) and job `deploy` (`deploy-pages`, environment `github-pages`). Pin the action versions.
3. **Check the production build locally**: `npm run build-nolog`, then `npx vite preview --config vite/config.prod.mjs --base /jo-game/` (or serve `dist/` under a `/jo-game/` folder) and play: title menu, village, enter Stage 1, save and reload (Continue), open the Smithy and the Shop. Confirm the browser console has no 404 and that `window.__entities` is undefined.
4. **Turn Pages on** (the owner does this once in the browser): repository Settings → Pages → Source: GitHub Actions. This is a repository setting, so it is left to the user.
5. **First deploy**: merge to `main` (or run the workflow by hand), wait for the green run, open the URL, repeat the play check on a phone (touch layout) and on desktop.
6. **Docs**: a short "Deploy" section in `README.md` (URL, how a deploy happens, that `npm run build` pings and CI uses `build-nolog`); note in `CLAUDE.md` Commands that `main` deploys automatically.

## Files affected

- `public/style.css` — relative font URLs (six lines)
- `.github/workflows/deploy.yml` — new
- `README.md`, `CLAUDE.md` — deploy notes
- `vite/config.prod.mjs` — no change expected (`base: './'` is right); only if step 3 finds a problem

## Risks / open questions

- **Branch flow:** the work lives on `feat/smithy-and-chanthy-shop` and many commits are unpushed on local `main`. The first deploy happens when this reaches `main` on GitHub: decide whether to open a PR from the feature branch first (recommended) or push `main` directly.
- **Repository visibility:** GitHub Pages on a private repository needs a paid plan. If `Kittisayst/jo-game` is private, either make it public or use another host (Netlify, Cloudflare Pages). To be checked by the owner.
- **Cache after a deploy:** Pages serves with a short cache; a player with the old tab open can load new `data/*.json` with old JS. Low risk for a classroom game; a query-string version on the data fetch can be added if it ever shows.
- **Save compatibility:** the deployed game and the local game use different origins, so saves are not shared; saves cannot be moved between them except by the existing export/import box in Settings.
- **Custom domain** (optional later): would change `base` to `/`; `./` still works there, so nothing to redo.
- The anonymous template ping in `npm run build` must never run in CI (use `build-nolog`).
- Quest rewards that pay Credit (ADR 0005 conflict) and the HUD height test (118 px against a 112.5 px limit) are still open and are not deploy blockers, but should be settled before classmates play.

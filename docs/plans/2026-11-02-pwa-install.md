# Make the game an installable PWA (Add to Home screen, full screen, offline)

- **Date:** 2026-11-02
- **Status:** done in code (PR open); the check on a real phone (step 8) waits for the owner
- **Project:** jo-game (Knowledge Quest)

## Goal

On a phone or tablet the player can choose "Add to Home screen" (or "Install app") and open the game from an icon **without the browser bars**, in landscape, and play **offline** once it has been opened. Deployed on GitHub Pages at `https://kittisayst.github.io/jo-game/` (see [the deploy plan](2026-11-02-github-pages-deploy.md)).

Decided with the user (2026-11-02): use `vite-plugin-pwa` (a new dev dependency), with offline play.

## Context now (read from the repository)

- `index.html` has a viewport meta without `viewport-fit=cover`, no `theme-color`, no manifest link, no `apple-touch-icon`. The only icon is `public/favicon.png` (32×32).
- The only logo is `public/assets/ui/logo_crest.png`, **64×64** pixel art. Icons of 192 and 512 px need a clean enlargement; scaling a 64 px image up smoothly would be blurry, so the icon is made with nearest-neighbour scaling on a solid background (matches the pixel style) or drawn by a script in `tools/art/`.
- The game is 1280×720 with `Scale.FIT` and `autoCenter` (`main.ts`), so it already fills any window by letterboxing. The CSS already uses `env(safe-area-inset-*)` for the HUD corners (lines ~123 and ~1358 of `style.css`), but `viewport-fit=cover` is not set, so those insets stay 0 until it is added.
- The production build uses `base: './'` and is served under `/jo-game/` (checked). `public/data/*.json` is fetched with relative URLs. The whole `public/` folder is about 4.5 MB.
- Vite 6, `@vitejs/plugin-react` 4, Node 22 in CI. `vite/config.prod.mjs` is the only config that needs the plugin; the dev server does not need a service worker.
- No code asks for full screen today (`requestFullscreen` is not used).

## Approach

1. **Manifest + service worker from `vite-plugin-pwa`** in `vite/config.prod.mjs` only, `registerType: 'autoUpdate'`, Workbox `generateSW` that precaches the built JS/CSS/HTML and everything under `assets/`, `data/` and `fonts/` (`globPatterns` for `png, json, ttf, mp3, ogg, wav, svg`). Precache fits the size (about 5 MB) and gives a consistent offline copy where code and `data/*.json` always come from the same version, which avoids old JS reading new data.
2. **Manifest values:** `name` "ພະຈົນໄພຄວາມຮູ້ - Knowledge Quest", `short_name` "Knowledge Quest", `display: "fullscreen"` with `display_override: ["fullscreen", "standalone"]` (Android; iOS ignores fullscreen and uses standalone from the meta tags), `orientation: "landscape"`, `start_url: "./"`, `scope: "./"` (so it works under `/jo-game/`), `background_color` and `theme_color` from the title menu colour (`#0b0720`, the Title scene background), `lang: "lo"`, icons 192 and 512 (`purpose: "any"`) plus a 512 maskable one.
3. **Icons:** generate `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` and `apple-touch-icon.png` (180×180) from `logo_crest.png` by nearest-neighbour scaling on the dark background, with the maskable one padded to the 80% safe zone. A small script `tools/art/build_pwa_icons.py` (Pillow, like the other art tools) so they can be rebuilt.
4. **`index.html`:** `<link rel="manifest">` is added by the plugin; add `theme-color`, `apple-touch-icon`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` (`black-translucent`), `apple-mobile-web-app-title`, and `viewport-fit=cover` in the viewport meta so the safe-area insets start working on notched phones.
5. **Update behaviour (as built):** `autoUpdate` + `clientsClaim` + `skipWaiting`, registered with `injectRegister: 'script'` (no source import, so no virtual module in dev/Vitest). The page does **not** reload itself (that could cut a game short); an inline script in `index.html` calls `registration.update()` on load and when the tab comes back, and the new version is used from the next open. Checked: after a data change and one reload plus a few seconds, the new value is served.
6. **In-game full-screen button:** a browser tab (not installed) cannot hide its bar without a user gesture. Add a small Fullscreen toggle in the Settings window (and the title menu) calling `document.documentElement.requestFullscreen()`, shown only when the page is not already in standalone/fullscreen display mode and the API exists (not on iPhone Safari, where it does not exist; there the answer is "Add to Home screen").
7. **Landscape:** the manifest locks landscape on Android; on iPhone it cannot be locked, so show a one-line "turn your phone sideways" hint in portrait on touch devices (a CSS media query overlay, no JS), because FIT in portrait makes the game tiny.
8. **CI:** no workflow change expected (the plugin runs inside `npm run build-nolog`). Add the new dependency to `package-lock.json` (`npm install -D vite-plugin-pwa`), which CI installs with `npm ci`.

## Steps

1. Write `tools/art/build_pwa_icons.py`, generate the four icons, look at them at 48 px and 192 px (is the crest still readable?).
2. `npm install -D vite-plugin-pwa`; configure it in `vite/config.prod.mjs` (manifest, icons, `globPatterns`, `autoUpdate`, `navigateFallback` off since there is a single page with no routes).
3. Edit `index.html` (meta tags, `viewport-fit=cover`); register the service worker in `src/main.tsx` for production only.
4. Settings: the Fullscreen toggle (React component, no game rule; a `StyleClasses.test.ts`-safe class list) and the portrait hint in `style.css`.
5. Build and check locally: `npm run build-nolog`, `npx vite preview --config vite/config.prod.mjs --base /jo-game/`; in DevTools → Application: manifest has no errors, the service worker is "activated", "Installable" is shown; turn the network off and reload: the game still starts and plays a Stage.
6. Check an update: change a data value, rebuild, reload twice; the new value appears without clearing storage.
7. Unit/e2e: existing suites must stay green (the service worker is production-only). Add one Playwright check against `vite preview` is optional; the manual checks above are the real test.
8. PR, merge, wait for the deploy; on a real Android phone (Chrome → menu → Install app) and an iPhone (Safari → Share → Add to Home Screen) check: icon, splash, no browser bar, landscape, touch buttons not under the notch, save survives a restart, works in airplane mode.
9. Docs: README "Install on a phone" section, `CLAUDE.md` Commands note (PWA is production-only), this plan's status.

## Files affected

- `vite/config.prod.mjs` — plugin, manifest, workbox
- `package.json`, `package-lock.json` — `vite-plugin-pwa` (new dev dependency)
- `index.html` — meta tags, `viewport-fit=cover`
- `src/main.tsx` — production-only service worker registration
- `src/infrastructure/react/components/SettingsModal.tsx` (and the title menu) — Fullscreen toggle
- `public/style.css` — portrait hint
- `public/icons/*`, `tools/art/build_pwa_icons.py` — new
- `tsconfig*.json` or a `.d.ts` — PWA virtual module types
- `README.md`, `CLAUDE.md`, `docs/plans/HISTORY.md`

## Risks / open questions

- **Stale cache after a deploy:** the main risk of any service worker. `autoUpdate` plus precaching the whole build keeps code and data together; still needs the update check in step 6, and a "clear site data" tip for the classroom if a phone gets stuck.
- **iPhone:** no `fullscreen`, no orientation lock, and Safari keeps storage for the installed app separate from the Safari tab, so a save made in the browser is not seen in the installed app (the Settings export/import box can move it). Say this in the README.
- **Audio:** browsers allow sound only after a tap; the start menu already needs one, so no change, but check it in the installed app.
- **Icon quality:** a 64 px crest enlarged to 512 px is pixelated by design; if the user prefers a smoother icon, a new drawn icon is needed (art decision for the user).
- **Different origin:** `kittisayst.github.io` is shared by every project of this user; the service worker `scope` is limited to `/jo-game/`, so it cannot affect them, but localStorage keys are shared per origin and should keep their game-specific names (they do).
- **Size:** precache is about 5 MB on first load; fine on school Wi-Fi, noticeable on mobile data. Could be split later (runtime caching for rarely used art), not needed now.
- **Not tested by the author:** installing on a real phone cannot be done from this development environment, so step 8 is the user's check.
- Open decisions for the user: the icon art (use the crest or a new one), and whether the game should ask for fullscreen automatically on the first tap (not recommended: it surprises players).

# design-sync notes — @saltytaco/design-system

- The DS lives in `design-system/` inside the website repo (not a monorepo). Build with `npm run build` there (esbuild bundle + `tsc --emitDeclarationOnly` + CSS concat).
- Converter invocation: `--node-modules design-system/node_modules --entry ./design-system/dist/index.js`. `react` AND `react-dom` must be devDeps of `design-system/` (react-dom@18 — the vendored UMD builds don't exist in react 19).
- `dist/styles.css` is built self-contained: `build.mjs` inlines `src/tokens.css` ahead of the component CSS because a relative `@import "./tokens.css"` dangles when the converter copies the file to `_ds_bundle.css` (`[CSS_IMPORT_MISSING]`).
- Fonts are system stacks (Brush Script MT / Georgia / system-ui) — nothing to ship, no `[FONT_MISSING]`.
- No provider needed; components are plain CSS-class based.
- Known render warns: none recorded (last full validate was clean; the earlier `[RENDER_THIN]` on ChalkMenuItem was the pre-authoring floor card).
- `ds-bundle/tokens/` and `guidelines/` emit empty (tokens inlined in stylesheets) — nothing uploads for them; not an error.

## Re-sync risks

- Grades key off `.design-sync/previews/*.tsx` + config; the DS source components live in the same repo, so a component-CSS change won't invalidate grades by itself — eyeball the review sheets after any `styles.css` overhaul.
- The conventions header enumerates token names — if tokens are renamed in `src/tokens.css`, re-validate `conventions.md` (the header ships inside README.md).
- Playwright chromium is cached at `~/Library/Caches/ms-playwright` (headless shell v1228); a fresh machine needs `npx playwright install chromium` from `.ds-sync/`.

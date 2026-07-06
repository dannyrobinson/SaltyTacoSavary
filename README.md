# The Salty Taco 🌮

Website for The Salty Taco food truck on Savary Island, BC — plus Dave's
private app for managing hours and answering "are you still open?" pings.

## What's here

| Path | What it is |
|---|---|
| `index.html` | Public site — hours, menu, photo gallery. Static, hosts on GitHub Pages. |
| `dave/` | Dave's password-protected PWA (installable on his phone) for editing hours and answering late-night taco pleas. |
| `server/` | Small Node API that stores hours and sends push notifications. GitHub Pages can't do push, so this one piece lives elsewhere (free Render tier works). See [server/README.md](server/README.md). |
| `photos/` | Original photos. Web-optimized copies are in `assets/img/` (regenerate with `sips -Z 1600`). |
| `js/config.js` | One setting: `API_BASE`, the URL of the deployed server. |

## How the "still open?" flow works

1. Outside posted hours, the site shows an **"Are you still open?"** button.
2. Clicking it hits the API, which sends Dave a **push notification**.
3. Dave taps it → his app opens with **Yes / No**.
4. **Yes** asks "until when?" (default: 1 hour from now) and the public site
   shows *"Dave is staying open until 6:30pm today!"* and flips to Open.
5. Dave can also edit weekly hours, set hours for specific dates, or mark
   dates closed — any time, from the same app.

Default hours are **12–5 every day**; the site works with those even with no
server configured (the ask button just stays hidden until `API_BASE` is set).

## Publish on GitHub Pages

```bash
git init && git add -A && git commit -m "The Salty Taco"
gh repo create saltytaco --public --source . --push
```

Then in the repo: **Settings → Pages → Deploy from branch → `main` / root**.
Site appears at `https://<you>.github.io/saltytaco/`; Dave's app at
`https://<you>.github.io/saltytaco/dave/`.

Finally, deploy the server (5 minutes — see [server/README.md](server/README.md)),
put its URL in [js/config.js](js/config.js), and push again.

## Dave's phone setup (once)

1. Open `…/dave/` in Safari (iPhone) or Chrome (Android).
2. iPhone: Share → **Add to Home Screen** (required for push on iOS). Android: "Install app" prompt.
3. Open it from the home screen, log in, tap **Enable push notifications**.

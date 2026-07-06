# Salty Taco API

Tiny Node server that powers the live bits of thesaltytaco site:

- Dave's password login
- Hours (weekly + specific-day overrides), editable from Dave's app
- "Are you still open?" → web-push notification to Dave's phone
- Dave's Yes/No answer → "open until X" banner on the public site
- Photo uploads from Dave's app (stored next to the data file; shown in the site gallery)
- Instagram import: paste a public post URL, the server grabs its image
- Social links (Instagram / Facebook / TikTok / email) shown in the site footer

## Run locally

```bash
cd server
npm install
DAVE_PASSWORD=yourpassword npm start
```

Then set `API_BASE: "http://localhost:3000"` in `js/config.js`.

## Deploy (free tier, e.g. Render)

1. Push this repo to GitHub.
2. On https://render.com create a **Web Service** from the repo:
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm start`
3. Add environment variable `DAVE_PASSWORD` (Dave's login password).
4. (Optional but recommended) add a persistent disk mounted somewhere like
   `/data` and set `DATA_FILE=/data/data.json` so hours/subscriptions survive
   restarts. Without it, VAPID keys regenerate on redeploy, Dave will need
   to re-enable push notifications, and **uploaded photos are lost** (they're
   stored in a `photos/` folder beside the data file; override with `PHOTOS_DIR`).
5. Copy the service URL (e.g. `https://saltytaco-api.onrender.com`) into
   `js/config.js` → `API_BASE`, commit, and push.

VAPID keys for web push are generated automatically on first boot and stored
in the data file. You can pin them instead with `VAPID_PUBLIC_KEY` /
`VAPID_PRIVATE_KEY` env vars.

## Notes

- Session tokens are in-memory; a server restart just means Dave logs in again.
- `/api/ask` rate-limits pushes to one per 2 minutes and coalesces repeat
  asks into a counter, so a beach full of hungry people won't melt Dave's phone.

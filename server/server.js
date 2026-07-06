// The Salty Taco backend — hours, "are you still open?" pushes, Dave auth.
// Deploy anywhere Node runs (Render, Fly.io, Railway, a Pi in the truck…).
const express = require("express");
const webpush = require("web-push");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DAVE_PASSWORD = process.env.DAVE_PASSWORD || "changeme";
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data.json");
const PHOTOS_DIR = process.env.PHOTOS_DIR || path.join(path.dirname(DATA_FILE), "photos");
fs.mkdirSync(PHOTOS_DIR, { recursive: true });

// ---------- persistent state (single JSON file) ----------
const DEFAULT_STATE = {
  hours: {
    weekly: Array.from({ length: 7 }, () => ({ closed: false, open: 720, close: 1020 })), // 12–5 daily
    overrides: {},
    extension: null,
  },
  subscriptions: [],
  pendingAsk: null, // { at, count }
  vapid: null,
  photos: [], // [{ id, file, caption, addedAt }]
  socials: { facebook: "https://www.facebook.com/profile.php?id=61591666165309" },
};

let state = DEFAULT_STATE;
try { state = { ...DEFAULT_STATE, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) }; } catch (_) {}

function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

// ---------- VAPID keys (generated once, stored in data file) ----------
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  state.vapid = { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
} else if (!state.vapid) {
  state.vapid = webpush.generateVAPIDKeys();
  save();
  console.log("Generated new VAPID keys (stored in data file).");
}
webpush.setVapidDetails("mailto:danny@fpes.ca", state.vapid.publicKey, state.vapid.privateKey);

// ---------- auth ----------
const tokens = new Set(); // in-memory session tokens
function requireAuth(req, res, next) {
  const t = (req.headers.authorization || "").replace(/^Bearer /, "");
  if (!tokens.has(t)) return res.status(401).json({ error: "unauthorized" });
  next();
}

const app = express();
app.use(express.json({ limit: "15mb" })); // photo uploads arrive as base64 JSON
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/", (_req, res) => res.json({ ok: true, service: "salty-taco-api" }));

app.post("/api/login", (req, res) => {
  const pw = String(req.body?.password || "");
  const expected = Buffer.from(DAVE_PASSWORD);
  const given = Buffer.from(pw.padEnd(expected.length).slice(0, expected.length));
  if (pw.length !== DAVE_PASSWORD.length || !crypto.timingSafeEqual(expected, given)) {
    return res.status(401).json({ error: "bad password" });
  }
  const token = crypto.randomBytes(32).toString("hex");
  tokens.add(token);
  res.json({ token });
});

// ---------- hours ----------
function activeExtension() {
  const ext = state.hours.extension;
  return ext && ext.until && Date.now() < ext.until ? ext : null;
}

app.get("/api/hours", (_req, res) => {
  res.json({ ...state.hours, extension: activeExtension() });
});

app.put("/api/hours", requireAuth, (req, res) => {
  const { weekly, overrides } = req.body || {};
  if (!Array.isArray(weekly) || weekly.length !== 7) return res.status(400).json({ error: "bad weekly hours" });
  state.hours.weekly = weekly;
  state.hours.overrides = overrides || {};
  save();
  res.json({ ...state.hours, extension: activeExtension() });
});

// ---------- "are you still open?" ----------
const TZ = process.env.TRUCK_TZ || "America/Vancouver";

// Is the truck within posted hours (or an active extension) right now, island time?
function isOpenNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short",
  }).formatToParts(new Date()).reduce((o, p) => ((o[p.type] = p.value), o), {});
  const mins = (Number(parts.hour) % 24) * 60 + Number(parts.minute);
  const dateKey = `${parts.year}-${parts.month}-${parts.day}`;
  const dayIdx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  const h = state.hours.overrides?.[dateKey] || state.hours.weekly[dayIdx];
  if (!h.closed && mins >= h.open && mins < h.close) return true;
  return !!activeExtension();
}

let lastAskPush = 0;

app.post("/api/ask", async (_req, res) => {
  // No asking during posted hours (or an active extension) — the truck is open, just walk up.
  if (isOpenNow()) return res.status(409).json({ error: "already open" });
  const now = Date.now();
  if (state.pendingAsk && now - state.pendingAsk.at < 60 * 60 * 1000) {
    state.pendingAsk.count += 1;
  } else {
    state.pendingAsk = { at: now, count: 1 };
  }
  save();

  // Push to Dave, at most once per 2 minutes so a crowd doesn't buzz him to death.
  if (now - lastAskPush > 2 * 60 * 1000 && state.subscriptions.length) {
    lastAskPush = now;
    const payload = JSON.stringify({
      title: "🌮 Are you still open?",
      body: state.pendingAsk.count > 1
        ? `${state.pendingAsk.count} people are asking if the truck is still open!`
        : "A customer is asking if the truck is still open. Tap to answer.",
    });
    const dead = [];
    await Promise.all(state.subscriptions.map((sub) =>
      webpush.sendNotification(sub, payload).catch((err) => {
        if (err.statusCode === 404 || err.statusCode === 410) dead.push(sub.endpoint);
      })
    ));
    if (dead.length) {
      state.subscriptions = state.subscriptions.filter((s) => !dead.includes(s.endpoint));
      save();
    }
  }
  res.json({ ok: true });
});

app.get("/api/pending-ask", requireAuth, (_req, res) => {
  const p = state.pendingAsk;
  const fresh = p && Date.now() - p.at < 60 * 60 * 1000; // asks go stale after an hour
  res.json(fresh ? { pending: true, at: p.at, count: p.count } : { pending: false });
});

app.post("/api/answer", requireAuth, (req, res) => {
  const { open, until } = req.body || {};
  if (open) {
    state.hours.extension = { until: Number(until) || Date.now() + 60 * 60 * 1000 };
  } else {
    state.hours.extension = null;
  }
  state.pendingAsk = null;
  save();
  res.json({ ok: true, extension: activeExtension() });
});

// ---------- push subscriptions ----------
app.get("/api/vapid-key", requireAuth, (_req, res) => res.json({ key: state.vapid.publicKey }));

app.post("/api/subscribe", requireAuth, (req, res) => {
  const sub = req.body;
  if (!sub?.endpoint) return res.status(400).json({ error: "bad subscription" });
  if (!state.subscriptions.some((s) => s.endpoint === sub.endpoint)) {
    state.subscriptions.push(sub);
    save();
  }
  res.json({ ok: true });
});

// ---------- photos ----------
app.use("/photos", express.static(PHOTOS_DIR, { maxAge: "1d", immutable: true }));

app.get("/api/photos", (_req, res) => {
  res.json(state.photos.map((p) => ({ ...p, url: `/photos/${p.file}` })));
});

function savePhoto(buf, caption) {
  if (buf.length > 12 * 1024 * 1024) throw Object.assign(new Error("too large"), { status: 413 });
  // accept only real JPEG/PNG/WebP payloads
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
  const isPng = buf[0] === 0x89 && buf[1] === 0x50;
  const isWebp = buf.slice(8, 12).toString() === "WEBP";
  if (!isJpeg && !isPng && !isWebp) throw Object.assign(new Error("not an image"), { status: 415 });
  const id = crypto.randomBytes(8).toString("hex");
  const file = `${id}.${isPng ? "png" : isWebp ? "webp" : "jpg"}`;
  fs.writeFileSync(path.join(PHOTOS_DIR, file), buf);
  const photo = { id, file, caption: String(caption || "").slice(0, 200), addedAt: Date.now() };
  state.photos.unshift(photo);
  save();
  return photo;
}

app.post("/api/photos", requireAuth, (req, res) => {
  try {
    const { data, caption } = req.body || {};
    if (!data) return res.status(400).json({ error: "no image data" });
    const buf = Buffer.from(String(data).replace(/^data:image\/\w+;base64,/, ""), "base64");
    const photo = savePhoto(buf, caption);
    res.json({ ...photo, url: `/photos/${photo.file}` });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

// Import a photo from a public Instagram post URL (scrapes the post's og:image).
app.post("/api/photos/import", requireAuth, async (req, res) => {
  try {
    const url = new URL(String(req.body?.url || ""));
    if (!/(^|\.)instagram\.com$/.test(url.hostname)) {
      return res.status(400).json({ error: "not an instagram.com URL" });
    }
    const page = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; SaltyTacoBot)" } });
    const html = await page.text();
    const m = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/) ||
              html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/);
    if (!m) return res.status(422).json({ error: "couldn't find an image on that post (is it public?)" });
    const imgUrl = m[1].replace(/&amp;/g, "&");
    const img = await fetch(imgUrl);
    if (!img.ok) return res.status(502).json({ error: "image download failed" });
    const buf = Buffer.from(await img.arrayBuffer());
    const photo = savePhoto(buf, req.body?.caption);
    res.json({ ...photo, url: `/photos/${photo.file}` });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message });
  }
});

app.delete("/api/photos/:id", requireAuth, (req, res) => {
  const i = state.photos.findIndex((p) => p.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: "not found" });
  try { fs.unlinkSync(path.join(PHOTOS_DIR, state.photos[i].file)); } catch (_) {}
  state.photos.splice(i, 1);
  save();
  res.json({ ok: true });
});

// ---------- socials ----------
const SOCIAL_KEYS = ["instagram", "facebook", "tiktok", "email"];

app.get("/api/socials", (_req, res) => res.json(state.socials));

app.put("/api/socials", requireAuth, (req, res) => {
  const clean = {};
  for (const k of SOCIAL_KEYS) {
    const v = String(req.body?.[k] || "").trim().slice(0, 300);
    if (v) clean[k] = v;
  }
  state.socials = clean;
  save();
  res.json(state.socials);
});

app.listen(PORT, () => console.log(`Salty Taco API listening on :${PORT}`));

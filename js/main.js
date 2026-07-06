(function () {
  const { DAYS, DEFAULT_HOURS, fmt, statusNow, hoursFor } = window.SaltyHours;
  const API = (window.SALTY_CONFIG.API_BASE || "").replace(/\/$/, "");

  // ---------- gallery ----------
  const grid = document.getElementById("gallery-grid");
  window.SALTY_GALLERY.forEach(([name, alt]) => {
    const img = document.createElement("img");
    img.src = `assets/img/${name}.jpg`;
    img.alt = alt;
    img.loading = "lazy";
    img.dataset.name = name;
    grid.appendChild(img);
  });

  // Dave can hide built-in gallery photos from his app.
  async function applyHiddenGallery() {
    if (!API) return;
    try {
      const res = await fetch(`${API}/api/gallery`);
      if (!res.ok) return;
      const { hidden } = await res.json();
      (hidden || []).forEach((name) => grid.querySelector(`[data-name="${CSS.escape(name)}"]`)?.remove());
    } catch (_) {}
  }

  // Dave's own uploads (from his app / Instagram imports) go at the front.
  async function loadLivePhotos() {
    if (!API) return;
    try {
      const res = await fetch(`${API}/api/photos`);
      if (!res.ok) return;
      const photos = await res.json();
      photos.reverse().forEach((p) => {
        if (grid.querySelector(`[data-id="${p.id}"]`)) return;
        const img = document.createElement("img");
        img.src = `${API}${p.url}`;
        img.alt = p.caption || "Photo from The Salty Taco";
        img.loading = "lazy";
        img.dataset.id = p.id;
        grid.prepend(img);
      });
    } catch (_) {}
  }

  // Social links from Dave's app (footer).
  async function loadSocials() {
    if (!API) return;
    try {
      const res = await fetch(`${API}/api/socials`);
      if (!res.ok) return;
      const socials = await res.json();
      if (!Object.keys(socials).length) return; // keep the static default links
      const wrap = document.getElementById("socials");
      wrap.innerHTML = "";
      const LABELS = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", email: "Email" };
      Object.entries(socials).forEach(([k, v]) => {
        if (!LABELS[k]) return;
        const a = document.createElement("a");
        a.href = k === "email" ? `mailto:${v}` : v;
        a.textContent = LABELS[k];
        if (k !== "email") { a.target = "_blank"; a.rel = "noopener"; }
        wrap.appendChild(a);
      });
    } catch (_) {}
  }

  const lightbox = document.getElementById("lightbox");
  const lbImg = lightbox.querySelector("img");
  grid.addEventListener("click", (e) => {
    if (e.target.tagName !== "IMG") return;
    lbImg.src = e.target.src;
    lbImg.alt = e.target.alt;
    lightbox.hidden = false;
  });
  lightbox.addEventListener("click", () => (lightbox.hidden = true));

  document.getElementById("year").textContent = new Date().getFullYear();

  // ---------- hours ----------
  let hoursData = DEFAULT_HOURS;

  function renderHours() {
    const wrap = document.getElementById("hours-grid");
    wrap.innerHTML = "";
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - today.getDay() + i);
      const h = hoursFor(hoursData, d);
      const card = document.createElement("div");
      card.className = "day-card" + (i === today.getDay() ? " today" : "") + (h.closed ? " closed" : "");
      card.innerHTML = `<div class="day">${DAYS[i].slice(0, 3)}</div>
        <div class="time">${h.closed ? "Closed" : `${fmt(h.open)}–${fmt(h.close)}`}</div>`;
      wrap.appendChild(card);
    }
    renderStatus();
  }

  function renderStatus() {
    const st = statusNow(hoursData);
    const badge = document.getElementById("open-badge");
    badge.hidden = false;
    badge.classList.toggle("closed", !st.open);
    badge.textContent = st.open ? `Open now — until ${st.until}` : "Closed right now";

    const banner = document.getElementById("extension-banner");
    if (st.open && st.extended) {
      banner.hidden = false;
      banner.textContent = `🌮 Good news — Dave is staying open until ${st.until} today!`;
    } else {
      banner.hidden = true;
    }

    // "Are you still open?" appears only outside posted hours (and when a
    // backend is configured to deliver the question to Dave).
    document.getElementById("ask-wrap").hidden = !API || st.open;
  }

  async function refresh() {
    if (API) {
      try {
        const res = await fetch(`${API}/api/hours`);
        if (res.ok) hoursData = await res.json();
      } catch (_) { /* static fallback */ }
    }
    renderHours();
  }

  // ---------- ask button ----------
  const askBtn = document.getElementById("ask-btn");
  const askStatus = document.getElementById("ask-status");
  askBtn?.addEventListener("click", async () => {
    askBtn.disabled = true;
    askStatus.textContent = "Asking Dave…";
    try {
      const res = await fetch(`${API}/api/ask`, { method: "POST" });
      if (res.status === 409) {
        // Server says the truck is open right now (posted hours or an extension).
        askStatus.textContent = "Good news — the truck is open right now! Come on by.";
        await refresh();
        return;
      }
      if (!res.ok) throw new Error();
      askStatus.textContent = "Sent! If Dave says yes, this page will update — check back in a minute.";
      // Poll a bit more eagerly for a while after asking.
      let polls = 0;
      const t = setInterval(async () => {
        await refresh();
        if (++polls > 20 || !document.getElementById("extension-banner").hidden) clearInterval(t);
      }, 15000);
    } catch (_) {
      askStatus.textContent = "Couldn't reach Dave right now — worth wandering by the truck!";
      askBtn.disabled = false;
    }
  });

  refresh();
  applyHiddenGallery();
  loadLivePhotos();
  loadSocials();
  setInterval(refresh, 60000);
})();

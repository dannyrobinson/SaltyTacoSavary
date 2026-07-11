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
    // Closed + backend available → the badge's place is taken by the
    // "are we still serving?" button instead of a dead "Closed" pill.
    badge.hidden = !st.open && !!API;
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

  // ---------- reviews ----------
  const starRow = document.getElementById("rev-stars");
  let chosenStars = 0;

  function paintStars() {
    starRow.querySelectorAll("button").forEach((b) => {
      const on = Number(b.dataset.star) <= chosenStars;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on && Number(b.dataset.star) === chosenStars ? "true" : "false");
    });
  }

  starRow.addEventListener("click", (e) => {
    const star = Number(e.target.dataset?.star);
    if (star) { chosenStars = star; paintStars(); }
  });

  function starString(n) {
    return "★".repeat(n) + "☆".repeat(5 - n);
  }

  async function loadReviews() {
    if (!API) return; // static mode: keep the whole section hidden below
    document.getElementById("review-form-wrap").hidden = false;
    try {
      const res = await fetch(`${API}/api/reviews`);
      if (!res.ok) return;
      const reviews = await res.json();
      const list = document.getElementById("review-list");
      list.querySelectorAll(".review").forEach((el) => el.remove());
      document.getElementById("reviews-empty").hidden = reviews.length > 0;
      reviews.forEach((r) => {
        const card = document.createElement("figure");
        card.className = "review";
        const stars = document.createElement("div");
        stars.className = "review-stars";
        stars.textContent = starString(r.rating);
        stars.setAttribute("aria-label", `${r.rating} out of 5 stars`);
        const quote = document.createElement("blockquote");
        quote.textContent = r.text;
        const who = document.createElement("figcaption");
        who.textContent = `— ${r.name}`;
        card.append(stars, quote, who);
        list.appendChild(card);
      });
    } catch (_) {}
  }

  document.getElementById("rev-submit")?.addEventListener("click", async () => {
    const status = document.getElementById("rev-status");
    const name = document.getElementById("rev-name").value.trim();
    const text = document.getElementById("rev-text").value.trim();
    if (!name) return (status.textContent = "Tell us your name first!");
    if (!chosenStars) return (status.textContent = "Pick a star rating (tap the stars).");
    if (!text) return (status.textContent = "Write a few words about your visit.");
    const btn = document.getElementById("rev-submit");
    btn.disabled = true;
    status.textContent = "Sending…";
    try {
      const res = await fetch(`${API}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rating: chosenStars, text }),
      });
      if (!res.ok) throw new Error();
      status.textContent = "Thanks! Your review is on its way to Dave — it'll show up here once he approves it. 🌮";
      document.getElementById("rev-name").value = "";
      document.getElementById("rev-text").value = "";
      chosenStars = 0;
      paintStars();
    } catch (_) {
      status.textContent = "Couldn't send your review right now — please try again later.";
    }
    btn.disabled = false;
  });

  // No backend → no way to collect or store reviews, hide the section.
  if (!API) document.getElementById("reviews").hidden = true;

  refresh();
  loadReviews();
  applyHiddenGallery();
  loadLivePhotos();
  loadSocials();
  setInterval(refresh, 60000);
})();

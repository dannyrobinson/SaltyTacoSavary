(function () {
  const { DAYS, DEFAULT_HOURS, fmt, statusNow, hoursFor } = window.SaltyHours;
  const API = (window.SALTY_CONFIG.API_BASE || "").replace(/\/$/, "");

  // ---------- gallery ----------
  const PHOTOS = [
    ["IMG_1570", "The Salty Taco truck, ready to serve"],
    ["736163379_122098515519388872_5886438879236630472_n", "Both Salty Taco trucks set up with patio seating"],
    ["737543783_122098555713388872_832871686383853775_n", "A loaded Salty Taco up close"],
    ["739553294_122098517925388872_4750972769881969750_n", "Chicken strips with honey dill dip"],
    ["IMG_1571", "Taco menu chalkboard"],
    ["IMG_1573", "Salty Snacks menu"],
    ["IMG_1572", "Ice cream and snacks menu"],
    ["IMG_1579", "Dave serving up fresh tacos"],
    ["IMG_1580", "Two big tacos, hot out of the window"],
    ["738523379_122098403703388872_7352182523300738524_n", "Sea Salt n Caramel, Blue Bubblegum, Rainbow Sorbet, Chocolate Chipmint"],
    ["738552832_122098403727388872_8926903698228150824_n", "Tiger, Shark Bite, Cookies n Crème, Cotton Candy"],
    ["738304014_122098405209388872_1583951958173162645_n", "The slushy machine, ready to pour"],
    ["738335040_122098404261388872_5514560134268576247_n", "Salty Taco t-shirts — keep the sand out of your taco!"],
    ["IMG_1583", "Taco picnic on the beach"],
    ["IMG_1582", "Friends enjoying Salty Tacos on Savary beach"],
    ["735034649_122095761669388872_1730303868897305738_n", "Located beside the Church"],
  ];
  const grid = document.getElementById("gallery-grid");
  PHOTOS.forEach(([name, alt]) => {
    const img = document.createElement("img");
    img.src = `assets/img/${name}.jpg`;
    img.alt = alt;
    img.loading = "lazy";
    grid.appendChild(img);
  });

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
  loadLivePhotos();
  loadSocials();
  setInterval(refresh, 60000);
})();

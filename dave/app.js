(function () {
  const { DAYS, DEFAULT_HOURS, fmt } = window.SaltyHours;
  const API = (window.SALTY_CONFIG.API_BASE || "").replace(/\/$/, "");

  const $ = (id) => document.getElementById(id);
  const views = { login: $("login-view"), app: $("app-view"), noapi: $("noapi-view") };
  let token = localStorage.getItem("salty_token") || "";
  let hoursData = DEFAULT_HOURS;

  function show(view) {
    Object.entries(views).forEach(([k, el]) => (el.hidden = k !== view));
  }

  function authHeaders() {
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  }

  async function api(path, opts = {}) {
    const res = await fetch(`${API}${path}`, { ...opts, headers: { ...authHeaders(), ...(opts.headers || {}) } });
    if (res.status === 401) { logout(); throw new Error("unauthorized"); }
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.status === 204 ? null : res.json();
  }

  function logout() {
    token = "";
    localStorage.removeItem("salty_token");
    show("login");
  }

  // ---------- time helpers ----------
  const toHHMM = (mins) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  const toMins = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };

  // ---------- login ----------
  $("login-btn").addEventListener("click", async () => {
    $("login-error").textContent = "";
    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: $("password").value }),
      });
      if (!res.ok) throw new Error();
      token = (await res.json()).token;
      localStorage.setItem("salty_token", token);
      enterApp();
    } catch (_) {
      $("login-error").textContent = "Wrong password (or the server is unreachable).";
    }
  });
  $("password").addEventListener("keydown", (e) => e.key === "Enter" && $("login-btn").click());
  $("logout").addEventListener("click", logout);

  // ---------- weekly hours editor ----------
  function renderWeekly() {
    const wrap = $("weekly-rows");
    wrap.innerHTML = "";
    hoursData.weekly.forEach((h, i) => {
      const row = document.createElement("div");
      row.className = "day-row";
      row.innerHTML = `
        <span class="dname">${DAYS[i].slice(0, 3)}</span>
        <label class="chk"><input type="checkbox" data-i="${i}" class="w-closed" ${h.closed ? "checked" : ""}> Closed</label>
        <input type="time" class="w-open" data-i="${i}" value="${toHHMM(h.open)}" ${h.closed ? "disabled" : ""}>
        <span>to</span>
        <input type="time" class="w-close" data-i="${i}" value="${toHHMM(h.close)}" ${h.closed ? "disabled" : ""}>`;
      wrap.appendChild(row);
    });
    wrap.querySelectorAll(".w-closed").forEach((cb) =>
      cb.addEventListener("change", () => {
        const i = cb.dataset.i;
        wrap.querySelector(`.w-open[data-i="${i}"]`).disabled = cb.checked;
        wrap.querySelector(`.w-close[data-i="${i}"]`).disabled = cb.checked;
      })
    );
  }

  $("save-weekly").addEventListener("click", async () => {
    const wrap = $("weekly-rows");
    hoursData.weekly = DAYS.map((_, i) => ({
      closed: wrap.querySelector(`.w-closed[data-i="${i}"]`).checked,
      open: toMins(wrap.querySelector(`.w-open[data-i="${i}"]`).value || "12:00"),
      close: toMins(wrap.querySelector(`.w-close[data-i="${i}"]`).value || "17:00"),
    }));
    await saveHours();
    $("weekly-saved").textContent = "Saved ✓";
    setTimeout(() => ($("weekly-saved").textContent = ""), 2500);
  });

  // ---------- specific-day overrides ----------
  function renderOverrides() {
    const list = $("ov-list");
    list.innerHTML = "";
    Object.entries(hoursData.overrides || {})
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, h]) => {
        const li = document.createElement("li");
        li.innerHTML = `<span><strong>${date}</strong> — ${h.closed ? "Closed" : `${fmt(h.open)}–${fmt(h.close)}`}</span>
          <button data-date="${date}">Remove</button>`;
        li.querySelector("button").addEventListener("click", async () => {
          delete hoursData.overrides[date];
          await saveHours();
          renderOverrides();
        });
        list.appendChild(li);
      });
  }

  $("ov-closed").addEventListener("change", () => {
    $("ov-times").style.display = $("ov-closed").checked ? "none" : "";
  });

  $("ov-add").addEventListener("click", async () => {
    const date = $("ov-date").value;
    if (!date) return alert("Pick a date first.");
    hoursData.overrides = hoursData.overrides || {};
    hoursData.overrides[date] = $("ov-closed").checked
      ? { closed: true }
      : { closed: false, open: toMins($("ov-open").value || "12:00"), close: toMins($("ov-close").value || "17:00") };
    await saveHours();
    renderOverrides();
  });

  async function saveHours() {
    await api("/api/hours", { method: "PUT", body: JSON.stringify(hoursData) });
  }

  // ---------- extension (currently staying open late) ----------
  function renderExtension() {
    const ext = hoursData.extension;
    const active = ext && ext.until && Date.now() < ext.until;
    $("ext-card").hidden = !active;
    if (active) {
      $("ext-text").textContent = `You're marked as staying open until ${new Date(ext.until).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`;
    }
  }

  $("ext-clear").addEventListener("click", async () => {
    await api("/api/answer", { method: "POST", body: JSON.stringify({ open: false }) });
    await loadHours();
  });

  // ---------- "are you still open?" ----------
  let pendingAsk = null;

  async function checkAsk() {
    try {
      const data = await api("/api/pending-ask");
      pendingAsk = data.pending ? data : null;
    } catch (_) { pendingAsk = null; }
    const card = $("ask-card");
    card.hidden = !pendingAsk;
    if (pendingAsk) {
      const when = new Date(pendingAsk.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const n = pendingAsk.count > 1 ? ` (${pendingAsk.count} people asking!)` : "";
      $("ask-meta").textContent = `Asked at ${when}${n}`;
    }
    $("until-row").hidden = true;
  }

  $("yes-btn").addEventListener("click", () => {
    // default: one hour from now
    const d = new Date(Date.now() + 60 * 60 * 1000);
    $("until-time").value = toHHMM(d.getHours() * 60 + d.getMinutes());
    $("until-row").hidden = false;
  });

  $("confirm-until").addEventListener("click", async () => {
    const [h, m] = $("until-time").value.split(":").map(Number);
    const until = new Date();
    until.setHours(h, m, 0, 0);
    if (until.getTime() < Date.now()) until.setDate(until.getDate() + 1); // e.g. "open until 12:30am"
    await api("/api/answer", { method: "POST", body: JSON.stringify({ open: true, until: until.getTime() }) });
    await loadHours();
    await checkAsk();
  });

  $("no-btn").addEventListener("click", async () => {
    await api("/api/answer", { method: "POST", body: JSON.stringify({ open: false }) });
    await checkAsk();
  });

  // ---------- photos ----------
  async function loadPhotos() {
    const list = $("photo-list");
    list.innerHTML = "";
    try {
      const photos = await api("/api/photos");
      photos.forEach((p) => {
        const fig = document.createElement("figure");
        const img = document.createElement("img");
        img.src = `${API}${p.url}`;
        img.alt = p.caption || "";
        img.loading = "lazy";
        const del = document.createElement("button");
        del.textContent = "✕";
        del.title = "Delete photo";
        del.addEventListener("click", async () => {
          if (!confirm("Remove this photo from the website?")) return;
          await api(`/api/photos/${p.id}`, { method: "DELETE" });
          loadPhotos();
        });
        fig.append(img, del);
        list.appendChild(fig);
      });
    } catch (_) {}
  }

  // ---------- built-in gallery hide/show ----------
  let hiddenGallery = [];

  async function loadBuiltinGallery() {
    try {
      const res = await fetch(`${API}/api/gallery`);
      if (res.ok) hiddenGallery = (await res.json()).hidden || [];
    } catch (_) {}
    renderBuiltinGallery();
  }

  function renderBuiltinGallery() {
    const list = $("builtin-list");
    list.innerHTML = "";
    window.SALTY_GALLERY.forEach(([name, alt]) => {
      const hidden = hiddenGallery.includes(name);
      const fig = document.createElement("figure");
      fig.className = "builtin";
      fig.dataset.state = hidden ? "Hidden" : "Shown";
      const img = document.createElement("img");
      img.src = `../assets/img/${name}.jpg`;
      img.alt = alt;
      img.loading = "lazy";
      if (hidden) img.classList.add("hidden-photo");
      fig.appendChild(img);
      fig.addEventListener("click", () => toggleBuiltin(name));
      list.appendChild(fig);
    });
  }

  async function toggleBuiltin(name) {
    hiddenGallery = hiddenGallery.includes(name)
      ? hiddenGallery.filter((n) => n !== name)
      : [...hiddenGallery, name];
    renderBuiltinGallery();
    try {
      await api("/api/gallery", { method: "PUT", body: JSON.stringify({ hidden: hiddenGallery }) });
      $("gallery-saved").textContent = "Saved ✓";
      setTimeout(() => ($("gallery-saved").textContent = ""), 2000);
    } catch (e) {
      $("gallery-saved").textContent = "Couldn't save — try again.";
      loadBuiltinGallery();
    }
  }

  // Downscale on the phone so uploads are quick on island wifi.
  function fileToJpegDataUrl(file, maxDim = 1600) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  $("photo-upload").addEventListener("click", async () => {
    const files = [...$("photo-file").files];
    if (!files.length) return ($("photo-status").textContent = "Pick a photo first.");
    const caption = $("photo-caption").value;
    for (let i = 0; i < files.length; i++) {
      $("photo-status").textContent = `Uploading ${i + 1} of ${files.length}…`;
      try {
        const data = await fileToJpegDataUrl(files[i]);
        await api("/api/photos", { method: "POST", body: JSON.stringify({ data, caption }) });
      } catch (e) {
        $("photo-status").textContent = `Upload failed: ${e.message}`;
        return;
      }
    }
    $("photo-status").textContent = "Uploaded ✓";
    $("photo-file").value = "";
    $("photo-caption").value = "";
    loadPhotos();
  });

  $("ig-import").addEventListener("click", async () => {
    const url = $("ig-url").value.trim();
    if (!url) return ($("photo-status").textContent = "Paste an Instagram post link first.");
    $("photo-status").textContent = "Importing from Instagram…";
    try {
      const res = await fetch(`${API}/api/photos/import`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ url }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || res.status);
      $("photo-status").textContent = "Imported ✓";
      $("ig-url").value = "";
      loadPhotos();
    } catch (e) {
      $("photo-status").textContent = `Import failed: ${e.message}. If the post is private, save the picture to your phone and upload it above instead.`;
    }
  });

  // ---------- socials ----------
  const SOCIAL_KEYS = ["instagram", "facebook", "tiktok", "email"];

  async function loadSocials() {
    try {
      const socials = await api("/api/socials");
      SOCIAL_KEYS.forEach((k) => ($(`soc-${k}`).value = socials[k] || ""));
    } catch (_) {}
  }

  $("soc-save").addEventListener("click", async () => {
    const body = {};
    SOCIAL_KEYS.forEach((k) => (body[k] = $(`soc-${k}`).value.trim()));
    await api("/api/socials", { method: "PUT", body: JSON.stringify(body) });
    $("soc-saved").textContent = "Saved ✓";
    setTimeout(() => ($("soc-saved").textContent = ""), 2500);
  });

  // ---------- push subscription (header button) ----------
  function setTopStatus(msg) {
    const el = $("topbar-status");
    el.textContent = msg || "";
    el.hidden = !msg;
  }

  async function updatePushUI() {
    const btn = $("push-btn");
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      btn.hidden = true; // the install hint explains what to do (iOS needs Home Screen install)
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    btn.hidden = false;
    btn.disabled = !!sub;
    btn.textContent = sub ? "🔔 Push on ✓" : "🔔 Enable push";
  }

  $("push-btn").addEventListener("click", async () => {
    try {
      const { key } = await api("/api/vapid-key");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
      await api("/api/subscribe", { method: "POST", body: JSON.stringify(sub) });
      await updatePushUI();
      setTopStatus("");
    } catch (e) {
      setTopStatus("Couldn't enable push: " + (Notification.permission === "denied" ? "notifications are blocked in your browser settings." : e.message));
    }
  });

  // ---------- PWA install hint ----------
  const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  let deferredInstall = null;

  function showInstallHint(which) {
    if (standalone || localStorage.getItem("salty_install_dismissed")) return;
    $("install-hint").hidden = false;
    $(which).hidden = false;
  }

  if (isIOS) {
    // iOS has no install API — show the Share → Add to Home Screen walkthrough.
    showInstallHint("install-ios");
  }

  // Android/Chrome: the browser hands us an install prompt we can trigger programmatically.
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstall = e;
    showInstallHint("install-android-wrap");
  });

  $("install-android").addEventListener("click", async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    const { outcome } = await deferredInstall.userChoice;
    deferredInstall = null;
    if (outcome === "accepted") $("install-hint").hidden = true;
  });

  window.addEventListener("appinstalled", () => ($("install-hint").hidden = true));

  $("install-dismiss").addEventListener("click", () => {
    $("install-hint").hidden = true;
    localStorage.setItem("salty_install_dismissed", "1");
  });

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
  }

  // ---------- boot ----------
  async function loadHours() {
    try {
      const res = await fetch(`${API}/api/hours`);
      if (res.ok) hoursData = await res.json();
    } catch (_) {}
    renderWeekly();
    renderOverrides();
    renderExtension();
  }

  async function enterApp() {
    show("app");
    await loadHours();
    await checkAsk();
    await updatePushUI();
    loadPhotos();
    loadBuiltinGallery();
    loadSocials();
    setInterval(checkAsk, 20000);
  }

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");

  if (!API) {
    show("noapi");
  } else if (token) {
    // validate the stored token
    api("/api/pending-ask").then(enterApp).catch(() => show("login"));
  } else {
    show("login");
  }
})();

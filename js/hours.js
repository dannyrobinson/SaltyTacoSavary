// Shared hours logic for the public site and Dave's app.
// Times are minutes-from-midnight in local (island) time.
(function () {
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // The bottom line: open 12–5 every day.
  const DEFAULT_HOURS = {
    weekly: DAYS.map(() => ({ closed: false, open: 720, close: 1020 })), // index 0 = Sunday
    overrides: {}, // "YYYY-MM-DD": { closed: true } or { closed:false, open, close }
    extension: null, // { until: epoch-ms } set when Dave says "yes, still open"
  };

  function fmt(mins) {
    let h = Math.floor(mins / 60), m = mins % 60;
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return m ? `${h}:${String(m).padStart(2, "0")}${ampm}` : `${h}${ampm}`;
  }

  function dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // Effective hours for a given Date, considering per-date overrides.
  function hoursFor(data, d) {
    const ov = data.overrides && data.overrides[dateKey(d)];
    if (ov) return ov;
    return data.weekly[d.getDay()];
  }

  // Returns { open, until, extended } for "now".
  function statusNow(data, now) {
    now = now || new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const h = hoursFor(data, now);
    if (!h.closed && mins >= h.open && mins < h.close) {
      return { open: true, until: fmt(h.close), extended: false };
    }
    const ext = data.extension;
    if (ext && ext.until && Date.now() < ext.until) {
      const u = new Date(ext.until);
      return { open: true, until: fmt(u.getHours() * 60 + u.getMinutes()), extended: true };
    }
    return { open: false, extended: false };
  }

  window.SaltyHours = { DAYS, DEFAULT_HOURS, fmt, dateKey, hoursFor, statusNow };
})();

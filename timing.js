document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const $ = id => document.getElementById(id);
    const pad = n => String(n).padStart(2, "0");
    const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const hasNotif = "Notification" in window; // missing on iOS Safari (non-PWA): old code crashed here
    const PRE = 10 * 60000, GRACE = 5 * 60000;

    const store = {
        get(k) { try { return JSON.parse(localStorage.getItem("myramadan:" + k)); } catch { return null; } },
        set(k, v) { try { localStorage.setItem("myramadan:" + k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
    };

    let timings = null, loadedDay = "", busy = false, swReg = null;

    /* ---------- Notifications ---------- */
    const btn = $("notify-btn");

    function syncBtn() {
        if (!btn) return;
        if (!hasNotif) { btn.hidden = true; return; }
        if (Notification.permission === "granted") {
            btn.textContent = "Notifications Active";
            btn.style.cursor = "default";
        } else if (Notification.permission === "denied") {
            btn.textContent = "Notifications Blocked (allow in browser settings)";
        }
    }

    function show(title, body, tag) {
        if (!hasNotif || Notification.permission !== "granted") return;
        const opts = { body, tag, icon: "favicon.png" };
        const fallback = () => { try { new Notification(title, opts); } catch { /* unsupported */ } };
        // Service worker path is required for notifications on Android Chrome
        if (swReg) Promise.resolve(swReg.showNotification(title, opts)).catch(fallback);
        else fallback();
    }

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js")
            .then(() => navigator.serviceWorker.ready)
            .then(reg => { swReg = reg; })
            .catch(() => { /* falls back to new Notification() */ });
    }

    if (btn) {
        btn.addEventListener("click", async () => {
            if (!hasNotif || Notification.permission === "granted") return;
            try {
                const p = await Notification.requestPermission();
                if (p === "granted") show("Notifications Enabled! 🌙", "You will now be alerted 10 minutes before prayers.", "enabled");
                else if (p === "denied") alert("Please allow notifications in your browser settings to get alerts.");
            } catch { /* ignore */ }
            syncBtn();
        });
    }

    /* ---------- Time helpers ---------- */
    // Accepts "HH:MM" or "HH:MM (BST)"
    function at(str) {
        const m = /(\d{1,2}):(\d{2})/.exec(str || "");
        if (!m) return null;
        const d = new Date();
        d.setHours(+m[1], +m[2], 0, 0);
        return d;
    }
    const fmt = s => { const m = /(\d{1,2}):(\d{2})/.exec(s || ""); return m ? `${pad(+m[1])}:${m[2]}` : "--:--"; };

    function events() {
        if (!timings) return [];
        return [
            ["fajr", "Suhoor Ends", timings.Fajr],
            ["dhuhr", "Dhuhr", timings.Dhuhr],
            ["asr", "Asr", timings.Asr],
            ["maghrib", "Iftar", timings.Maghrib],
            ["isha", "Isha", timings.Isha]
        ].map(([id, name, t]) => ({ id, name, time: at(t) })).filter(e => e.time);
    }

    /* Fires each trigger once per day. Uses "now >= trigger" with a grace window instead of
       exact-minute matching, so throttled background timers no longer miss notifications,
       and persists fired keys so reloads / multiple tabs don't duplicate them. */
    function checkNotifications(now) {
        const today = dayKey(now);
        let fired = store.get("fired");
        if (!fired || fired.day !== today) fired = { day: today, keys: [] };
        let changed = false;

        events().forEach(e => {
            [["pre", new Date(e.time.getTime() - PRE)], ["at", e.time]].forEach(([kind, t]) => {
                const key = e.id + kind, late = now - t;
                if (late < 0 || late >= GRACE || fired.keys.includes(key)) return;
                if (kind === "pre" && now >= e.time) return;
                fired.keys.push(key);
                changed = true;
                if (kind === "pre") show("Get Ready! ⏳", `${e.name} is in 10 minutes.`, today + key);
                else show("It's Time 🕌", `It is now time for ${e.name}.`, today + key);
            });
        });
        if (changed) store.set("fired", fired);
    }

    function renderCountdown(now) {
        const el = $("countdown");
        if (!el || !timings) return;
        const list = events();
        let next = list.find(e => e.time > now), approx = "";
        if (!next && list.length) { // after Isha: tomorrow's Suhoor (approximate)
            next = { name: list[0].name, time: new Date(list[0].time.getTime() + 864e5) };
            approx = "~";
        }
        if (!next) return;
        const s = Math.max(0, Math.round((next.time - now) / 1000));
        el.textContent = `${next.name} in ${approx}${pad(Math.floor(s / 3600))}:${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`;
    }

    function tick() {
        const now = new Date();
        if (dayKey(now) !== loadedDay && !busy) load(); // new day: refresh timings
        checkNotifications(now);
        renderCountdown(now);
    }

    /* ---------- Data ---------- */
    function rows(id, list) {
        $(id).replaceChildren(...list.map(([name, t]) => {
            const d = document.createElement("div"), a = document.createElement("span"), b = document.createElement("span");
            a.textContent = name;
            b.textContent = fmt(t);
            d.append(a, b);
            return d;
        }));
    }

    function apply(c, fallback) {
        timings = c.t;
        loadedDay = dayKey();
        rows("iftar-suhoor", [["Suhoor Ends (Fajr)", c.t.Fajr], ["Iftar (Maghrib)", c.t.Maghrib]]);
        rows("prayer-times", [["Fajr", c.t.Fajr], ["Dhuhr", c.t.Dhuhr], ["Asr", c.t.Asr], ["Maghrib", c.t.Maghrib], ["Isha", c.t.Isha]]);
        const h = c.hijri;
        if (h && $("hijri-date")) $("hijri-date").textContent = `${h.day} ${h.month.en} ${h.year} AH`;
        if ($("location-note")) $("location-note").textContent = fallback ? "Location unavailable - showing Dhaka times." : "";
    }

    function showError() {
        const box = $("iftar-suhoor");
        box.textContent = "Couldn't load timings. ";
        const b = document.createElement("button");
        b.type = "button";
        b.className = "notify-btn";
        b.textContent = "Try Again";
        b.addEventListener("click", load);
        box.append(b);
        $("prayer-times").textContent = "";
    }

    function locate() {
        return new Promise(resolve => {
            const fb = { city: "Dhaka", id: "Dhaka", fallback: true };
            if (!navigator.geolocation) return resolve(fb);
            navigator.geolocation.getCurrentPosition(
                p => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, id: `${p.coords.latitude.toFixed(2)},${p.coords.longitude.toFixed(2)}` }),
                () => resolve(fb),
                { timeout: 8000, maximumAge: 36e5 }
            );
        });
    }

    async function fetchTimings(loc) {
        const d = new Date(), date = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
        const tune = "&tune=0,0,0,2,0,0,0,0,0"; // +2 min Dhuhr buffer (unchanged)
        const url = loc.city
            ? `https://api.aladhan.com/v1/timingsByCity/${date}?city=${encodeURIComponent(loc.city)}&country=Bangladesh&method=1&school=1${tune}`
            : `https://api.aladhan.com/v1/timings/${date}?latitude=${loc.lat}&longitude=${loc.lon}&method=1&school=1${tune}`;
        const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 10000);
        try {
            const res = await fetch(url, { signal: ctrl.signal });
            if (!res.ok) throw new Error("HTTP " + res.status);
            const json = await res.json();
            if (json.code !== 200 || !json.data || !json.data.timings) throw new Error("Bad response");
            return json.data;
        } finally { clearTimeout(timer); }
    }

    async function load() {
        busy = true;
        loadedDay = dayKey(); // prevents retry loops on failure; button / next day retries
        try {
            const loc = await locate();
            const key = `${dayKey()}|${loc.id}`;
            let c = store.get("timings");
            if (!c || c.key !== key) {
                const data = await fetchTimings(loc);
                c = { key, t: data.timings, hijri: data.date && data.date.hijri };
                store.set("timings", c);
            }
            apply(c, loc.fallback);
        } catch (err) {
            console.error("Error fetching timings:", err);
            const c = store.get("timings");
            if (c && c.key.startsWith(dayKey())) apply(c);
            else showError();
        } finally { busy = false; }
    }

    syncBtn();
    load();
    setInterval(tick, 1000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) tick(); });
});

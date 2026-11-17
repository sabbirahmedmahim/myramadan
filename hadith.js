document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("hadith-container");
    if (!container) return;

    const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const d = new Date();
    const today = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    // Same Ayah all day (matches "Ayah of the Day"), different each day
    const ayahNo = (Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5) * 7919 % 6236) + 1;

    function render(data) {
        const ar = data[0], en = data[1];
        container.innerHTML = `
            <div lang="ar" style="font-size: 24px; margin-bottom: 15px; line-height: 1.8; font-family: 'Amiri', serif; direction: rtl;">
                ${esc(ar.text)}
            </div>
            <div style="opacity: 0.9; margin-bottom: 10px; font-size: 16px;">
                "${esc(en.text)}"
            </div>
            <small style="opacity: 0.6; font-weight: bold;">
                — Surah ${esc(en.surah.englishName)} (${esc(en.surah.englishNameTranslation)}), Ayah ${esc(en.numberInSurah)}
            </small>`;
    }

    function showError() {
        container.innerHTML = `<div style="color:#ffb3b3;">Failed to load Ayah.</div>`;
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = "Try Again";
        b.style.cssText = "margin-top:10px;padding:6px 12px;background:#4CAF50;color:white;border:none;border-radius:6px;cursor:pointer;";
        b.addEventListener("click", load);
        container.append(b);
    }

    function load() {
        try {
            const c = JSON.parse(localStorage.getItem("myramadan:ayah"));
            if (c && c.day === today && Array.isArray(c.data)) return render(c.data);
        } catch { /* no cache */ }

        container.textContent = "Loading Ayah of the Day...";
        const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 10000);
        fetch(`https://api.alquran.cloud/v1/ayah/${ayahNo}/editions/quran-uthmani,en.asad`, { signal: ctrl.signal })
            .then(res => { if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`); return res.json(); })
            .then(json => {
                if (json.code !== 200 || !Array.isArray(json.data) || json.data.length < 2) throw new Error("API failed");
                try { localStorage.setItem("myramadan:ayah", JSON.stringify({ day: today, data: json.data })); } catch { /* ignore */ }
                render(json.data);
            })
            .catch(err => { console.error("Ayah Fetch Error:", err); showError(); })
            .finally(() => clearTimeout(timer));
    }

    load();
});

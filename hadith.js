document.addEventListener("DOMContentLoaded", () => {
    
    const container = document.getElementById("hadith-container"); 
    if (!container) return;

    container.innerHTML = "Loading Ayah of the Day...";

    
    const randomAyah = Math.floor(Math.random() * 6236) + 1;
    
    
    const apiUrl = `https://api.alquran.cloud/v1/ayah/${randomAyah}/editions/quran-uthmani,en.asad`;

    fetch(apiUrl)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (data.code !== 200) throw new Error("API failed");

            
            const arabicData = data.data[0];
            const englishData = data.data[1];
            
            
            container.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 15px; line-height: 1.8; font-family: 'Amiri', serif; direction: rtl;">
                    ${arabicData.text}
                </div>
                <div style="opacity: 0.9; margin-bottom: 10px; font-size: 16px;">
                    "${englishData.text}"
                </div>
                <small style="opacity: 0.6; font-weight: bold;">
                    — Surah ${englishData.surah.englishName} (${englishData.surah.englishNameTranslation}), Ayah ${englishData.numberInSurah}
                </small>
            `;
        })
        .catch(error => {
            console.error("Ayah Fetch Error:", error);
            container.innerHTML = `
                <div style="color:#ffb3b3;">Failed to load Ayah.</div>
                <button onclick="location.reload()" style="
                    margin-top:10px; 
                    padding:6px 12px; 
                    background:#4CAF50; 
                    color:white; 
                    border:none; 
                    border-radius:6px; 
                    cursor:pointer;
                ">Try Again</button>
            `;
        });
});
document.addEventListener("DOMContentLoaded", () => {
    let timingsData = null; 

    const notifyBtn = document.getElementById("notify-btn");
    
    if (Notification.permission === "granted") {
        if(notifyBtn) notifyBtn.style.display = "none";
    }

    if (notifyBtn) {
        notifyBtn.addEventListener("click", () => {
            if ("Notification" in window) {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        new Notification("Notifications Enabled! 🌙", { 
                            body: "You will now be alerted 10 minutes before prayers." 
                        });
                        notifyBtn.style.display = "none";
                    }
                });
            }
        });
    }

    function sendNotification(title, body) {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, { body: body });
        }
    }

    setInterval(() => {
        if (!timingsData) return;

        const now = new Date();
        if (now.getSeconds() === 0) {
            let currentHour = now.getHours().toString().padStart(2, '0');
            let currentMin = now.getMinutes().toString().padStart(2, '0');
            let currentTimeString = `${currentHour}:${currentMin}`;

            const prayers = [
                { name: "Suhoor Ends", time: timingsData.Fajr },
                { name: "Iftar", time: timingsData.Maghrib },
                { name: "Dhuhr", time: timingsData.Dhuhr },
                { name: "Asr", time: timingsData.Asr },
                { name: "Isha", time: timingsData.Isha }
            ];

            prayers.forEach(prayer => {
                let [h, m] = prayer.time.split(':').map(Number);
                let targetDate = new Date();
                targetDate.setHours(h, m - 10, 0, 0);
                
                let notifyHour = targetDate.getHours().toString().padStart(2, '0');
                let notifyMin = targetDate.getMinutes().toString().padStart(2, '0');
                let notifyString = `${notifyHour}:${notifyMin}`;

                if (currentTimeString === notifyString) {
                    sendNotification("Get Ready! ⏳", `${prayer.name} is in 10 minutes.`);
                }

                if (currentTimeString === prayer.time) {
                    sendNotification("It's Time 🕌", `It is now time for ${prayer.name}.`);
                }
            });
        }
    }, 1000);

    function fetchTimings(city, lat, lon) {
        let tune = "&tune=0,0,0,2,0,0,0,0,0"; 
        
        let url = city 
            ? `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=Bangladesh&method=1&school=1${tune}`
            : `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=1&school=1${tune}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                timingsData = data.data.timings;
                const t = data.data.timings;
                
                document.getElementById("iftar-suhoor").innerHTML = `
                    <div><span>Suhoor Ends (Fajr)</span> <span>${t.Fajr}</span></div>
                    <div><span>Iftar (Maghrib)</span> <span>${t.Maghrib}</span></div>
                `;
                document.getElementById("prayer-times").innerHTML = `
                    <div><span>Fajr</span> <span>${t.Fajr}</span></div>
                    <div><span>Dhuhr</span> <span>${t.Dhuhr}</span></div>
                    <div><span>Asr</span> <span>${t.Asr}</span></div>
                    <div><span>Maghrib</span> <span>${t.Maghrib}</span></div>
                    <div><span>Isha</span> <span>${t.Isha}</span></div>
                `;
            })
            .catch(error => console.error("Error fetching timings:", error));
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => fetchTimings(null, pos.coords.latitude, pos.coords.longitude),
            () => fetchTimings("Dhaka") 
        );
    } else {
        fetchTimings("Dhaka");
    }
});

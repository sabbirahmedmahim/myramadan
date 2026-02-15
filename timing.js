document.addEventListener("DOMContentLoaded", () => {
    function fetchTimings(city, lat, lon) {
        let url = city 
            ? `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=Bangladesh&method=2`
            : `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
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
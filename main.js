document.addEventListener("DOMContentLoaded", () => {
    const today = new Date();
    document.getElementById("today-date").innerText =
        today.toDateString();
});

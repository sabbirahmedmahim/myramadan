# 🌙 myRamadan - Daily Ramadan Companion

**Live Demo:** [https://myramadanbysabbir.netlify.app/]

A lightweight frontend web application built to serve as a daily companion during Ramadan, focusing on accurate local timings and daily reflection. Slightly vibecoded, but highly functional and does exactly what it needs to.

## ✨ Features

* **Dynamic Prayer & Fasting Timings:** Uses the HTML5 Geolocation API and the Aladhan API to automatically fetch accurate local Iftar, Suhoor, and daily prayer schedules.
* **Smart Notifications:** Includes a custom browser notification system that alerts users 10 minutes before, and exactly at the time of, every prayer and fast milestone.
* **Daily Inspiration:** Integrates the AlQuran Cloud API to serve a newly translated Ayah on every visit.
* **Modern UI:** Features a custom dark-themed interface utilizing glassmorphism styling and smooth CSS animations.
* **Downloadable Assets:** Includes a seamless one-click download for a custom printable Ramadan journal PDF to track fasting and prayers.

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript
* **APIs:** 
  * [Aladhan API](https://aladhan.com/prayer-times-api) (Configured for Method 1: Karachi, School 1: Hanafi, with a +2 minute safety buffer for Dhuhr).
  * [AlQuran Cloud API](https://alquran.cloud/api)
* **Deployment:** GitHub -> Netlify Continuous Deployment

## 🏗️ System Architecture

Below is the conceptual structure of the application's logic:

```mermaid
classDiagram
    direction TB
    
    class AppController {
        +init()
        -updatePrayerUI(timings)
        -updateIftarUI(timings)
    }

    class LocationManager {
        +getCurrentPosition() : Coordinates
        -handleLocationDenied() : String
    }

    class PrayerTimingAPI {
        -baseUrl : String
        -timingsData : Object
        +fetchTimings(lat, lon) : Object
        +fetchTimingsByCity(city) : Object
    }

    class NotificationManager {
        -hasPermission : Boolean
        -notifyBtn : HTMLElement
        +requestPermission()
        +startBackgroundClock(timingsData)
        -sendNotification(title, body)
    }

    class AyahAPI {
        -baseUrl : String
        +fetchRandomAyah() : Object
        -updateAyahUI(ayahData)
    }

    AppController --> LocationManager : Requests Location
    AppController --> PrayerTimingAPI : Fetches Timings
    AppController --> NotificationManager : Initializes Alerts
    AppController --> AyahAPI : Fetches Daily Ayah
    NotificationManager ..> PrayerTimingAPI : Requires Timings Data

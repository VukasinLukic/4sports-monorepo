# 4SPORTS — Technology Stack v2.0
**Cost-Optimized & Feature-Specific**

## 1. Frontend (Web Admin Panel)
*Fokus: Data visualization & Dark Mode UI*

* **Core:** React + TypeScript + Vite
* **UI Framework:** **TailwindCSS** + **shadcn/ui** (perfektan za Dark Mode estetiku sa slika).
* **Data Visualization (Ključno za Dashboard):**
    * **Recharts** (Najbolji za React, besplatan, podržava Line, Donut i Pie chartove sa slike `3.png`).
* **State Management:** React Query (TanStack Query) - za sinhronizaciju sa bazom.
* **Forms:** React Hook Form + Zod.
* **Hosting:** **Vercel** (Free Tier).

## 2. Mobile App (Treneri & Roditelji)
*Fokus: QR Scanning & Performance*

* **Core:** React Native + **Expo** (Managed Workflow).
* **QR funkcionalnost (Ključno za `Lista V2.png`):**
    * **Expo Camera** (za skeniranje QR kodova trenera).
    * **react-native-qrcode-svg** (za generisanje QR koda člana).
* **UI Komponente:**
    * **React Native Paper** ili **Tamagui** (podržavaju Dark Mode out-of-the-box).
    * **Lucide React Native** (ikonice kao na slikama).
* **Navigation:** Expo Router ili React Navigation.
* **Build Servis:** **EAS Build** (Free tier je dovoljan za početak).

## 3. Backend & API
*Fokus: Logic & Scheduling*

* **Runtime:** Node.js.
* **Framework:** Express.js.
* **Database:** **MongoDB Atlas** (Free Tier).
    * *Zašto:* Idealna za hijerarhiju (Klub -> Grupe -> Članovi) i čuvanje istorije prisustva.
* **Task Scheduling (Za reset članarina/lekarskih):**
    * **node-cron** (Besplatna biblioteka koja trči unutar Node procesa).
    * *Logika:* Skripta koja se pokreće u ponoć 1. u mesecu.
* **Hosting:** **Render** (Free Tier) - podržava Node servise koji rade non-stop (potrebno za cron poslove, mada na free tier-u može zaspati, pa ćemo koristiti *UptimeRobot* da ga drži budnim).

## 4. Integrations & Services (Sve Free Tiers)

* **Auth:** **Firebase Authentication**
    * Email/Password login.
    * Lako upravljanje sesijama na mobilnom i webu.
* **Storage:** **Firebase Storage**
    * Za čuvanje profilnih slika članova i slika/videa u "Novostima".
* **Emails:** **Resend** (do 3000 emailova mesečno besplatno).
    * Za invite kodove i reset lozinke.
* **Push Notifikacije:** **Expo Push API** (Potpuno besplatno).
    * Ključno za podsetnike za članarinu i promene termina.

## 5. Development Tools
* **Dizajn:** Figma (već imaš dizajn, koristimo Inspect tab).
* **Version Control:** GitHub.
* **API Testing:** Postman.

## 6. Struktura Troškova (Mesečno)

| Servis | Tier | Cena |
| :--- | :--- | :--- |
| **Vercel** | Hobby | $0 |
| **Render** | Free | $0 |
| **MongoDB** | M0 Sandbox | $0 |
| **Firebase** | Spark | $0 |
| **Expo** | Free | $0 |
| **Resend** | Free | $0 |
| **Ukupno** | **MVP** | **$0.00** |

---

### Architecture Diagram (Simplified)

```mermaid
graph TD
    User[Korisnik] -->|Mobile App| RN[React Native / Expo]
    Admin[Vlasnik] -->|Web Dashboard| React[React / Vite]
    
    RN -->|API Request| API[Node.js / Express]
    React -->|API Request| API
    
    API -->|Auth Check| Firebase[Firebase Auth]
    API -->|Read/Write| Mongo[MongoDB Atlas]
    API -->|Store Files| Storage[Firebase Storage]
    
    Note over RN: Koristi Kameru za QR\ni Push Notifikacije
    Note over React: Koristi Recharts\nza Analitiku
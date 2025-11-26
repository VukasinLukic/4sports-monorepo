# 4SPORTS — PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Verzija:** 2.0 (Final MVP)
**Status:** Ready for Development
**Dizajn referenca:** Dark Mode / Green Accent Style

---

## 1. Uvod i Vizija
**4sports** je platforma za digitalizaciju sportskih klubova koja eliminiše papirologiju i "Excel tabele".
**Ključna filozofija:** Aplikacija ne procesira novac direktno, već služi kao **precizna evidencija** (Truth Source) za vlasnike, trenere i roditelje.

---

## 2. Arhitektura Korisnika i "Invite" Sistem
[cite_start]Sistem koristi hijerarhijski model pozivanja (Invite Codes) kako bi se osigurala privatnost i struktura kluba[cite: 5, 6].

1.  **Vlasnik (Super Admin):** Kreira klub. Generiše kod za Trenere.
2.  **Trener:** Instalira app, unosi kod vlasnika → ulazi u klub. Generiše kod za Svoje Grupe/Članove.
3.  **Član/Roditelj:** Instalira app, unosi kod trenera → ulazi u grupu.

---

## 3. Funkcionalnosti po Rolama

### 🏛 3.1. Vlasnik Kluba (Web Admin Panel)
*Dizajn reference: Dashboard sa slike 3.png (Dark mode, grafikoni)*

**A. Dashboard (Kontrolna tabla)**
* [cite_start]**KPI Kartice:** Trenutni novčani prihod, % novih članova, Ukupan broj članova, Broj transakcija[cite: 11].
* **Vizuelizacija:**
    * Line Chart: Rast broja članova kroz mesece.
    * Donut Chart: Bilans (Prihod vs Gubitak).
    * Pie Chart: Prihod po kvartalima.
    * Bar Chart: Prihodi i rashodi po mesecima.

**B. Finansije**
* **Manuelni unos:** Mogućnost dodavanja priliva i odliv novca (npr. "Zakup sale", "Oprema").
* [cite_start]**Pregled:** Tabela svih uplata članarina (koje su treneri evidentirali)[cite: 11].

**C. Administracija**
* [cite_start]**Ugovori:** Evidencija do kada važi ugovor za kog trenera[cite: 12].
* [cite_start]**Upravljanje limitima:** Sistem prati limit broja članova na osnovu paketa koji klub plaća 4sports-u[cite: 3, 4].

---

### 👟 3.2. Trener (Mobile App)
*Dizajn reference: Lista V2.png, Kalendar V2.png*

**A. [cite_start]Kalendar i Događaji [cite: 18, 19]**
* **Tipovi događaja:** Trening (jedna boja) vs Takmičenje (druga boja).
* **Kreiranje:** Odabir grupe, vremena i tipa događaja.

**B. [cite_start]Evidencija Prisustva (Attendance) [cite: 24, 25]**
* **QR Skener:** Dugme "Skeniraj" otvara kameru za skeniranje QR koda člana.
* **Manuelni unos:** Dugme "Dodaj Ručno" za članove koji nemaju telefon.
* **Lista:** Prikaz liste "Potvrđeno" (Zeleni status) i "Nepotvrđeno" (Sivi/Crveni status).

**C. [cite_start]Članarine (Membership Logic) [cite: 21]**
* **Status:** Platio / Nije platio.
* **Logika:** Status se automatski resetuje na "Nije platio" prvog u mesecu.
* **Akcije:**
    * Dugme "Evidentiraj uplatu".
    * Dugme "Pošalji podsetnik" (Push notifikacija roditeljima koji duguju).

**D. [cite_start]Medicinski Pregledi [cite: 22, 23]**
* **Logika:** Status "Urađen" / "Istekao". Resetuje se automatski nakon 365 dana od poslednjeg unosa.
* **Notifikacije:** Automatsko upozorenje treneru kad članu ističe pregled.

**E. [cite_start]Novosti (Feed) [cite: 20]**
* Objavljivanje slika/videa i teksta za svoje grupe.

---

### 👤 3.3. Član / Roditelj (Mobile App)
*Dizajn reference: Profil člana*

**A. [cite_start]Profil (QR Identitet) [cite: 29]**
* Prikaz ličnog QR koda za skeniranje na treningu.
* Podaci: Visina, težina, pozicija u timu, slika.

**B. Statusi**
* **Finansije:** Jasna indikacija da li je članarina za tekući mesec plaćena ili ne.
* **Prisustvo:** Pregled na koliko treninga je dete bilo prisutno.

**C. [cite_start]Kalendar [cite: 30]**
* Pregled budućih treninga.
* Opcija "Najavi odsustvo" (Dolazim / Ne dolazim).

---

## 4. Tehnička Logika (Backend Rules)

1.  [cite_start]**Subscription Limits:** Backend mora da blokira dodavanje novog člana ako je `current_members >= plan_limit`[cite: 4].
2.  **Invite Code Validation:** Kod mora biti vezan za specifičan Klub (za trenere) ili Grupu (za članove).
3.  **Cron Jobs (Automatizacija):**
    * Svakog 1. u mesecu: Resetuj status plaćanja svim aktivnim članovima na `false`.
    * Svakog dana: Proveri datume medicinskih pregleda; ako je `last_exam_date > 1 year`, setuj status na `expired`.

## 5. UI/UX Zahtevi
* **Tema:** Dark Mode (Background: `#121212`, Surface: `#1E1E1E`, Primary: `#00E676` ili slična zelena sa slika).
* **Interakcije:** Swipe gestures, Modalni prozori (Bottom Sheet) za brze akcije.
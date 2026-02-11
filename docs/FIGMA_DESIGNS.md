# Figma Designs Documentation

Ovaj dokument sadrži detaljne opise svih Figma dizajnova za mobilnu aplikaciju, uključujući UI opise i polja za modele/entitete.

---

## 1. Grupe (Groups)

### 1.1 Lista Grupa
**Figma Link:** https://www.figma.com/design/w8ytqinjzKLDDzVprYXgqx/Untitled?node-id=1-2863&m=dev

**Opis:**
Ekran koji prikazuje listu svih grupa u klubu. Treneri mogu da vide sve dostupne grupe i da kreiraju nove.
Izlaze grupe npr. Juniori Seniori i kad se klikne na grupu, komponenta se prosiri i izlistaju se clanovi te grupe gde pise ime, slika, da li je platio clanarinu i kad je poslednji put bio aktivan

**UI Elementi:**
- Lista grupa sa osnovnim informacijamah
- Dugme za kreiranje nove grupe
- Dugme za invite novog membera

**Podaci za Model/Entitet:**

---

### 1.2 Kreiranje Grupe
**Figma Link:** https://www.figma.com/design/w8ytqinjzKLDDzVprYXgqx/Untitled?node-id=1-3165&m=dev

**Opis:**
Forma za kreiranje nove grupe. Omogućava unos osnovnih informacija o grupi.

**UI Elementi:**
- Polje za naziv grupe
- Polje za opis grupe (opciono)
- color picker
- Dugme za cuvanje
- Dugme za otkazivanje

Svaka grupa treba da ima svoju boju
---

## 2. Invitovanje Članova (Member Invitation)

### 2.1 Odabir Grupe za Invitovanje
**Figma Link:** https://www.figma.com/design/w8ytqinjzKLDDzVprYXgqx/Untitled?node-id=1-3132&m=dev

**Opis:**
Ekran gde se bira grupa u koju će se novi član dodati nakon registracije. Korisnik bira grupu pre slanja pozivnice.

**UI Elementi:**
- Lista dostupnih grupa za odabir
- dropdown  za odabir grupe
- Dugme za kopiranje poruke koja sadrzi ivnite kod
- Dugme za nazad

Kod treba da reprezentuje grupu i klub a ne membera, znaci jedan kod skenira npr 30 istih ljudi koji se dodaju u 1 grupu tog kluba

**Napomena:** Nakon što se član registruje sa pozivnicom, automatski se dodaje u odabranu grupu i klub.

---

## 3. Evidencija (Attendance/Records)

### 3.1 Lista Članova po Grupama za Evidenciju
**Figma Link:** https://www.figma.com/design/w8ytqinjzKLDDzVprYXgqx/Untitled?node-id=1-1228&m=dev

**Opis:**
Ekran za evidenciju članova. Prikazuje listu članova organizovanu po grupama. Omogućava označavanje ko je platio članarinu i ko je uradio medicinski pregled. Postoji i funkcionalnost za slanje podsetnika (zvonce) onima koji nisu.

**UI Elementi:**
na vrhu search bar i 2 dugmeta da toggluju da li proveravamo membershipe ili medicinske preglede

- Izlistavaju se sve grupe i na klik Dropdown membera
- Lista članova sa:
  - Ime i prezime člana
  - Checkbox za članarinu (paid/unpaid)
  - Ikona zvona za slanje podsetnika
- Filter opcije (opciono)

**Podaci za Model/Entitet:**

**AttendanceRecord:**
- `id` - jedinstveni identifikator evidencije
- `memberId` (required) - ID člana
- `groupId` (required) - ID grupe
- `month` (required) - mesec evidencije (format: YYYY-MM)
- `membershipPaid` (boolean) - da li je članarina plaćena
- `membershipPaidDate` (date, optional) - datum plaćanja članarine
- `medicalCheckupDone` (boolean) - da li je medicinski pregled urađen
- `medicalCheckupDate` (date, optional) - datum medicinskog pregleda
- `reminderSent` (boolean) - da li je poslat podsetnik
- `reminderSentAt` (date, optional) - datum slanja podsetnika
- `createdAt` - datum kreiranja evidencije
- `updatedAt` - datum ažuriranja evidencije

**Napomena:** Ovo je različito od kalendara sa eventovima. Evidencija je mesečna provera statusa članova.

---

## 4. Kreiranje Događaja (Event Creation)

### 4.1 Osnovne Informacije o Događaju 
**Figma Link:** https://www.figma.com/design/w8ytqinjzKLDDzVprYXgqx/Untitled?node-id=1-2790&m=dev

**Opis:**
Forma za kreiranje novog događaja sa osnovnim informacijama. Ovo je minimalna verzija koja je dovoljna za kreiranje događaja.

**UI Elementi:**
grupa (bira se iz dropdowna), tip dogadjaja (isto dropdown od vec predefinisanih Training, Gym Training, Match, Add Event (za novi predefinisani)), datum, vreme pocetka, vreme zavrsetka, da se oznaci da li se ponavlja (ispisana slova m t w t f s s, za dane u nedelji i da posvetle zeleno oni dani na koji treba da se ponovi trening u kalendaru)

Onda ispod toga dugme advanced options i onda tu ima i: lokacija, oprema (u formi niza stringova i da moze da se doda npr. lopta), min i max ucesnika i opis eventa. Sve advanced je opciono pri kreiranju.  DOle dugmici save i cancel


---

### 4.2 Napredne Informacije o Događaju (Sa Advanced)
**Figma Link:** https://www.figma.com/design/w8ytqinjzKLDDzVprYXgqx/Untitled?node-id=1-2484&m=dev


---

## 5. Profil Člana (Member Profile)

### 5.1 Glavni Profil Člana
**Figma Link:** https://www.figma.com/design/w8ytqinjzKLDDzVprYXgqx/Untitled?node-id=1-2956&m=dev

**Opis:**
Ekran profila člana koji se otvara kada se klikne na člana iz liste članova. Prikazuje osnovne informacije o članu.

**UI Elementi:**
Podsetnik za placanje 
- Profilna slika člana
- Ime i prezime
- Email
- Broj telefona
- Datum rođenja
- Grupa u kojoj je član
- Tabovi za:
  - Membership (članarina)
  - Attendance (prisustvo)
- Dugme za izmenu profila (opciono)


### 5.2 Membership Tab (Članarina)
**Figma Link:** https://www.figma.com/design/w8ytqinjzKLDDzVprYXgqx/Untitled?node-id=1-3022&m=dev

**Opis:**
Tab unutar profila člana koji prikazuje informacije o članarini i istoriji plaćanja.

**UI Elementi:**
- Trenutni status članarine (active/inactive/expired)
- Datum isteka članarine
- Mesečna cena članarine
- Lista istorije plaćanja:
  - Datum plaćanja
  - Iznos
  - Status (paid/pending/overdue)
  - Metod plaćanja


### 5.3 Attendance Tab (Prisustvo)
**Figma Link:** https://www.figma.com/design/w8ytqinjzKLDDzVprYXgqx/Untitled?node-id=1-3315&m=dev

**Opis:**
Tab unutar profila člana koji prikazuje istoriju prisustva na događajima/treningovima.

**UI Elementi:**
- Ukupan broj prisustva
- Procentualna stopa prisustva
- Lista događaja sa:
  - Naziv događaja
  - Datum i vreme
  - Status prisustva (attended, absent, excused)
  - Napomene (opciono)
- Filter po periodu (mesečno, godišnje)
- Grafik prisustva (opciono)

**Podaci za Model/Entitet:**

**EventAttendance:**
- `id` - jedinstveni identifikator prisustva
- `eventId` (required) - ID događaja
- `memberId` (required) - ID člana
- `status` (required) - status (attended, absent, excused, pending)
- `confirmedAt` (optional) - datum potvrde prisustva
- `checkedInAt` (optional) - datum check-in-a na događaju
- `notes` (optional) - napomene
- `createdAt` - datum kreiranja
- `updatedAt` - datum ažuriranja

---

## 6. Događaji na Home Screenu

### 6.1 Lista Predstojećih Događaja
**Figma Link:** https://www.figma.com/design/w8ytqinjzKLDDzVprYXgqx/Untitled?node-id=1-3361&m=dev

**Opis:**
Home screen koji prikazuje listu predstojećih događaja. Klikom na događaj otvara se detaljan prikaz.

**UI Elementi:**
- Lista događaja sa:
  - Naziv događaja
  - Datum i vreme
  - Lokacija
  - Tip događaja (ikonica)
  - Broj potvrđenih učesnika
- Pull to refresh funkcionalnost
- Filter opcije (opciono)
- Dugme za kreiranje novog događaja (za trenere)

**Podaci za Model/Entitet:**
- Koristi Event model iz sekcije 4

---

### 6.2 Detalji Događaja - Overview
**Figma Link:** https://www.figma.com/design/w8ytqinjzKLDDzVprYXgqx/Untitled?node-id=1-1692&m=dev

**Opis:**
Ekran sa detaljnim pregledom događaja. Prikazuje sve osnovne informacije o događaju.

**UI Elementi:**
Imaju 2 dugmeta: Overview i Participants
Overview kad je tooglovan:
 Sve informacije koje je trener popunio kada je pravio trening
Participants kad je togglovan:

 prikazuje listu učesnika koji su potvrdili prisustvo ili su pozvani.

**UI Elementi:**
Statistika
total broj ljudi, od toga confirmed toliko, not confirmed toliko, ispod toga search bar
- Lista učesnika sa:
  - Profilna slika
  - Ime i prezime
  - Status (confirmed/not confirmed)
  - Check-in status ikonica sa desne strane (checked in / not checked in)
 Kada se klikne ta ikonica evidentira se da je dosao ili nije dosao.

 Pored toga gore ima QR generator dugme o kome smo pricali

**Podaci za Model/Entitet:**
- Koristi EventAttendance model iz sekcije 5.3

---

## 7. Registracija (Registration)

### 7.1 Početni Screen Registracije

Pocetni screen: https://www.figma.com/design/w8ytqinjzKLDDzVprYXgqx/Untitled?node-id=1-1206&m=dev  Ima 4sports logo, polje za invite kod, dugme da uneses, i already have an account, koji vodi na login. E kada kliknes insert, otvara se zapravo register, gde ti gore izadje Ime i slika kluba kao i tvoja uloga (to se zna jer je vlasnik pri generisanju invite linka predodredio ulogu/ ili je trener predodredio ulogu jer inivituje membere), i onda korisnik unosi svoje podatke (Ime prezime, datum rodjenja, email, JMBG, broj telefona, sifra, potvra sifre) i registruje nalog na dugme Register, iznad ima Aldrady have an account? i checkbox za terms and conditions


## 8. Member/Parent Home Screen

### 8.1 Potvrda Prisustva na Sledećem Treningu
**Figma Link:** https://www.figma.com/design/w8ytqinjzKLDDzVprYXgqx/Untitled?node-id=1-3990&m=dev

**Opis:**
Na vrhu home screena za članove/roditelje postoji sekcija gde mogu da potvrde svoje prisustvo na sledećem treningu. Imaju da cekiraju Dolazim/ Ne dolazim, a ispod toga novosti


## 9. Istorija za Članove/Roditelje

### 9.1 Istorija Plaćanja
**Figma Link:** https://www.figma.com/design/w8ytqinjzKLDDzVprYXgqx/Untitled?node-id=1-3694&m=dev

**Opis:**
Ekran koji prikazuje istoriju svih plaćanja članarine za trenutnog korisnika (člana ili roditelja).

**UI Elementi:**
- Lista plaćanja sa:
  - Datum plaćanja
  - Iznos
  Ukupno dugovanje
  - Status (paid, pending, overdue)
  - Metod plaćanja - string (kes, kartica)
  - Mesečni period za koji je plaćeno
---

### 9.2 Istorija Prisustva
**Figma Link:** https://www.figma.com/design/w8ytqinjzKLDDzVprYXgqx/Untitled?node-id=1-3649&m=dev

**Opis:**
Ekran koji prikazuje istoriju prisustva na događajima/treningovima za trenutnog korisnika.


### 9.3 Profil Korisnika (Member/Parent Profile)
**Figma Link:** https://www.figma.com/design/w8ytqinjzKLDDzVprYXgqx/Untitled?node-id=1-3854&m=dev

**Opis:**
Ekran profila trenutnog korisnika (člana ili roditelja). Omogućava pregled i izmenu ličnih podataka.

**UI Elementi:**
- Profilna slika (sa mogućnošću promene)
- Ime i prezime
- Email
- Broj telefona
- Datum rođenja
- Adresa
- POdaci: Visina tezina, godine, godine iskustva, koja je uloga u timu (npr. golman), broj dresa
- Grupa u kojoj je član
- Dugme za izmenu profila
- Dugme za promenu lozinke
- Dugme za odjavu
- Linkovi ka:
  - Istoriji plaćanja
  - Istoriji prisustva
  - Postavkama (opciono)

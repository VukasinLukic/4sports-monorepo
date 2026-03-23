🏋️ Analiza Uloge Trenera (COACH) u 4Sports Codebase
Rezime
Trener (COACH) je druga po rangu uloga u sistemu, odmah ispod Vlasnika (OWNER). Trener koristi mobilnu aplikaciju za upravljanje grupama, događajima, prisustvom, članarinama i komunikacijom. U web-admin panelu, trener se prikazuje kao entitet kojim upravlja vlasnik kluba.

1. Šta se beleži za Trenera u bazi
Trener je User dokument u MongoDB kolekciji users sa role: 'COACH'.

Polja u bazi (
User.ts
)
Polje	Tip	Obavezno	Opis
_id	ObjectId	Auto	Primarni ključ
firebaseUid	String	✅	Firebase Authentication ID (unique)
email	String	✅	Email adresa (unique, lowercase)
fullName	String	✅	Puno ime (2-100 karaktera)
phoneNumber	String	❌	Telefon (min 8 cifara)
profileImage	String	❌	URL profilne slike
role	Enum	✅	Uvek 'COACH'
clubId	ObjectId	✅	Referenca na Club kome pripada
pushToken	String	❌	Expo push notification token
createdAt	Date	Auto	Datum kreiranja naloga
updatedAt	Date	Auto	Datum poslednje izmene
NOTE

Trener nema sopstvene podatke poput datuma rođenja, JMBG-a, visine/težine itd. u trenutnom modelu. Te atribute imaju samo Članovi (Member). Po PRD-u, planira se dodavanje dateOfBirth i jmbg u User model.

Veze sa drugim kolekcijama
Pored users kolekcije, trener se pojavljuje i u:

Kolekcija	Polje	Opis
groups	coaches: [ObjectId]	Niz trenera dodeljenih grupi
events	createdBy: ObjectId	Trener koji je kreirao događaj
attendance	markedBy: ObjectId	Trener koji je označio prisustvo
posts	authorId: ObjectId	Trener kao autor objave
payments	createdBy: ObjectId	Trener koji je evidentirao plaćanje
medicalChecks	uploadedBy: ObjectId	Trener koji je uploadovao pregled
inviteCodes	createdBy: ObjectId	Trener koji je generisao kod
notifications	recipientId: ObjectId	Trener kao primalac notifikacija
2. Hijerarhija Uloga
OWNER (3)  >  COACH (2)  >  PARENT (1) = MEMBER (1)
Definisano u 
User.ts#L160-L165
:

typescript
const roleHierarchy = {
  OWNER: 3,
  COACH: 2,
  PARENT: 1,
  MEMBER: 1,  // Isti nivo kao PARENT
};
3. Registracija Trenera
Flow (iz 
authController.ts
):
Vlasnik generiše invite kod tipa 'COACH'
Trener instalira mobilnu aplikaciju
Unosi invite kod pri registraciji
Sistem automatski dodeljuje ulogu COACH iz tipa invite koda
Trener se povezuje sa klubom iz invite koda
Seed Data primer (
seedAll.ts
):
typescript
const COACHES = [
  { email: 'trener.marko@4sports.demo', fullName: 'Marko Nikolić', phone: '+381641234567' },
  { email: 'trener.stefan@4sports.demo', fullName: 'Stefan Jovanović', phone: '+381642345678' },
  { email: 'trener.milan@4sports.demo', fullName: 'Milan Petrović', phone: '+381643456789' },
];
Invite kod za trenere: TRENER2025 (maxUses: 5, važi 30 dana)

4. Kompletna Lista Mogućnosti Trenera
📅 Događaji (Events)
Akcija	Ruta	Pristup
Kreiraj događaj	POST /events	✅ COACH
Ažuriraj događaj	PUT /events/:id	✅ COACH
Obriši događaj	DELETE /events/:id	✅ COACH
Pregledaj sve događaje	GET /events	✅ svi
Pregledaj događaje grupe	GET /events/group/:groupId	✅ svi
Pregledaj QR kod događaja	GET /events/qr/:qrCode	✅ svi
Pregledaj učesnike	GET /events/:id/participants	✅ svi
Izvor: 
eventRoutes.ts

✅ Prisustvo (Attendance)
Akcija	Ruta	Pristup
Označi prisustvo (pojedinačno)	POST /attendance/mark	✅ COACH
Označi prisustvo (grupno)	POST /attendance/bulk-mark	✅ COACH
Pregledaj prisustvo po događaju	GET /attendance/event/:eventId	✅ svi
Pregledaj prisustvo člana	GET /attendance/member/:memberId	✅ svi
Izvor: 
attendanceRoutes.ts

👥 Grupe (Groups)
Akcija	Ruta	Pristup
Kreiraj grupu	POST /groups	✅ COACH
Ažuriraj grupu	PUT /groups/:id	✅ COACH
Obriši grupu	DELETE /groups/:id	❌ samo OWNER
Pregledaj sve grupe	GET /groups	✅ svi
Pregledaj članove grupe	GET /groups/:id/members	✅ svi
Dodaj člana u grupu	POST /groups/:id/members	✅ COACH
Ukloni člana iz grupe	DELETE /groups/:id/members/:memberId	✅ COACH
Izvor: 
groupRoutes.ts

🎟️ Invite Kodovi
Akcija	Ruta	Pristup
Generiši invite kod	POST /invites/generate	✅ COACH
Pregledaj sve kodove kluba	GET /invites	✅ COACH
Deaktiviraj kod	DELETE /invites/:code	❌ samo OWNER
Izvor: 
inviteRoutes.ts

📋 Evidencija (Membership & Medical)
Akcija	Ruta	Pristup
Pregledaj evidenciju članarina	GET /evidence/membership	✅ COACH
Označi članarinu kao plaćenu	POST /evidence/membership/:memberId	✅ COACH
Bulk kreiranje uplata	POST /evidence/membership/create-bulk	✅ COACH
Pregledaj medicinsku evidenciju	GET /evidence/medical	✅ COACH
Ažuriraj medicinske informacije	POST /evidence/medical/:memberId	✅ COACH
Izvor: 
evidenceRoutes.ts

💰 Plaćanja (Payments)
Akcija	Ruta	Pristup
Kreiraj plaćanje	POST /payments	✅ COACH
Pregledaj plaćanja kluba	GET /payments/club	✅ COACH
Pregledaj plaćanja člana	GET /payments/member/:memberId	✅ svi
Označi plaćanje kao plaćeno	PATCH /payments/:id/paid	✅ COACH
Resetuj plaćanje	PATCH /payments/:id/reset	✅ COACH
Obriši plaćanje	DELETE /payments/:id	✅ COACH
Izvor: 
paymentRoutes.ts

📰 Objave (Posts)
Akcija	Ruta	Pristup
Kreiraj post	POST /posts	✅ COACH
Pregledaj postove	GET /posts	✅ svi
Ažuriraj post	PUT /posts/:id	✅ (ako je autor)
Obriši post	DELETE /posts/:id	✅ (ako je autor)
Komentariši	POST /posts/:postId/comments	✅ svi
Lajkuj	POST /posts/like	✅ svi
Izvor: 
postRoutes.ts

🏥 Medicinski pregledi
Akcija	Ruta	Pristup
Kreiraj/uploaduj pregled	POST /medical-checks	✅ COACH
Pregledaj preglede člana	GET /medical-checks/member/:memberId	✅ COACH
Pregledaj uskoro istekle	GET /medical-checks/expiring	✅ COACH
Izvor: 
medicalCheckRoutes.ts

🔔 Podsetnici (Reminders)
Akcija	Ruta	Pristup
Pošalji podsetnik za uplatu (član)	POST /reminders/payment/member/:memberId	✅ COACH
Pošalji podsetnik za uplatu (grupa)	POST /reminders/payment/group/:groupId	✅ COACH
Pošalji podsetnik za uplatu (svi)	POST /reminders/payment/all	✅ COACH
Pošalji podsetnik za medicinski (član)	POST /reminders/medical/member/:memberId	✅ COACH
Pošalji podsetnik za medicinski (grupa)	POST /reminders/medical/group/:groupId	✅ COACH
Pošalji podsetnik za medicinski (svi)	POST /reminders/medical/all	✅ COACH
Status podsetnika (grupa)	GET /reminders/status/group/:groupId	✅ COACH
Status podsetnika (član)	GET /reminders/status/member/:memberId	✅ COACH
Izvor: 
reminderRoutes.ts

💬 Chat
Akcija	Ruta	Pristup
Kreiraj/preuzmi konverzaciju	POST /chat/conversations	✅ svi
Pregledaj konverzacije	GET /chat/conversations	✅ svi
Pošalji poruku	POST /chat/conversations/:id/messages	✅ svi
Označi pročitano	POST /chat/conversations/:id/read	✅ svi
Pregledaj korisnike za chat	GET /chat/users	✅ svi
Izvor: 
chatRoutes.ts

⚙️ Podešavanja
Akcija	Ruta	Pristup
Pregledaj podešavanja kluba	GET /settings/club	✅ COACH
Ažuriraj podešavanja kluba	PUT /settings/club	❌ samo OWNER
Pregledaj profil	GET /settings/profile	✅ svi
Ažuriraj profil	PUT /settings/profile	✅ svi
Pregledaj pretplatu	GET /settings/subscription	✅ COACH
Izvor: 
settingsRoutes.ts

5. Šta Trener NE MOŽE da radi
Akcija	Ograničenje
Obriši grupu	Samo OWNER
Deaktiviraj invite kod	Samo OWNER
Ažuriraj podešavanja kluba	Samo OWNER
Pristupi dashboard-u (web-admin)	Dashboard je samo za OWNER
Pristupi finansijama kluba (web-admin)	Finansije su samo za OWNER
Upravljaj ugovorima trenera	Samo OWNER (web-admin)
6. Mobilna Aplikacija — Coach sekcija
Trener ima 43+ ekrana u mobilnoj aplikaciji, organizovanih u 
(coach)
 folder layout:

mobile-app/app/(coach)/
├── _layout.tsx              # Navigacija
├── index.tsx               # Home/Dashboard
├── calendar.tsx            # Kalendar treninga
├── profile.tsx             # Profil trenera
├── club.tsx                # Info o klubu
├── notifications.tsx       # Notifikacije
├── attendance/             # Prisustvo
│   ├── [id].tsx           # Detalji prisustva
│   └── manual-add.tsx     # Ručno dodavanje
├── events/                 # Događaji
│   ├── [id].tsx           # Detalji događaja
│   ├── create.tsx         # Kreiranje
│   ├── edit.tsx           # Editovanje
│   ├── qr.tsx             # QR skener
│   └── rsvp.tsx           # RSVP pregled
├── evidence/               # Evidencija
│   └── index.tsx          # Članarine + medicinski
├── groups/                 # Grupe
│   ├── [id].tsx           # Detalji grupe
│   ├── form.tsx           # Kreiranje/editovanje
│   └── index.tsx          # Lista
├── invites/                # Invite kodovi
│   └── index.tsx          # Generisanje kodova
├── members/                # Članovi
│   ├── [id].tsx           # Profil člana
│   ├── add.tsx            # Dodavanje
│   ├── edit.tsx           # Editovanje
│   └── index.tsx          # Lista
├── medical/                # Medicinski pregledi
│   └── record.tsx         # Unos pregleda
├── news/                   # Objave
│   ├── [id].tsx           # Detalji
│   ├── create.tsx         # Kreiranje
│   ├── edit.tsx           # Editovanje
│   └── index.tsx          # Feed
├── payments/               # Plaćanja
│   └── record.tsx         # Evidencija uplate
├── chat/                   # Poruke
│   ├── [id].tsx           # Konverzacija
│   ├── index.tsx          # Lista konverzacija
│   └── new.tsx            # Nova konverzacija
└── users/                  # Korisnici
    └── [id].tsx           # Profil korisnika
7. Web-Admin — Kako se trener prikazuje
U 
ClubMembersPage.tsx
, OWNER vidi trenere u levoj koloni sa:

Profilna slika (avatar)
Puno ime
Email
Grupe kojima pripadaju (prikazane kao obojeni krugovi)
Status ugovora (da li je istekao contractExpiryDate)
Mogućnost brisanja trenera
API endpointi za pregled trenera (
coachController.ts
):

GET /api/v1/coaches — Lista svih trenera u klubu
GET /api/v1/coaches/:id — Detalji jednog trenera
Vraćena polja: fullName, email, phoneNumber, profileImage, clubId, createdAt

8. Odnos Trener ↔ Grupa
Jedan trener može biti dodeljen više grupa. Jedna grupa može imati više trenera.

Primer iz seed podataka:

Grupa	Treneri
Pioniri (U-12)	Marko Nikolić
Kadeti (U-15)	Stefan Jovanović
Juniori (U-18)	Marko Nikolić + Milan Petrović
Seniori (18+)	Milan Petrović
Veza je M:N — čuva se u Group modelu kao coaches: [ObjectId].

9. Rezime — Ključne Činjenice
COACH je User sa role: 'COACH' — ne postoji poseban model za trenera
Beleži se: email, ime, telefon, profilna slika, clubId, pushToken, Firebase UID
Hijerarhija: Nivo 2 (između OWNER=3 i PARENT/MEMBER=1)
Ima skoro iste dozvole kao OWNER, osim: brisanja grupa, deaktivacije kodova, podešavanja kluba i pristupa web-admin dashboardu
Koristi mobilnu aplikaciju — 43+ ekrana za sve operacije
Pridružuje se klubu putem invite koda (type: 'COACH')
Dodeljen je grupama — može biti u više grupa istovremeno
Kreira događaje, oznacava prisustvo, evidentira uplate, šalje podsetnike, objavljuje vesti, komunicira putem chat-a
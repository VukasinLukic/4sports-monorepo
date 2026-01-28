# 4Sports Mobile App - Plan Implementacije Ispravki

**Datum kreiranja:** 27. Januar 2026.
**Poslednje ažuriranje:** 28. Januar 2026.
**Verzija:** 1.1
**Autor:** Claude Code Assistant
**Status:** Faza 1 kompletirana, spreman za Fazu 2

---

## Pregled Problema

Ovaj dokument sadrži detaljan plan za ispravku svih identifikovanih problema u mobilnoj aplikaciji 4Sports. Problemi su grupisani po funkcionalnostima i prioritetima.

### Identifikovani Problemi

#### Coach Perspektiva:
1. ❌ **Invite crash** - Push notifications error pri invitovanju
2. ❌ **Grupe** - Nedostaje kompletan sistem za upravljanje grupama
3. ❌ **Evidencija** - Pogrešno vodi na kalendar umesto na evidenciju članarina/medicinskih
4. ❌ **Kalendar** - Nedostaje filter po grupi i advanced opcije za pravljenje dogadjaja
5. ❌ **Profil člana** - Nedostaju detaljni prikazi (membership, attendance)
6. ❌ **Profil trenera** - Ne prikazuje podatke sa registracije
7. ❌ **Invite lokacija** - Treba premestiti iz settings u groups/members
8. ❌ **Home screen dogadjaji** - Nedostaju overview, participants, QR kod

#### Parent/Member Perspektiva:
1. ❌ **News feed** - Nedostaje mogućnost komentarisanja
2. ❌ **Home screen** - Nedostaje potvrda prisustva
3. ❌ **Kalendar** - Treba da može da vidi i potvrdi prisustvo
4. ❌ **Istorija plaćanja** - Ne postoji
5. ❌ **Istorija prisustva** - Ne postoji
6. ❌ **Profil** - Potrebna dorada

#### Sistemski Problemi:
1. ❌ **Registracija logika** - Coach može da pristupi web verziji (samo owner bi trebalo)
2. ❌ **InviteCode** - Ne sadrži groupId za automatsko dodavanje u grupu
3. ❌ **Push notifications** - Ne radi u Expo Go (očekivano, radi u dev build)
4. ❌ **Lokalizacija** - Aplikacija treba da bude na srpskom i engleskom

---

## Faze Implementacije

### FAZA 0: Priprema i Dokumentacija (Pre-implementacija) ✅ KOMPLETIRANA
**Status:** ZAVRŠENO
**Cilj:** Dokumentovati sve modele, API rute i očekivane request/response formate

#### 0.1 Kreiranje dokumentacije modela ✅
- [x] Kreirati `docs/MODELS.md` sa svim entitetima i atributima
- [x] Dokumentovati relacije izmedju modela
- [x] Definisati koje atribute treba dodati/izmeniti

#### 0.2 Kreiranje dokumentacije API ruta ✅
- [x] Kreirati `docs/API_ROUTES.md` sa svim rutama
- [x] Dokumentovati request body za svaku rutu
- [x] Dokumentovati response format za svaku rutu

#### 0.3 Analiza Figma dizajna ✅
- [x] Izvući sve UI elemente iz Figma framova → `docs/FIGMA_DESIGNS.md`
- [x] Mapirati UI elemente na backend modele
- [x] Identifikovati nedostajuće atribute

**Deliverables:**
- ✅ `docs/MODELS.md` - Kompletna dokumentacija svih modela sa TODO oznakama
- ✅ `docs/API_ROUTES.md` - Kompletna dokumentacija svih API ruta sa TODO oznakama
- ✅ `docs/FIGMA_DESIGNS.md` - Opisi svih Figma framova (kreirao korisnik)

---

### FAZA 1: Backend - Ažuriranje Modela i InviteCode Logike ✅ KOMPLETIRANA
**Zavisnosti:** Faza 0
**Status:** ZAVRŠENO
**Cilj:** Ažurirati backend modele i invite sistem za podršku grupa

#### 1.1 Ažuriranje InviteCode modela ✅
**Fajl:** `backend/src/models/InviteCode.ts`

Dodati atribute:
```typescript
groupId: ObjectId (optional, ref: Group) // Za MEMBER invite - automatski dodaje u grupu
clubName: String (virtual/populated) // Za prikaz pri registraciji
clubLogo: String (virtual/populated) // Za prikaz pri registraciji
```

**Izmene:**
- [x] Dodati `groupId` polje u InviteCode model
- [x] Ažurirati `generateCode` metodu da prima `groupId`
- [x] Ažurirati validaciju da proveri da li grupa pripada klubu

#### 1.2 Ažuriranje InviteController ✅
**Fajl:** `backend/src/controllers/inviteController.ts`

**Izmene:**
- [x] Dodati `groupId` u `generateInviteCode` request
- [x] Kreirati novu rutu `GET /api/v1/invites/validate/:code` - vraća info o klubu/grupi za prikaz pri registraciji
- [x] Ažurirati response da uključi club name, logo, role, group name

#### 1.3 Ažuriranje AuthController - Register ✅
**Fajl:** `backend/src/controllers/authController.ts`

**Izmene:**
- [x] Role se izvlači iz invite code tipa (COACH type → COACH role, MEMBER type → PARENT role)
- [x] Vratiti groupId i clubName u response

#### 1.4 Ažuriranje User modela ✅
**Fajl:** `backend/src/models/User.ts`

Provereno da sadrži:
```typescript
fullName: String (required) ✅
phoneNumber: String (optional) ✅
profileImage: String (optional) ✅
```

**Testiranje Faze 1:**
- [ ] Test: Generisanje invite koda sa groupId
- [ ] Test: Validacija invite koda vraća club/group info
- [ ] Test: Registracija koristi role iz invite koda

---

### FAZA 2: Backend - Groups API Kompletiranje
**Zavisnosti:** Faza 1
**Cilj:** Kompletirati API za upravljanje grupama

#### 2.1 Pregled postojećeg GroupController
**Fajl:** `backend/src/controllers/groupController.ts`

Potrebne rute:
- [ ] `GET /api/v1/groups` - Lista svih grupa u klubu
- [ ] `GET /api/v1/groups/:id` - Detalji grupe sa članovima
- [ ] `POST /api/v1/groups` - Kreiranje nove grupe
- [ ] `PUT /api/v1/groups/:id` - Ažuriranje grupe
- [ ] `DELETE /api/v1/groups/:id` - Brisanje grupe
- [ ] `POST /api/v1/groups/:id/members` - Dodavanje člana u grupu
- [ ] `DELETE /api/v1/groups/:id/members/:memberId` - Uklanjanje člana iz grupe

#### 2.2 Ažuriranje Group modela ako potrebno
**Fajl:** `backend/src/models/Group.ts`

Proveriti atribute:
```typescript
clubId: ObjectId (required)
name: String (required)
ageGroup: String (optional) - "U10", "U12", etc.
sport: String (optional)
description: String (optional)
coaches: [ObjectId] (ref: User)
isActive: Boolean
```

**Testiranje Faze 2:**
- [ ] Test: CRUD operacije za grupe
- [ ] Test: Dodavanje/uklanjanje članova iz grupe

---

### FAZA 3: Backend - Events API Proširenje
**Zavisnosti:** Faza 2
**Cilj:** Proširiti Event API za podršku advanced opcija i QR check-in

#### 3.1 Ažuriranje Event modela
**Fajl:** `backend/src/models/Event.ts`

Dodati/proveriti atribute:
```typescript
// Basic info
title: String
type: 'TRAINING' | 'MATCH' | 'OTHER'
startTime: Date
endTime: Date
location: String
groupId: ObjectId

// Advanced info (optional)
notes: String
equipment: [String] // Lista potrebne opreme
maxParticipants: Number
isRecurring: Boolean
recurringPattern: Object // { frequency: 'weekly', days: [1,3,5], until: Date }

// QR Check-in
qrCode: String (unique) // Auto-generated UUID za svaki event
```

#### 3.2 Ažuriranje EventController
**Fajl:** `backend/src/controllers/eventController.ts`

Nove/ažurirane rute:
- [ ] `GET /api/v1/events` - Lista dogadjaja sa filterom po grupi
- [ ] `GET /api/v1/events/:id` - Detalji sa participants
- [ ] `POST /api/v1/events` - Kreiranje sa advanced opcijama
- [ ] `POST /api/v1/events/:id/checkin` - QR code check-in za člana
- [ ] `POST /api/v1/events/:id/confirm` - Potvrda dolaska (RSVP)
- [ ] `GET /api/v1/events/:id/participants` - Lista učesnika sa statusom

#### 3.3 Ažuriranje Attendance modela
**Fajl:** `backend/src/models/Attendance.ts`

Dodati atribute:
```typescript
rsvpStatus: 'CONFIRMED' | 'DECLINED' | 'PENDING' // Pre-event potvrda
checkinTime: Date // Vreme QR check-in-a
checkinMethod: 'QR' | 'MANUAL' // Način evidencije
```

**Testiranje Faze 3:**
- [ ] Test: Kreiranje eventa sa advanced opcijama
- [ ] Test: QR check-in endpoint
- [ ] Test: RSVP potvrda dolaska
- [ ] Test: Filter dogadjaja po grupi

---

### FAZA 4: Backend - Evidencija (Članarina/Medicinski)
**Zavisnosti:** Faza 2
**Cilj:** Kreirati API za evidenciju članarina i medicinskih pregleda

#### 4.1 Ažuriranje Payment modela
**Fajl:** `backend/src/models/Payment.ts`

Proveriti atribute za članarinu:
```typescript
memberId: ObjectId
clubId: ObjectId
type: 'MEMBERSHIP' | 'EVENT' | 'EQUIPMENT' | 'OTHER'
amount: Number
dueDate: Date
paidDate: Date (optional)
status: 'PENDING' | 'PAID' | 'OVERDUE'
period: { month: Number, year: Number } // Za mesečnu članarinu
```

#### 4.2 Kreiranje Evidencija Endpointa
**Fajl:** `backend/src/controllers/evidenceController.ts` (novi)

Rute:
- [ ] `GET /api/v1/evidence/membership` - Lista članova sa statusom članarine po grupi
- [ ] `GET /api/v1/evidence/medical` - Lista članova sa statusom medicinskog po grupi
- [ ] `POST /api/v1/evidence/membership/:memberId` - Označi članarinu kao plaćenu
- [ ] `POST /api/v1/evidence/medical/:memberId` - Označi medicinski kao ažuriran
- [ ] `POST /api/v1/evidence/notify` - Pošalji podsetnik članovima

#### 4.3 Kreiranje ruta
**Fajl:** `backend/src/routes/evidenceRoutes.ts` (novi)

**Testiranje Faze 4:**
- [ ] Test: Dohvatanje liste članova sa statusom članarine
- [ ] Test: Dohvatanje liste članova sa statusom medicinskog
- [ ] Test: Označavanje članarine kao plaćene
- [ ] Test: Slanje podsetnika

---

### FAZA 5: Mobile - Registracija Flow Prepravka
**Zavisnosti:** Faza 1
**Cilj:** Implementirati novi registration flow po Figma dizajnu

#### 5.1 Novi početni screen
**Fajl:** `mobile-app/app/(auth)/index.tsx` (izmena)

UI elementi:
- [ ] Polje za invite kod
- [ ] Dugme "Insert"
- [ ] Link "Already have an account?" → Login

#### 5.2 Ažuriranje register screena
**Fajl:** `mobile-app/app/(auth)/register.tsx` (izmena)

UI elementi:
- [ ] Prikaz imena i loga kluba (iz invite validation)
- [ ] Prikaz predodredjene uloge
- [ ] Forma za podatke: fullName, email, phone, password
- [ ] Ukloniti role selection (dolazi iz invite koda)

#### 5.3 Kreiranje servisa za invite validation
**Fajl:** `mobile-app/services/inviteService.ts` (novi)

Funkcije:
- [ ] `validateInviteCode(code)` - Vraća club info, role, group

#### 5.4 Ažuriranje AuthContext
**Fajl:** `mobile-app/services/AuthContext.tsx`

- [ ] Ažurirati register funkciju da koristi novi flow

**Testiranje Faze 5:**
- [ ] Test: Unos invite koda prikazuje info o klubu
- [ ] Test: Registracija kreira korisnika u ispravnoj grupi
- [ ] Test: Navigacija nakon registracije vodi na ispravan dashboard

---

### FAZA 6: Mobile - Coach Groups Modul
**Zavisnosti:** Faza 2, Faza 5
**Cilj:** Implementirati kompletan groups modul za trenere

#### 6.1 Kreiranje Groups ekrana
**Folder:** `mobile-app/app/(coach)/groups/`

Fajlovi:
- [ ] `_layout.tsx` - Stack layout
- [ ] `index.tsx` - Lista grupa sa opcijom kreiranja nove
- [ ] `[id].tsx` - Detalji grupe sa listom članova
- [ ] `create.tsx` - Forma za kreiranje grupe
- [ ] `invite.tsx` - Generisanje invite koda za grupu

#### 6.2 UI komponente za grupe
**Fajlovi u `mobile-app/components/`:**

- [ ] `GroupCard.tsx` - Kartica grupe (ime, broj članova, treneri)
- [ ] `GroupMemberList.tsx` - Lista članova u grupi

#### 6.3 Hooks za grupe
**Fajl:** `mobile-app/hooks/useGroups.ts`

- [ ] `useGroups()` - Lista svih grupa
- [ ] `useGroup(id)` - Detalji jedne grupe
- [ ] `useCreateGroup()` - Kreiranje grupe
- [ ] `useUpdateGroup()` - Ažuriranje grupe
- [ ] `useDeleteGroup()` - Brisanje grupe
- [ ] `useGenerateInvite()` - Generisanje invite koda

#### 6.4 Ažuriranje Tab navigacije
**Fajl:** `mobile-app/app/(coach)/_layout.tsx`

- [ ] Dodati Groups tab ili pristup iz Members

**Testiranje Faze 6:**
- [ ] Test: Lista grupa se prikazuje
- [ ] Test: Kreiranje nove grupe
- [ ] Test: Pregled članova u grupi
- [ ] Test: Generisanje invite koda

---

### FAZA 7: Mobile - Coach Evidencija Modul
**Zavisnosti:** Faza 4
**Cilj:** Implementirati evidenciju članarina i medicinskih pregleda

#### 7.1 Kreiranje Evidence ekrana
**Folder:** `mobile-app/app/(coach)/evidence/`

Fajlovi:
- [ ] `_layout.tsx` - Stack layout
- [ ] `index.tsx` - Tab view: Membership | Medical
- [ ] `membership.tsx` - Lista članova sa statusom članarine
- [ ] `medical.tsx` - Lista članova sa statusom medicinskog

#### 7.2 UI komponente
**Fajlovi u `mobile-app/components/`:**

- [ ] `EvidenceList.tsx` - Lista sa checkbox-ovima
- [ ] `EvidenceItem.tsx` - Red sa članom i statusom
- [ ] `GroupFilter.tsx` - Dropdown za izbor grupe

#### 7.3 Hooks za evidenciju
**Fajl:** `mobile-app/hooks/useEvidence.ts`

- [ ] `useMembershipEvidence(groupId)` - Lista sa statusom članarine
- [ ] `useMedicalEvidence(groupId)` - Lista sa statusom medicinskog
- [ ] `useMarkMembershipPaid()` - Označi kao plaćeno
- [ ] `useMarkMedicalUpdated()` - Označi kao ažurirano
- [ ] `useSendReminder()` - Pošalji podsetnik

#### 7.4 Ažuriranje navigacije
- [ ] Zameniti "Attendance" sa "Evidence" u quick actions na home
- [ ] Ažurirati ikonu i labelu

**Testiranje Faze 7:**
- [ ] Test: Prikaz liste članova sa statusom
- [ ] Test: Filter po grupi
- [ ] Test: Označavanje članarine kao plaćene
- [ ] Test: Slanje podsetnika

---

### FAZA 8: Mobile - Coach Calendar Proširenje
**Zavisnosti:** Faza 3, Faza 6
**Cilj:** Proširiti kalendar sa filterom po grupi i advanced event kreiranje

#### 8.1 Ažuriranje Calendar ekrana
**Fajl:** `mobile-app/app/(coach)/calendar.tsx`

Izmene:
- [ ] Dodati group filter dropdown iznad kalendara
- [ ] Prikazati samo dogadjaje za izabranu grupu

#### 8.2 Kreiranje/ažuriranje Event kreiranje
**Fajl:** `mobile-app/app/(coach)/events/create.tsx`

UI elementi - Basic:
- [ ] Title input
- [ ] Type picker (Training/Match/Other)
- [ ] Date/Time picker (start, end)
- [ ] Location input
- [ ] Group picker

UI elementi - Advanced (collapsible):
- [ ] Notes textarea
- [ ] Equipment list
- [ ] Max participants
- [ ] Recurring toggle + pattern

#### 8.3 Kreiranje Event Detail ekran
**Fajl:** `mobile-app/app/(coach)/events/[id].tsx`

Tab view:
- [ ] **Overview tab:** Sve info o dogadjaju + QR kod dugme
- [ ] **Participants tab:** Lista učesnika sa statusom (confirmed/declined/pending/present)

#### 8.4 QR Kod komponenta
**Fajl:** `mobile-app/components/EventQRCode.tsx`

- [ ] Modal sa QR kodom za event
- [ ] Dugme za share/download

**Testiranje Faze 8:**
- [ ] Test: Filter kalendara po grupi
- [ ] Test: Kreiranje eventa sa basic i advanced opcijama
- [ ] Test: Prikaz event details sa overview i participants
- [ ] Test: Generisanje i prikaz QR koda

---

### FAZA 9: Mobile - Coach Member Profile Proširenje
**Zavisnosti:** Faza 3, Faza 4
**Cilj:** Proširiti profil člana sa membership i attendance detaljima

#### 9.1 Ažuriranje Member Detail ekrana
**Fajl:** `mobile-app/app/(coach)/members/[id].tsx`

Dodati tabove:
- [ ] **Profile tab:** Osnovne info (postojeći sadržaj)
- [ ] **Membership tab:** Istorija plaćanja članarine
- [ ] **Attendance tab:** Istorija prisustva

#### 9.2 Kreiranje Membership komponente
**Fajl:** `mobile-app/components/MembershipHistory.tsx`

- [ ] Lista plaćanja sa datumom, iznosom, statusom
- [ ] Summary: total paid, pending, overdue

#### 9.3 Kreiranje Attendance komponente
**Fajl:** `mobile-app/components/AttendanceHistory.tsx`

- [ ] Lista dogadjaja sa statusom prisustva
- [ ] Summary: attendance rate, total present/absent

#### 9.4 Hooks za member details
**Fajl:** `mobile-app/hooks/useMembers.ts` (update)

Dodati:
- [ ] `useMemberMembership(memberId)` - Istorija plaćanja
- [ ] `useMemberAttendance(memberId)` - Istorija prisustva

**Testiranje Faze 9:**
- [ ] Test: Prikaz profila člana sa tabovima
- [ ] Test: Membership tab prikazuje istoriju plaćanja
- [ ] Test: Attendance tab prikazuje istoriju prisustva

---

### FAZA 10: Mobile - Coach Home Screen Proširenje
**Zavisnosti:** Faza 3, Faza 8
**Cilj:** Proširiti home screen sa upcoming events i quick access

#### 10.1 Ažuriranje Home ekrana
**Fajl:** `mobile-app/app/(coach)/index.tsx`

Dodati sekcije:
- [ ] **Upcoming Events:** Lista sa confirmed/pending count
- [ ] Klik na event → Event detail screen

#### 10.2 Ažuriranje PostCard za home
- [ ] Prikazati ko je potvrdio dolazak ispod eventa

**Testiranje Faze 10:**
- [ ] Test: Prikaz upcoming events
- [ ] Test: Klik vodi na event detail
- [ ] Test: Prikazan broj potvrdjenih

---

### FAZA 11: Mobile - Coach Profile Fix
**Zavisnosti:** Faza 1
**Cilj:** Prikazati sve podatke sa registracije u coach profilu

#### 11.1 Ažuriranje Profile ekrana
**Fajl:** `mobile-app/app/(coach)/profile.tsx`

Prikazati:
- [ ] Profile image (ili placeholder)
- [ ] Full name
- [ ] Email
- [ ] Phone number
- [ ] Role
- [ ] Club name
- [ ] Edit dugme

#### 11.2 Kreiranje/ažuriranje Edit Profile
**Fajl:** `mobile-app/app/profile/edit.tsx`

Form:
- [ ] Profile image picker
- [ ] Full name
- [ ] Phone number
- [ ] (Email read-only)

**Testiranje Faze 11:**
- [ ] Test: Profil prikazuje sve podatke
- [ ] Test: Edit profil radi ispravno

---

### FAZA 12: Mobile - Parent Dashboard Kompletiranje
**Zavisnosti:** Faza 3
**Cilj:** Kompletirati parent dashboard sa svim funkcionalnostima

#### 12.1 Ažuriranje Parent Home
**Fajl:** `mobile-app/app/(parent)/index.tsx`

Dodati:
- [ ] **Next Event sekcija** sa dugmetom za potvrdu prisustva
- [ ] QR kod dugme za check-in

#### 12.2 Kreiranje Payment History ekran
**Fajl:** `mobile-app/app/(parent)/payments.tsx`

- [ ] Lista svih plaćanja
- [ ] Filter: All/Paid/Pending/Overdue
- [ ] Summary na vrhu

#### 12.3 Kreiranje Attendance History ekran
**Fajl:** `mobile-app/app/(parent)/attendance.tsx`

- [ ] Lista svih dogadjaja sa statusom
- [ ] Attendance rate

#### 12.4 Ažuriranje Parent Calendar
**Fajl:** `mobile-app/app/(parent)/calendar.tsx`

- [ ] Prikazati dogadjaje
- [ ] Klik na event → Detail sa opcijom potvrde prisustva

#### 12.5 Ažuriranje Parent News
**Fajl:** `mobile-app/app/(parent)/news/index.tsx`

- [ ] Dodati mogućnost komentarisanja postova

#### 12.6 Ažuriranje Tab navigacije
**Fajl:** `mobile-app/app/(parent)/_layout.tsx`

Dodati tabove:
- [ ] Payments
- [ ] Attendance (ili spojiti sa Calendar)

**Testiranje Faze 12:**
- [ ] Test: Home prikazuje sledeći event
- [ ] Test: Potvrda prisustva radi
- [ ] Test: Payment history prikazuje sve plaćanja
- [ ] Test: Attendance history prikazuje istoriju
- [ ] Test: Komentarisanje postova radi

---

### FAZA 13: Mobile - Parent Profile
**Zavisnosti:** Faza 11
**Cilj:** Implementirati parent profil po Figma dizajnu

#### 13.1 Ažuriranje Parent Profile
**Fajl:** `mobile-app/app/(parent)/profile.tsx`

Prikazati:
- [ ] Profile image
- [ ] Full name
- [ ] Email
- [ ] Phone number
- [ ] Children section sa listom
- [ ] Club info
- [ ] Edit dugme

**Testiranje Faze 13:**
- [ ] Test: Profil prikazuje sve podatke
- [ ] Test: Lista dece je ispravna

---

### FAZA 14: Mobile - QR Check-in Sistem
**Zavisnosti:** Faza 3, Faza 8
**Cilj:** Implementirati QR check-in za prisustvo

#### 14.1 Ažuriranje QR Scanner
**Fajl:** `mobile-app/app/(parent)/scan.tsx`

- [ ] Skeniranje QR koda eventa
- [ ] Slanje check-in requesta na backend
- [ ] Prikaz potvrde

#### 14.2 Backend endpoint
**Već pokriveno u Fazi 3**

**Testiranje Faze 14:**
- [ ] Test: Skeniranje QR koda
- [ ] Test: Check-in se registruje na backendu
- [ ] Test: Trener vidi check-in u participants

---

### FAZA 15: Push Notifications Fix
**Zavisnosti:** Nema
**Cilj:** Ispraviti push notifications za production build

#### 15.1 Ažuriranje Push Notifications servisa
**Fajl:** `mobile-app/services/pushNotifications.ts`

Izmene:
- [ ] Dodati proveru da li je development build
- [ ] Graceful handling za Expo Go
- [ ] Ispraviti projectId u app.json

#### 15.2 Ažuriranje app.json
**Fajl:** `mobile-app/app.json`

- [ ] Postaviti ispravan `projectId` u extra.eas

#### 15.3 Ažuriranje usePushNotifications hook
**Fajl:** `mobile-app/hooks/usePushNotifications.ts`

- [ ] Graceful error handling
- [ ] Skip registration u Expo Go

**Testiranje Faze 15:**
- [ ] Test: App ne crashuje u Expo Go
- [ ] Test: Push notifications rade u dev build

---

### FAZA 16: Access Control - Web vs Mobile
**Zavisnosti:** Nema
**Cilj:** Ispraviti logiku pristupa - Coach samo mobile, Owner web + mobile

#### 16.1 Backend middleware
**Fajl:** `backend/src/middleware/authMiddleware.ts`

Opcije:
- [ ] Dodati `platform` header check
- [ ] Ili: Web admin samo za OWNER role

#### 16.2 Web Admin login
**Fajl:** `web-admin/src/features/auth/`

- [ ] Dodati proveru da li je korisnik OWNER
- [ ] Redirect COACH na error stranicu

**Testiranje Faze 16:**
- [ ] Test: COACH ne može da se uloguje na web admin
- [ ] Test: OWNER može na oba

---

### FAZA 17: Lokalizacija (i18n)
**Zavisnosti:** Sve prethodne faze
**Cilj:** Dodati podršku za srpski i engleski jezik

#### 17.1 Setup i18n biblioteke
**Fajlovi:**
- [ ] Instalirati `i18next` i `react-i18next`
- [ ] Kreirati `mobile-app/locales/` folder
- [ ] `mobile-app/locales/en.json`
- [ ] `mobile-app/locales/sr.json`

#### 17.2 Kreiranje translation fajlova
Struktura:
```json
{
  "common": {
    "save": "Save" / "Sačuvaj",
    "cancel": "Cancel" / "Otkaži",
    ...
  },
  "auth": {
    "login": "Login" / "Prijava",
    ...
  },
  "coach": { ... },
  "parent": { ... }
}
```

#### 17.3 Implementacija u komponentama
- [ ] Kreirati `useTranslation` hook wrapper
- [ ] Zameniti hardcoded stringove sa t() funkcijom
- [ ] Dodati language picker u Settings

#### 17.4 Persistiranje izbora jezika
- [ ] Sačuvati u AsyncStorage
- [ ] Učitati pri pokretanju

**Testiranje Faze 17:**
- [ ] Test: App radi na engleskom
- [ ] Test: Promena na srpski menja sve stringove
- [ ] Test: Izbor jezika se čuva

---

### FAZA 18: Testiranje i Bug Fixes
**Zavisnosti:** Sve prethodne faze
**Cilj:** Kompletno testiranje aplikacije

#### 18.1 Functional Testing
- [ ] Test svih coach funkcionalnosti
- [ ] Test svih parent funkcionalnosti
- [ ] Test auth flow

#### 18.2 Integration Testing
- [ ] Test frontend-backend integracije
- [ ] Test offline funkcionalnosti
- [ ] Test push notifications (dev build)

#### 18.3 Bug Fixes
- [ ] Ispraviti sve identifikovane bugove
- [ ] Performance optimizacije

---

### FAZA 19: Production Build i Deployment
**Zavisnosti:** Faza 18
**Cilj:** Napraviti production build

#### 19.1 Priprema
- [ ] Ažurirati verziju u app.json
- [ ] Proveriti sve environment varijable
- [ ] Proveriti eas.json konfiguraciju

#### 19.2 Build
- [ ] EAS preview build za testiranje
- [ ] EAS production build

#### 19.3 Testiranje production builda
- [ ] Test na Android uređaju
- [ ] Test na iOS uređaju (ako dostupno)

---

## Prioriteti i Preporuke

### High Priority (Kritično za funkcionalnost):
1. **Faza 1-2:** Backend modeli i Groups API
2. **Faza 5-6:** Registracija flow i Groups modul
3. **Faza 7:** Evidencija (članarina/medicinski)
4. **Faza 15:** Push notifications fix

### Medium Priority (Poboljšanje UX):
5. **Faza 8-10:** Calendar i Home screen proširenja
6. **Faza 11-13:** Profile screens
7. **Faza 12:** Parent dashboard
8. **Faza 14:** QR Check-in

### Low Priority (Može kasnije):
9. **Faza 16:** Access control
10. **Faza 17:** Lokalizacija

### Preporuka za lokalizaciju:
Lokalizaciju (Faza 17) preporučujem ostaviti za kraj jer:
1. Zahteva promenu svih komponenti
2. Lakše je kada je UI stabilan
3. Može se raditi inkrementalno

---

## Estimacija Kompleksnosti

| Faza | Kompleksnost | Komponente za menjanje |
|------|-------------|----------------------|
| 0 | Niska | Dokumentacija |
| 1 | Srednja | 3 backend fajla |
| 2 | Srednja | 2 backend fajla |
| 3 | Visoka | 3 backend fajla |
| 4 | Srednja | 3 nova backend fajla |
| 5 | Srednja | 4 frontend fajla |
| 6 | Visoka | 6+ novih frontend fajlova |
| 7 | Visoka | 5+ novih frontend fajlova |
| 8 | Visoka | 4 frontend fajla |
| 9 | Srednja | 3 frontend fajla |
| 10 | Niska | 1 frontend fajl |
| 11 | Niska | 2 frontend fajla |
| 12 | Visoka | 6 frontend fajlova |
| 13 | Niska | 1 frontend fajl |
| 14 | Srednja | 2 fajla |
| 15 | Niska | 3 fajla |
| 16 | Niska | 2 fajla |
| 17 | Visoka | Svi frontend fajlovi |
| 18 | Srednja | Testiranje |
| 19 | Niska | Konfiguracija |

---

## Napomene

1. **Figma Dizajn:** Svi Figma framovi su dokumentovani u `docs/FIGMA_DESIGNS.md`. Za detalje svakog UI elementa pogledati taj fajl.

2. **Backend Kompatibilnost:** Svaka faza koja menja backend MORA da održi backward compatibility dok se frontend ne ažurira.

3. **Testiranje:** Svaka faza ima sekciju za testiranje. Preporučujem da se svaka faza testira pre prelaska na sledeću.

4. **Git Workflow:** Preporučujem da se svaka faza radi na posebnoj grani i merge-uje nakon testiranja.

5. **Referentna dokumentacija:**
   - `docs/MODELS.md` - Svi backend modeli sa atributima i TODO oznakama
   - `docs/API_ROUTES.md` - Sve API rute sa request/response formatima
   - `docs/FIGMA_DESIGNS.md` - Opisi UI dizajna za svaki ekran

---

## Sledeći Koraci

~~1. Pregledaj ovaj plan i daj feedback~~ ✅
~~2. Potvrditi prioritete~~ ✅
~~3. Početi sa Fazom 0 (dokumentacija)~~ ✅ ZAVRŠENO
~~4. **Faza 1:** Backend - Ažuriranje InviteCode modela i Auth kontrolera~~ ✅ ZAVRŠENO
   - ✅ Dodato `groupId` u InviteCode model
   - ✅ Kreiran `/validate/:code` public endpoint
   - ✅ Ažurirana registracija - role se izvlači iz invite code tipa
   - ✅ groupId je required za MEMBER invite type
   - ✅ Default maxUses promenjen na 30

**SLEDEĆE:**
5. **Faza 2:** Backend - Groups API Kompletiranje
   - Dodati `GET /api/v1/groups/:id/members` endpoint
   - Dodati `POST /api/v1/groups/:id/members` za dodavanje člana
   - Dodati `DELETE /api/v1/groups/:id/members/:memberId` za uklanjanje člana
   - Dodati `color` atribut u Group model

Da li želiš da nastavimo sa Fazom 2?

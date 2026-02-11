# 4SPORTS — IMPLEMENTATION PLAN ZA NEMANJU (BACKEND DEVELOPER)

**Tvoja Uloga:** Backend Developer
**Tvoja Odgovornost:** `backend/` folder i sve što se nalazi u njemu
**Estimated Timeline:** 8-10 nedelja (solo backend development)
**Status:** Ready to Execute

---

## 🎯 TVOJE ODGOVORNOSTI

### ✅ Šta Radiš TI:
- **Sav kod u `backend/` folderu**
- Node.js + Express API server
- MongoDB modeli i schema
- API endpoints (REST)
- Autentifikacija (Firebase Admin SDK)
- Middleware (auth, validation, error handling)
- Cron jobs (automatizacija)
- Backend deployment na Render
- Backend testiranje (Postman, unit tests)

### ❌ Šta NE Radiš TI:
- `web-admin/` folder - **To je Vukašinova odgovornost**
- `mobile-app/` folder - **To je Mihajlova odgovornost**
- Frontend komponente
- UI/UX dizajn
- Mobile app build

---

## 🚨 VAŽNA PRAVILA

### 1. GitHub Pravila

imamo sledece grane:
main, development, i nemanja, mihajlo, vukasin
#### Kako Radiš Sa Gitom:

**Početak Rada (Svaki Dan):**
```bash
# Idi u backend folder
cd backend

# Proveri da li si na main branch-u
git branch

# Povuci najnovije izmene
git pull origin main

git checkout -b development
# Napravi svoj branch
git checkout -b nemanja
```

**Tokom Rada:**
```bash
# Dodaj svoje izmene (SAMO iz backend foldera)
git add .

# Commit sa jasnom porukom
git commit -m "backend: add user authentication controller"

# Pushuj na GitHub
git push origin nemanja
```

**Kada Završiš Feature:**
1. Pushuj branch na GitHub
2. Otvori Pull Request (PR)
3. Dodaj Vukašina i Mihajla kao reviewers
4. **NE MERGE-uj sam** - sačekaj approval
5. Nakon approval, merge u main

#### Commit Message Format:
```bash
backend: kratak opis šta si uradio

Primeri:
- backend: add User and Club models
- backend: implement authentication middleware
- backend: create attendance QR scan endpoint
- backend: fix payment validation error
- backend: add cron job for monthly reset
```

---

### 2. ENV Fajlovi i Tajni Ključevi

#### ⚠️ NIKADA NE COMMIT-uj Ove Fajlove:
- `backend/.env`
- `backend/firebase-admin-key.json`
- Bilo koji fajl sa passwordima ili API ključevima

#### ✅ Kako Čuvaš ENV Fajlove:

**1. Lokalno (Tvoj Računar):**
```bash
# backend/.env - samo na tvom računaru, NIKAD na Git
```

**2. Google Drive (Za Tim):**
- Napravi folder: `4Sports - ENV Files`
- Upload fajlove:
  - `backend-env.txt` (sadržaj tvog .env fajla)
  - `firebase-admin-key.json`
- Podeli pristup sa Vukašinom i Mihajlom

**3. Render (Production):**
- Idi na Render Dashboard
- Web Service → Environment
- Dodaj svaki ENV variable ručno (copy-paste iz .env)

#### ENV Fajl Struktura:
Tvoj `backend/.env` treba da sadrži:
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
JWT_SECRET=...
RESEND_API_KEY=...
WEB_ADMIN_URL=http://localhost:5173
MOBILE_APP_URL=exp://localhost:19000
```

**Kada Dodaš Novi ENV Variable:**
1. Dodaj ga u svoj lokalni `.env`
2. Ažuriraj `backend/.env.example` (bez prave vrednosti)
3. Ažuriraj fajl na Google Drive
4. Obavesti Vukašina i Mihajla u Slack/Discord
5. Dodaj na Render (kada deploy-uješ)

---

### 3. Claude Agent Pravila

#### ✅ Claude Sme Da Ti Menja Kod U:
- `backend/src/` i sve podfoldere
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/.env.example` (template, ne pravi .env!)
- `backend/README.md` (ako praviš dokumentaciju)

#### ❌ Claude NE SME Da Ti Menja Kod U:
- `web-admin/` - **Vukašinov folder**
- `mobile-app/` - **Mihajlov folder**
- `docs/` - Samo ako svi unapred dogovorite

#### Ako Nešto Ne Radi Van Backend-a:

**Primer 1: Web admin ne može da se conectuje na API**
- **NE MENJAJ** kod u `web-admin/`
- Proveri da li je problem u tvojim API endpoints
- Ako je problem u frontend kodu → **Pozovi Vukašina**

**Primer 2: Mobile app ne dobija push notifications**
- Proveri da li tvoj backend šalje notifikacije ispravno
- Testiraj sa Postman-om
- Ako backend radi, a app ne prima → **Pozovi Mihajla**

**Pravilo:**
> Ako problem nije u `backend/` folderu, **ZAUSTAVI SE** i komuniciraj sa timom.

---

## 📋 FAZE RAZVOJA (BEZ KODA - SAMO ZADACI)

### PHASE 0: Pre-Development Setup (4-6 sati)

**Tvoji Eksterni Zadaci (Van IDE):**

#### 0.1 Firebase Admin SDK Setup
- [ ] Idi na https://console.firebase.google.com
- [ ] Odaberi projekat `4sports-mvp` (Vukašin/Mihajlo ga kreiraju)
- [ ] Idi na Project Settings → Service Accounts
- [ ] Klikni "Generate new private key"
- [ ] Download `firebase-admin-key.json`
- [ ] Sačuvaj fajl u `backend/` folder (lokalno)
- [ ] Upload na Google Drive u `4Sports - ENV Files`
- [ ] **NIKAD NE COMMIT-uj ovaj fajl na Git**

#### 0.2 MongoDB Atlas Setup
- [ ] Registruj se na https://cloud.mongodb.com
- [ ] Kreiraj organization: `4sports`
- [ ] Kreiraj projekat: `4sports-mvp`
- [ ] Klikni "Build a Database"
- [ ] Odaberi M0 Free tier
- [ ] Region: Frankfurt (eu-central-1) - najbliži Srbiji
- [ ] Cluster name: `4sports-cluster`
- [ ] Klikni "Create" i sačekaj 3-5 minuta

#### 0.3 MongoDB Database User
- [ ] Idi na "Database Access" (levo sidebar)
- [ ] Klikni "Add New Database User"
- [ ] Username: `4sports-admin`
- [ ] Password: Autogenerate i **sačuvaj negde**
- [ ] Privileges: "Read and write to any database"
- [ ] Klikni "Add User"

#### 0.4 MongoDB Network Access
- [ ] Idi na "Network Access"
- [ ] Klikni "Add IP Address"
- [ ] Za development: "Allow Access from Anywhere" (0.0.0.0/0)
- [ ] Description: `Development Access`
- [ ] Klikni "Confirm"
- [ ] **Napomena:** Za production, ograniči na Render IP

#### 0.5 MongoDB Connection String
- [ ] Idi na "Database" → Cluster → "Connect"
- [ ] Odaberi "Connect your application"
- [ ] Driver: Node.js, Version 5.5+
- [ ] Kopiraj connection string:
```
mongodb+srv://4sports-admin:<password>@4sports-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
- [ ] Zameni `<password>` sa pravim password-om
- [ ] Dodaj database name na kraju: `/4sports`
- [ ] Sačuvaj u `.env` fajl i Google Drive

#### 0.6 Resend API Key (Za Emails)
- [ ] Registruj se na https://resend.com
- [ ] Verifikuj email
- [ ] Idi na "API Keys"
- [ ] Klikni "Create API Key"
- [ ] Name: `4sports-backend`
- [ ] Permission: Full Access
- [ ] Kopiraj API key (počinje sa `re_...`)
- [ ] Sačuvaj u `.env` i Google Drive

#### 0.7 GitHub Repository Setup
- [ ] Vukašin će kreirati repository `4sports-monorepo`
- [ ] Pozovi Vukašina da te doda kao collaborator
- [ ] Kloniraj repo lokalno:
```bash
git clone https://github.com/USERNAME/4sports-monorepo.git
cd 4sports-monorepo
```

#### 0.8 Development Environment
- [ ] Instaliraj Node.js 20.x (https://nodejs.org)
- [ ] Proveri: `node --version` (treba biti v20.x.x)
- [ ] Instaliraj Git (https://git-scm.com)
- [ ] Instaliraj VS Code (https://code.visualstudio.com)
- [ ] VS Code Extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - MongoDB for VS Code

---

### PHASE 1: Backend Foundation (8-10 sati)

**Cilj:** Podigni osnovni Express server sa MongoDB konekcijom.

#### 1.1 Inicijalizuj Backend Projekat
- [ ] Otvori terminal u `backend/` folderu
- [ ] Pokreni `npm init -y`
- [ ] Instaliraj core dependencies (Express, Mongoose, dotenv, cors, helmet, express-rate-limit)
- [ ] Instaliraj Firebase Admin SDK
- [ ] Instaliraj TypeScript i dev dependencies
- [ ] Inicijalizuj TypeScript sa `npx tsc --init`

#### 1.2 Konfiguriši TypeScript
- [ ] Uredi `tsconfig.json` sa pravim config-om
- [ ] Podesi `outDir: "./dist"` i `rootDir: "./src"`
- [ ] Omogući strict mode i esModuleInterop

#### 1.3 Kreiraj Folder Strukturu
- [ ] Napravi sve potrebne foldere u `src/`:
  - `config/` - DB i Firebase setup
  - `models/` - Mongoose schemas
  - `controllers/` - Business logic
  - `routes/` - API routes
  - `middleware/` - Auth, validation, error handling
  - `services/` - External services (email, push, storage)
  - `utils/` - Helper functions i cron jobs
  - `types/` - TypeScript type definitions

#### 1.4 Setup Environment Variables
- [ ] Kreiraj `backend/.env` fajl (lokalno)
- [ ] Dodaj sve potrebne ENV variables
- [ ] Kreiraj `backend/.env.example` (template bez pravih vrednosti)
- [ ] Upload `.env` sadržaj na Google Drive
- [ ] Dodaj `firebase-admin-key.json` u backend folder

#### 1.5 Database Connection
- [ ] Napravi `src/config/db.ts`
- [ ] Implementiraj MongoDB connection funkciju
- [ ] Dodaj error handling za connection

#### 1.6 Firebase Configuration
- [ ] Napravi `src/config/firebase.ts`
- [ ] Inicijalizuj Firebase Admin SDK
- [ ] Setup Firebase Storage bucket
- [ ] Export auth i storage instance

#### 1.7 Main Server File
- [ ] Napravi `src/index.ts`
- [ ] Setup Express app
- [ ] Dodaj middleware: helmet, cors, express.json, rate limiting
- [ ] Connectuj MongoDB
- [ ] Dodaj health check route: `GET /health`
- [ ] Start server na PORT iz .env

#### 1.8 Update Package.json Scripts
- [ ] Dodaj script `"dev": "nodemon src/index.ts"`
- [ ] Dodaj script `"build": "tsc"`
- [ ] Dodaj script `"start": "node dist/index.js"`

#### 1.9 Test Backend
- [ ] Pokreni `npm run dev`
- [ ] Proveri da se MongoDB connectuje
- [ ] Testiraj `http://localhost:5000/health` u browser-u
- [ ] Proveri da vraća JSON response
- [ ] **Commit:** `backend: setup express server and mongodb connection`

---

### PHASE 2: Authentication & User Management (10-12 sati)

**Cilj:** Implementiraj Firebase authentication i user CRUD operacije.

#### 2.1 Kreiraj User Model
- [ ] Napravi `src/models/User.ts`
- [ ] Definiši User interface (IUser)
- [ ] Kreiraj Mongoose schema sa poljima:
  - firebaseUid (string, required, unique)
  - email (string, required, unique)
  - fullName (string, required)
  - phoneNumber (string, optional)
  - role (enum: OWNER, COACH, PARENT)
  - clubId (ObjectId, ref Club)
  - profileImage (string, optional)
  - pushToken (string, optional)
  - timestamps (createdAt, updatedAt)
- [ ] Export model

#### 2.2 Kreiraj Club Model
- [ ] Napravi `src/models/Club.ts`
- [ ] Definiši IClub interface
- [ ] Kreiraj schema sa poljima:
  - name (string, required)
  - ownerId (ObjectId, ref User)
  - address, phoneNumber, email (optional)
  - subscriptionPlan (enum: FREE, BASIC, PRO, default FREE)
  - memberLimit (number, default 50)
  - currentMembers (number, default 0)
  - timestamps
- [ ] Export model

#### 2.3 Kreiraj Auth Middleware
- [ ] Napravi `src/middleware/authMiddleware.ts`
- [ ] Implementiraj `protect` middleware funkciju
- [ ] Proveri Authorization header (Bearer token)
- [ ] Verifikuj Firebase token sa `auth.verifyIdToken()`
- [ ] Nađi usera u MongoDB sa firebaseUid
- [ ] Attach user-a na `req.user`
- [ ] Handle errors (401 Unauthorized)

#### 2.4 Kreiraj Auth Controller
- [ ] Napravi `src/controllers/authController.ts`
- [ ] Implementiraj `register` funkciju:
  - Primi firebaseToken, email, fullName, phoneNumber, role, inviteCode
  - Verifikuj Firebase token
  - Proveri da user ne postoji
  - TODO: Validiraj invite code (Phase 3)
  - Ako je role OWNER, kreiraj Club automatski
  - Kreiraj User-a u MongoDB
  - Update Club.ownerId
  - Vrati user data i token
- [ ] Implementiraj `login` funkciju:
  - Verifikuj Firebase token
  - Nađi user-a u MongoDB
  - Vrati user data sa populated clubId
- [ ] Implementiraj `getCurrentUser` funkciju:
  - Koristi `req.user` iz middleware
  - Vrati user sa populated club data

#### 2.5 Kreiraj Auth Routes
- [ ] Napravi `src/routes/authRoutes.ts`
- [ ] Setup Express Router
- [ ] Dodaj route: `POST /register` → `authController.register`
- [ ] Dodaj route: `POST /login` → `authController.login`
- [ ] Dodaj route: `GET /me` → `protect` middleware → `authController.getCurrentUser`
- [ ] Export router

#### 2.6 Main Router
- [ ] Napravi `src/routes/index.ts`
- [ ] Import authRoutes
- [ ] Setup main router
- [ ] `router.use('/auth', authRoutes)`
- [ ] Export main router

#### 2.7 Update Main Server
- [ ] Import routes iz `./routes`
- [ ] Dodaj `app.use('/api/v1', routes)`
- [ ] **Commit:** `backend: implement authentication system`

#### 2.8 Test Authentication
- [ ] Napravi test user u Firebase Console
- [ ] Testiraj `POST /api/v1/auth/register` sa Postman
- [ ] Testiraj `POST /api/v1/auth/login` sa Postman
- [ ] Testiraj `GET /api/v1/auth/me` sa Bearer token
- [ ] Proveri da se user čuva u MongoDB
- [ ] Proveri da se automatski kreira Club za OWNER

---

### PHASE 3: Invite Code System (6-8 sati)

**Cilj:** Implementiraj generisanje i validaciju invite kodova.

#### 3.1 Kreiraj InviteCode Model
- [ ] Napravi `src/models/InviteCode.ts`
- [ ] Definiši IInviteCode interface
- [ ] Kreiraj schema:
  - code (string, unique, uppercase)
  - type (enum: COACH, MEMBER)
  - clubId (ObjectId, required)
  - groupId (ObjectId, optional - za MEMBER type)
  - createdBy (ObjectId, ref User)
  - isActive (boolean, default true)
  - expiresAt (Date)
  - usedCount (number, default 0)
  - maxUses (number, optional)
- [ ] Export model

#### 3.2 Kreiraj Helper Za Generisanje Koda
- [ ] Napravi `src/utils/helpers.ts`
- [ ] Implementiraj `generateInviteCode()` funkciju
- [ ] Koristi crypto.randomBytes za random string
- [ ] Vrati 8-character uppercase code
- [ ] Export funkciju

#### 3.3 Kreiraj Invite Controller
- [ ] Napravi `src/controllers/inviteController.ts`
- [ ] Implementiraj `generateInviteCode`:
  - Primi type, clubId, groupId, expiresInDays, maxUses
  - Validacija: Samo OWNER može COACH kodove
  - Validacija: Samo OWNER/COACH mogu MEMBER kodove
  - Generiši unique code
  - Proveri da code ne postoji (loop dok ne nađeš unique)
  - Kalkuliši expiresAt (current date + expiresInDays)
  - Kreiraj InviteCode u MongoDB
  - Vrati invite code data
- [ ] Implementiraj `validateInviteCode`:
  - Primi code
  - Nađi InviteCode u MongoDB
  - Proveri da postoji, da je active, da nije expired
  - Proveri max uses ako je definisan
  - Nađi Club i proveri member limit
  - Vrati validation result sa club i group data
- [ ] Implementiraj `getInviteCodes`:
  - Filtriranje po type, isActive
  - Vrati listu kodova sa usage statistikom
- [ ] Implementiraj `deactivateInviteCode`:
  - Pronađi kod
  - Proveri permissions (samo creator ili OWNER)
  - Set isActive = false
  - Vrati success

#### 3.4 Kreiraj Invite Routes
- [ ] Napravi `src/routes/inviteRoutes.ts`
- [ ] `POST /generate` → protect → generateInviteCode
- [ ] `POST /validate` → validateInviteCode (public endpoint)
- [ ] `GET /` → protect → getInviteCodes
- [ ] `PATCH /:inviteId/deactivate` → protect → deactivateInviteCode
- [ ] Export router

#### 3.5 Update Main Router
- [ ] Import inviteRoutes u `src/routes/index.ts`
- [ ] Dodaj `router.use('/invites', inviteRoutes)`

#### 3.6 Update Auth Controller (Invite Validation)
- [ ] U `authController.register`:
  - Ako role !== OWNER, validiraj inviteCode
  - Pozovi InviteCode.findOne({ code: inviteCode })
  - Proveri validnost (active, not expired, etc.)
  - Ako je COACH type, dodeli user-a club-u
  - Ako je MEMBER type, TODO (Phase 4 - member creation)
  - Increment usedCount na invite code-u
  - **Commit:** `backend: implement invite code system`

#### 3.7 Test Invite System
- [ ] Kreiraj OWNER user-a
- [ ] Generiši COACH invite code
- [ ] Testiraj validaciju koda
- [ ] Registruj COACH-a sa tim kodom
- [ ] Proveri da je COACH linked sa Club-om
- [ ] Proveri da je usedCount increment-ovan

---

### PHASE 4: Groups & Members (10-12 sati)

**Cilj:** Implementiraj grupe i članove sa QR kodovima.

#### 4.1 Kreiraj Group Model
- [ ] Napravi `src/models/Group.ts`
- [ ] Schema sa poljima:
  - name, description
  - clubId (ref Club)
  - coachId (ref User)
  - memberIds (array of ObjectIds)
  - ageGroup, level (enum: BEGINNER, INTERMEDIATE, ADVANCED)
  - timestamps
- [ ] Export model

#### 4.2 Kreiraj Member Model
- [ ] Napravi `src/models/Member.ts`
- [ ] Schema:
  - fullName, dateOfBirth
  - clubId, groupId, parentId
  - qrCode (string, unique)
  - paymentStatus (boolean, default false)
  - lastPaymentDate (Date)
  - medicalStatus (boolean, default false)
  - lastMedicalDate (Date)
  - gender, height, weight, position
  - profileImage
  - isActive (boolean, default true)
- [ ] Dodaj index na qrCode i clubId
- [ ] Export model

#### 4.3 QR Code Service
- [ ] Napravi `src/services/qrService.ts`
- [ ] Implementiraj `generateUniqueMemberQR()`:
  - Generate kod: "MEMBER_" + memberId
  - Proveri da je unique
  - Vrati string
- [ ] Export service

#### 4.4 Group Controller
- [ ] Napravi `src/controllers/groupController.ts`
- [ ] `createGroup`: Kreiraj grupu, dodeli coach-u
- [ ] `getAllGroups`: List grupa za club sa filter-ima
- [ ] `getGroupDetails`: Group sa members i upcoming events
- [ ] `updateGroup`: Update grupa (permissions check)
- [ ] `deleteGroup`: Delete grupu (samo OWNER)

#### 4.5 Member Controller
- [ ] Napravi `src/controllers/memberController.ts`
- [ ] `createMember`:
  - Proveri club member limit (VAŽNO!)
  - Ako currentMembers >= memberLimit → Error 403
  - Generiši QR code
  - Kreiraj Member-a
  - Increment Club.currentMembers
  - Dodaj memberId u Group.memberIds
  - Vrati member sa QR kodom
- [ ] `getAllMembers`: Lista sa filter-ima (paymentStatus, medicalStatus, search)
- [ ] `getMemberDetails`: Detalji + stats (attendance rate, recent activity)
- [ ] `updateMember`: Update member info
- [ ] `deleteMember`:
  - Delete member-a
  - Decrement Club.currentMembers
  - Remove iz Group.memberIds
- [ ] `getMemberQRCode`: Vrati QR kao base64 image (koristi qrcode library)

#### 4.6 Group Routes
- [ ] Napravi `src/routes/groupRoutes.ts`
- [ ] Setup CRUD routes sa protect middleware
- [ ] Export router

#### 4.7 Member Routes
- [ ] Napravi `src/routes/memberRoutes.ts`
- [ ] Setup CRUD routes
- [ ] GET /:memberId/qr-code → getMemberQRCode
- [ ] Export router

#### 4.8 Update Main Router
- [ ] Dodaj group i member routes
- [ ] **Commit:** `backend: implement groups and members with QR codes`

#### 4.9 Test Groups & Members
- [ ] Kreiraj grupu kao COACH
- [ ] Kreiraj member-a
- [ ] Proveri da je QR code generisan
- [ ] Proveri member limit enforcement
- [ ] Testiraj update i delete operacije

---

### PHASE 5: Events & Attendance (12-14 sati)

**Cilj:** Kalendar, događaji i praćenje prisustva.

#### 5.1 Kreiraj Event Model
- [ ] Napravi `src/models/Event.ts`
- [ ] Schema:
  - title, description
  - type (enum: TRAINING, COMPETITION)
  - groupId (ref Group)
  - startTime, endTime (Date)
  - location
  - createdBy (ref User)
  - isRecurring, recurringPattern (optional)
- [ ] Export model

#### 5.2 Kreiraj Attendance Model
- [ ] Napravi `src/models/Attendance.ts`
- [ ] Schema:
  - eventId (ref Event)
  - memberId (ref Member)
  - present (boolean)
  - timestamp (Date)
  - scannedBy (ref User, optional)
  - method (enum: QR_SCAN, MANUAL)
- [ ] Composite index: eventId + memberId (unique)
- [ ] Export model

#### 5.3 Event Controller
- [ ] Napravi `src/controllers/eventController.ts`
- [ ] `createEvent`: Kreiraj trening ili takmičenje
- [ ] `getAllEvents`: Lista sa filter-ima (groupId, type, date range)
- [ ] `getEventDetails`: Event sa attendance lista
- [ ] `updateEvent`: Update event
- [ ] `deleteEvent`: Delete event
- [ ] `getCalendarEvents`: Group by date za calendar view

#### 5.4 Attendance Controller
- [ ] Napravi `src/controllers/attendanceController.ts`
- [ ] `markAttendanceQR`:
  - Primi eventId i qrCode
  - Nađi member-a sa tim QR kodom
  - Proveri da member pripada event.group
  - Kreiraj Attendance sa present=true, method=QR_SCAN
  - Vrati member info
- [ ] `markAttendanceManual`:
  - Primi eventId, memberId, present
  - Kreiraj Attendance sa method=MANUAL
- [ ] `bulkMarkAttendance`: Bulk insert za više članova
- [ ] `getEventAttendance`: Lista prisustva za event + stats
- [ ] `getMemberAttendance`: Attendance history za member-a
- [ ] `updateAttendance`: Update present status
- [ ] `deleteAttendance`: Delete record

#### 5.5 Event Routes
- [ ] Napravi `src/routes/eventRoutes.ts`
- [ ] Setup CRUD routes
- [ ] GET /calendar → getCalendarEvents
- [ ] Export router

#### 5.6 Attendance Routes
- [ ] Napravi `src/routes/attendanceRoutes.ts`
- [ ] POST /qr-scan → markAttendanceQR
- [ ] POST /manual → markAttendanceManual
- [ ] POST /bulk → bulkMarkAttendance
- [ ] GET /event/:eventId → getEventAttendance
- [ ] GET /member/:memberId → getMemberAttendance
- [ ] Export router

#### 5.7 Update Main Router
- [ ] Dodaj event i attendance routes
- [ ] **Commit:** `backend: implement events and attendance tracking`

#### 5.8 Test Events & Attendance
- [ ] Kreiraj event
- [ ] Mark attendance sa QR kodom
- [ ] Mark attendance manually
- [ ] Proveri attendance stats
- [ ] Testiraj bulk operations

---

### PHASE 6: Payments & Medical Checks (10-12 sati)

**Cilj:** Praćenje plaćanja i lekarskih pregleda.

#### 6.1 Kreiraj Payment Model
- [ ] Napravi `src/models/Payment.ts`
- [ ] Schema:
  - memberId (ref Member)
  - amount (number)
  - paymentDate (Date)
  - paymentMethod (enum: CASH, BANK_TRANSFER)
  - recordedBy (ref User)
  - month (string, format: YYYY-MM)
  - note (optional)
- [ ] Index: memberId, paymentDate
- [ ] Export model

#### 6.2 Kreiraj MedicalCheck Model
- [ ] Napravi `src/models/MedicalCheck.ts`
- [ ] Schema:
  - memberId (ref Member)
  - examinationDate (Date)
  - expiryDate (Date)
  - isValid (boolean)
  - recordedBy (ref User)
  - note (optional)
- [ ] Export model

#### 6.3 Payment Controller
- [ ] Napravi `src/controllers/paymentController.ts`
- [ ] `recordPayment`:
  - Primi memberId, amount, paymentDate, paymentMethod
  - Kreiraj Payment record
  - Update Member.paymentStatus = true
  - Update Member.lastPaymentDate
  - Kalkuliši month iz paymentDate
  - Vrati payment data
- [ ] `getAllPayments`: Lista sa filter-ima (clubId, month, memberId)
- [ ] `getPaymentDetails`: Single payment
- [ ] `updatePayment`: Update payment (samo OWNER)
- [ ] `deletePayment`:
  - Delete payment
  - Update Member.paymentStatus = false ako je to bio current month
- [ ] `sendPaymentReminder`: Pošalji push notifikacije roditeljima
- [ ] `getPaymentSummary`: Stats po mesecu, grupi

#### 6.4 Medical Controller
- [ ] Napravi `src/controllers/medicalController.ts`
- [ ] `recordMedicalCheck`:
  - Primi memberId, examinationDate
  - Kalkuliši expiryDate (examinationDate + 365 dana)
  - Kreiraj MedicalCheck
  - Update Member.medicalStatus = true
  - Update Member.lastMedicalDate
  - Vrati medical check data
- [ ] `getAllMedicalChecks`: Lista sa filter-ima (status, expiringInDays)
- [ ] `getMedicalCheckDetails`: Single check
- [ ] `updateMedicalCheck`: Update (samo OWNER)
- [ ] `deleteMedicalCheck`: Delete
- [ ] `getExpiringMedicalChecks`: Checks expiring u sledećih X dana

#### 6.5 Payment Routes
- [ ] Napravi `src/routes/paymentRoutes.ts`
- [ ] Setup CRUD routes
- [ ] POST /send-reminder → sendPaymentReminder
- [ ] GET /summary → getPaymentSummary
- [ ] Export router

#### 6.6 Medical Routes
- [ ] Napravi `src/routes/medicalRoutes.ts`
- [ ] Setup CRUD routes
- [ ] GET /expiring → getExpiringMedicalChecks
- [ ] Export router

#### 6.7 Update Main Router
- [ ] Dodaj payment i medical routes
- [ ] **Commit:** `backend: implement payments and medical checks`

#### 6.8 Test Payments & Medical
- [ ] Record payment za member-a
- [ ] Proveri da se paymentStatus update-uje
- [ ] Record medical check
- [ ] Proveri da se medicalStatus update-uje
- [ ] Testiraj reminder funkcionalnost

---

### PHASE 7: Finance & Posts (8-10 sati)

**Cilj:** Manuelni finansijski unosi i novosti.

#### 7.1 Kreiraj Finance Model
- [ ] Napravi `src/models/Finance.ts`
- [ ] Schema:
  - clubId
  - type (INCOME, EXPENSE)
  - category (EQUIPMENT, RENT, SALARY, OTHER)
  - amount, description, date
  - invoice (URL, optional)
  - recordedBy
- [ ] Export model

#### 7.2 Kreiraj Post Model
- [ ] Napravi `src/models/Post.ts`
- [ ] Schema:
  - authorId (ref User)
  - groupId (ref Group)
  - content (text)
  - mediaUrls (array of strings)
  - createdAt
- [ ] Export model

#### 7.3 Finance Controller
- [ ] Napravi `src/controllers/financeController.ts`
- [ ] CRUD operacije za finance entries
- [ ] `getFinancialSummary`: Income/expense stats po periodu

#### 7.4 Post Controller
- [ ] Napravi `src/controllers/postController.ts`
- [ ] CRUD operacije za posts
- [ ] Filter po groupId

#### 7.5 Finance & Post Routes
- [ ] Napravi routes za oba
- [ ] Update main router
- [ ] **Commit:** `backend: implement finance and posts`

#### 7.6 Test Finance & Posts
- [ ] Testiraj kreiranje finance entry
- [ ] Testiraj summary stats
- [ ] Testiraj post creation

---

### PHASE 8: Push Notifications & Email (6-8 sati)

**Cilj:** Implementiraj notification servise.

#### 8.1 Push Notification Service
- [ ] Napravi `src/services/pushService.ts`
- [ ] Implementiraj funkciju za slanje Expo push notifikacija
- [ ] `sendPushNotification(tokens, title, body, data)`
- [ ] Handle batch sending
- [ ] Export service

#### 8.2 Email Service
- [ ] Napravi `src/services/emailService.ts`
- [ ] Integracija sa Resend API
- [ ] `sendEmail(to, subject, html)`
- [ ] Export service

#### 8.3 Notification Controller
- [ ] Napravi `src/controllers/notificationController.ts`
- [ ] `registerPushToken`: Sačuvaj Expo push token za user-a
- [ ] `sendPushNotification`: Pošalji notifikaciju
- [ ] `getNotificationHistory`: Lista poslanih notifikacija (optional)

#### 8.4 Notification Routes
- [ ] POST /register-token → registerPushToken
- [ ] POST /send → sendPushNotification
- [ ] Export router, dodaj u main
- [ ] **Commit:** `backend: implement push notifications and email service`

#### 8.5 Test Notifications
- [ ] Registruj push token
- [ ] Pošalji test notifikaciju
- [ ] Proveri prijem na mobile app (u koordinaciji sa Mihajlom)

---

### PHASE 9: File Upload (4-6 sati)

**Cilj:** Upload slika i videa na Firebase Storage.

#### 9.1 Storage Service
- [ ] Napravi `src/services/storageService.ts`
- [ ] Implementiraj `uploadFile(file, path)`:
  - Upload na Firebase Storage bucket
  - Vrati public URL
- [ ] Implementiraj `deleteFile(url)`:
  - Delete file iz Storage
- [ ] Export service

#### 9.2 Upload Middleware
- [ ] Napravi `src/middleware/uploadMiddleware.ts`
- [ ] Koristi `multer` za file handling
- [ ] Setup memory storage
- [ ] File size limit (10MB za slike, 50MB za videa)
- [ ] File type validation

#### 9.3 Upload Controller
- [ ] Napravi `src/controllers/uploadController.ts`
- [ ] `uploadFile`:
  - Primi file
  - Validiraj type (PROFILE_IMAGE, POST_IMAGE, POST_VIDEO, INVOICE)
  - Upload na Firebase Storage
  - Vrati URL
- [ ] Export controller

#### 9.4 Upload Route
- [ ] POST /upload → uploadMiddleware → uploadFile
- [ ] Dodaj u main router
- [ ] **Commit:** `backend: implement file upload to firebase storage`

#### 9.5 Test Upload
- [ ] Upload sliku
- [ ] Proveri da je na Firebase Storage
- [ ] Proveri URL pristup

---

### PHASE 10: Cron Jobs & Automation (8-10 sati)

**Cilj:** Automatski reset plaćanja i provera lekarskih.

#### 10.1 Install node-cron
- [ ] `npm install node-cron @types/node-cron`

#### 10.2 Cron Jobs Utilities
- [ ] Napravi `src/utils/cronJobs.ts`
- [ ] Implementiraj `resetPaymentStatus`:
  - Cron expression: '0 0 1 * *' (1. u mesecu u ponoć)
  - Logika:
    - Nađi sve active članove
    - Update paymentStatus = false za sve
    - Pošalji notifikacije treneru
  - Start job
- [ ] Implementiraj `checkMedicalExpiration`:
  - Cron expression: '0 0 * * *' (svaki dan u ponoć)
  - Logika:
    - Nađi sve članove sa lastMedicalDate > 365 dana
    - Update medicalStatus = false
    - Pošalji notifikacije (trener + roditelj)
    - Warning za one koji expire za 30 dana
  - Start job
- [ ] Implementiraj `startCronJobs()`:
  - Start oba job-a
  - Log kad su pokrenuti

#### 10.3 Update Main Server
- [ ] Import `startCronJobs` u `src/index.ts`
- [ ] Pozovi nakon DB connection
- [ ] **Commit:** `backend: implement cron jobs for automation`

#### 10.4 Test Cron Jobs
- [ ] Manuelno pozovi funkcije (ne čekaj cron)
- [ ] Proveri da se payment status resetuje
- [ ] Proveri da se medical status update-uje
- [ ] Proveri notifikacije

---

### PHASE 11: Dashboard Statistics (6-8 sati)

**Cilj:** API endpoints za owner dashboard KPI-jeve.

#### 11.1 Club Controller Updates
- [ ] Napravi `src/controllers/clubController.ts`
- [ ] `getDashboardStats`:
  - KPIs:
    - Current revenue (sum svih payments za current month)
    - New members percentage (current vs previous month)
    - Total members
    - Total transactions
  - Member growth (po mesecima)
  - Revenue by month (sa expenses)
  - Revenue by quarter
  - Balance (income - expenses)
  - Vrati sve stats
- [ ] Export controller

#### 11.2 Club Routes
- [ ] Napravi `src/routes/clubRoutes.ts`
- [ ] GET /:clubId → getClubDetails
- [ ] GET /:clubId/dashboard → getDashboardStats
- [ ] PATCH /:clubId → updateClub
- [ ] Export router, dodaj u main
- [ ] **Commit:** `backend: implement dashboard statistics API`

#### 11.3 Test Dashboard API
- [ ] Pozovi dashboard endpoint
- [ ] Proveri da vraća sve KPIs
- [ ] Proveri charts data format

---

### PHASE 12: Testing & Bug Fixes (20-30 sati)

**Cilj:** Kompletno testiranje backend-a.

#### 12.1 Setup Postman Collection
- [ ] Kreiraj Postman collection: "4Sports Backend API"
- [ ] Dodaj sve endpoints po folderima:
  - Auth
  - Clubs
  - Users
  - Invites
  - Groups
  - Members
  - Events
  - Attendance
  - Payments
  - Medical Checks
  - Finance
  - Posts
  - Notifications
  - Upload
- [ ] Setup environment variables (API_URL, TOKEN)
- [ ] Čuvaj collection u Google Drive

#### 12.2 Test Scenarios
- [ ] **Authentication Flow:**
  - Register OWNER
  - Register COACH sa invite kodom
  - Register PARENT sa invite kodom
  - Login svi tipovi
  - Get current user
- [ ] **Invite System:**
  - Generate COACH code (kao OWNER)
  - Generate MEMBER code (kao COACH)
  - Validate valid code
  - Validate expired code
  - Validate inactive code
- [ ] **Groups & Members:**
  - Create group
  - Create member
  - Test member limit enforcement
  - Generate QR code
  - Update member
  - Delete member (proveri decrement)
- [ ] **Events & Attendance:**
  - Create training event
  - Create competition
  - Mark attendance sa QR kodom
  - Mark attendance manually
  - Bulk mark attendance
  - Get attendance stats
- [ ] **Payments:**
  - Record payment
  - Proveri status update
  - Send payment reminder
  - Get payment summary
  - Delete payment
- [ ] **Medical Checks:**
  - Record medical check
  - Proveri status update
  - Get expiring checks
  - Manual expiration test
- [ ] **Finance & Posts:**
  - Create income entry
  - Create expense entry
  - Get financial summary
  - Create post sa media
- [ ] **File Upload:**
  - Upload profile image
  - Upload post image
  - Upload invoice
- [ ] **Notifications:**
  - Register push token
  - Send test notification
- [ ] **Cron Jobs:**
  - Manually trigger payment reset
  - Manually trigger medical check
  - Verify results

#### 12.3 Error Handling Testing
- [ ] Test invalid tokens (401)
- [ ] Test missing permissions (403)
- [ ] Test invalid data (400)
- [ ] Test not found resources (404)
- [ ] Test duplicate entries (409)

#### 12.4 Performance Testing
- [ ] Test sa 100+ members
- [ ] Test bulk operations
- [ ] Check database query performance
- [ ] Check response times

#### 12.5 Bug Fixes
- [ ] Napravi listu svih bugova
- [ ] Prioritizuj (critical, high, medium, low)
- [ ] Fixi critical i high bugs
- [ ] **Commit:** `backend: fix [bug description]` za svaki bug

#### 12.6 Integration Testing sa Frontend-om
- [ ] Koordiniraj se sa Vukašinom (web)
- [ ] Test web admin API calls
- [ ] Fix CORS issues ako postoje
- [ ] Koordiniraj se sa Mihajlom (mobile)
- [ ] Test mobile app API calls
- [ ] Test push notifications end-to-end

---

### PHASE 13: Documentation & Code Cleanup (4-6 sati)

**Cilj:** Dokumentuj backend i očisti kod.

#### 13.1 API Documentation
- [ ] Proveri da li je `docs/API_SPEC.md` ažuran
- [ ] Dodaj primere za sve endpoint-e
- [ ] Dokumentuj error responses

#### 13.2 Code Comments
- [ ] Dodaj JSDoc comments na sve funkcije
- [ ] Objasni kompleksnu logiku
- [ ] Dokumentuj environment variables

#### 13.3 README za Backend
- [ ] Napravi `backend/README.md`
- [ ] Setup instrukcije
- [ ] Environment variables
- [ ] Development workflow
- [ ] Testing guide

#### 13.4 Code Cleanup
- [ ] Remove console.log() (ostavi samo error logs)
- [ ] Remove commented out code
- [ ] Format kod sa Prettier
- [ ] Run ESLint i fixi warnings
- [ ] **Commit:** `backend: add documentation and cleanup code`

---

### PHASE 14: Deployment Preparation (4-6 sati)

**Cilj:** Pripremi backend za production deployment.

#### 14.1 Environment Setup
- [ ] Kreiraj `.env.production` template
- [ ] Dokumentuj sve production ENV variables
- [ ] Upload na Google Drive

#### 14.2 Security Checklist
- [ ] Proveri da je `.env` u `.gitignore`
- [ ] Proveri da je `firebase-admin-key.json` u `.gitignore`
- [ ] Proveri rate limiting
- [ ] Proveri CORS config (samo dozvoliti production URLs)
- [ ] Proveri helmet middleware
- [ ] Generate strong JWT_SECRET za production

#### 14.3 Database Preparation
- [ ] Proveri MongoDB indexes
- [ ] Optimizuj queries
- [ ] Setup production MongoDB network access (ograniči na Render IP)

#### 14.4 Build Test
- [ ] Run `npm run build`
- [ ] Proveri da `dist/` folder ima sve
- [ ] Test production build lokalno: `node dist/index.js`
- [ ] **Commit:** `backend: prepare for production deployment`

---

### PHASE 15: Deployment na Render (6-8 sati)

**Cilj:** Deploy backend na Render production.

#### 15.1 Render Account Setup
- [ ] Registruj se na https://render.com
- [ ] Connect GitHub account
- [ ] Verifikuj email

#### 15.2 Create Web Service
- [ ] Klikni "New +" → "Web Service"
- [ ] Connect 4sports-monorepo repository
- [ ] **Root Directory:** `backend`
- [ ] **Name:** `4sports-api`
- [ ] **Environment:** Node
- [ ] **Build Command:** `npm install && npm run build`
- [ ] **Start Command:** `npm start`
- [ ] **Instance Type:** Free

#### 15.3 Environment Variables
- [ ] Dodaj sve ENV variables iz `.env`:
  - NODE_ENV=production
  - PORT=5000 (ili ostavi prazan, Render dodeljuje)
  - MONGODB_URI (production connection string)
  - FIREBASE_PROJECT_ID
  - FIREBASE_STORAGE_BUCKET
  - JWT_SECRET (NOVI, jak secret!)
  - RESEND_API_KEY
  - WEB_ADMIN_URL (URL od Vercel-a)
  - MOBILE_APP_URL (production app URL)
- [ ] **FIREBASE_ADMIN_KEY:** Copy-paste ceo JSON iz `firebase-admin-key.json` kao jedan ENV variable

#### 15.4 Deploy
- [ ] Klikni "Create Web Service"
- [ ] Sačekaj build (5-10 minuta)
- [ ] Proveri logs
- [ ] Kopiraj production URL (npr. `https://4sports-api.onrender.com`)

#### 15.5 Test Production API
- [ ] Testiraj health endpoint: `https://4sports-api.onrender.com/health`
- [ ] Proveri MongoDB connection u logs
- [ ] Testiraj auth endpoint
- [ ] Testiraj jedan CRUD endpoint
- [ ] **Obavesti tim:** Pošalji production API URL Vukašinu i Mihajlu

#### 15.6 Setup UptimeRobot
- [ ] Registruj se na https://uptimerobot.com
- [ ] Add New Monitor:
  - Type: HTTP(s)
  - Name: 4Sports API
  - URL: `https://4sports-api.onrender.com/health`
  - Interval: 5 minutes
- [ ] Klikni Create Monitor
- [ ] **Napomena:** Ovo drži Render free tier awake

#### 15.7 Monitor & Debug
- [ ] Proveri Render logs redovno
- [ ] Proveri MongoDB Atlas metrics
- [ ] Testiraj cron jobs na production
- [ ] **Commit:** `backend: deploy to render production`

---

## 🧪 TESTIRANJE

### Unit Testing (Optional - Ako Ima Vremena)
- [ ] Instaliraj Jest i testing utilities
- [ ] Napiši unit tests za helper funkcije
- [ ] Napiši tests za middleware
- [ ] Run tests: `npm test`

### Integration Testing (Obavezno)
- [ ] Postman collection sa svim endpoint-ima
- [ ] Test success cases
- [ ] Test error cases
- [ ] Test edge cases
- [ ] Document test results

---

## 📞 KOORDINACIJA SA TIMOM

### Kada Pozovati Vukašina (Web Developer):
- [ ] Kada završiš API endpoint pa da ga testira na web-u
- [ ] Kada promeniš API response format
- [ ] Kada backend ne može da reši problem u `web-admin/` folderu
- [ ] Kada web admin ne može da se connectuje na API (proveri CORS)

### Kada Pozovati Mihajla (Mobile Developer):
- [ ] Kada završiš push notification sistem
- [ ] Kada završiš file upload funkcionalnost
- [ ] Kada backend ne može da reši problem u `mobile-app/` folderu
- [ ] Kada mobile app ne prima notifikacije (backend slao, app ne prima)

### Daily Standup (Preporučeno):
- [ ] Šta si juče uradio
- [ ] Šta planiraš danas
- [ ] Ima li blocker-a

### Code Review:
- [ ] Pull requests review-uju Vukašin i Mihajlo
- [ ] Ne merge-uj sam dok neko ne approve
- [ ] Review njihove backend-related PR-ove

---

## 🎯 DEFINITION OF DONE

### Feature je Gotov Kada:
- ✅ Kod je napisan i testiran
- ✅ API endpoint vraća tačan response format
- ✅ Error handling je implementiran
- ✅ Postman test je prošao
- ✅ Commit je pushed na GitHub
- ✅ Pull Request je kreiran
- ✅ Code review je done
- ✅ Merged u main branch
- ✅ Testirano sa web/mobile app-om (ako je potrebno)
- ✅ Dokumentovano u API_SPEC.md (ako je novi endpoint)

---

## ✅ CHECKLIST PRE DEPLOYMENT

- [ ] Svi endpoint-i testirani u Postman-u
- [ ] Cron jobs rade ispravno
- [ ] ENV fajlovi su na Google Drive
- [ ] `.env` i `firebase-admin-key.json` NISU na Git-u
- [ ] CORS je konfigurisan za production URLs
- [ ] Rate limiting je aktivan
- [ ] Error handling je svuda implementiran
- [ ] MongoDB indexes su kreirani
- [ ] Production JWT_SECRET je generisan
- [ ] Backend build prolazi (`npm run build`)
- [ ] Render account je setup
- [ ] ENV variables su dodati na Render
- [ ] Deploy je uspešan
- [ ] Production API je testiran
- [ ] UptimeRobot je setup
- [ ] Tim je obavešten o production URL-u

---

## 🚀 SUCCESS CRITERIA

### Backend je Završen Kada:
1. ✅ Owner može da registruje klub
2. ✅ Owner može da generiše COACH invite kod
3. ✅ Coach može da se registruje sa invite kodom
4. ✅ Coach može da kreira grupe
5. ✅ Coach može da generiše MEMBER invite kod
6. ✅ Parent može da se registruje i doda člana
7. ✅ QR kod se generiše za svakog člana
8. ✅ Coach može da skeniše QR kod za attendance
9. ✅ Attendance se čuva u bazi
10. ✅ Coach može da evidentira plaćanje
11. ✅ Payment status se automatski resetuje 1. u mesecu (cron job)
12. ✅ Coach može da evidentira lekar pregled
13. ✅ Medical status expira posle 365 dana (cron job)
14. ✅ Push notifikacije se šalju
15. ✅ File upload radi (slike, videi)
16. ✅ Dashboard API vraća sve KPI-jeve i chart data
17. ✅ API je deployed na Render
18. ✅ Web admin može da fetuju-je podatke
19. ✅ Mobile app može da fetuje podatke
20. ✅ Sve je testirano i radi stabilno

---

## 📁 FINALNA STRUKTURA BACKEND FOLDERA

```
backend/
├── src/
│   ├── config/
│   │   ├── db.ts
│   │   └── firebase.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Club.ts
│   │   ├── InviteCode.ts
│   │   ├── Group.ts
│   │   ├── Member.ts
│   │   ├── Event.ts
│   │   ├── Attendance.ts
│   │   ├── Payment.ts
│   │   ├── MedicalCheck.ts
│   │   ├── Finance.ts
│   │   └── Post.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── clubController.ts
│   │   ├── userController.ts
│   │   ├── inviteController.ts
│   │   ├── groupController.ts
│   │   ├── memberController.ts
│   │   ├── eventController.ts
│   │   ├── attendanceController.ts
│   │   ├── paymentController.ts
│   │   ├── medicalController.ts
│   │   ├── financeController.ts
│   │   ├── postController.ts
│   │   ├── notificationController.ts
│   │   └── uploadController.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── authRoutes.ts
│   │   ├── clubRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── inviteRoutes.ts
│   │   ├── groupRoutes.ts
│   │   ├── memberRoutes.ts
│   │   ├── eventRoutes.ts
│   │   ├── attendanceRoutes.ts
│   │   ├── paymentRoutes.ts
│   │   ├── medicalRoutes.ts
│   │   ├── financeRoutes.ts
│   │   ├── postRoutes.ts
│   │   ├── notificationRoutes.ts
│   │   └── uploadRoutes.ts
│   ├── middleware/
│   │   ├── authMiddleware.ts
│   │   ├── roleMiddleware.ts
│   │   ├── uploadMiddleware.ts
│   │   ├── validationMiddleware.ts
│   │   └── errorMiddleware.ts
│   ├── services/
│   │   ├── qrService.ts
│   │   ├── pushService.ts
│   │   ├── emailService.ts
│   │   └── storageService.ts
│   ├── utils/
│   │   ├── cronJobs.ts
│   │   └── helpers.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── .env (lokalno, na Google Drive, NIKAD na Git)
├── .env.example
├── firebase-admin-key.json (lokalno, na Google Drive, NIKAD na Git)
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

**Srećno sa razvojem, Nemanja! Backend je srce aplikacije - sve zavisi od tebe! 💪🔥**

**Ako se zaglaviš, prvo proveri dokumentaciju, zatim pitaj tim. Nikad ne menjaj web ili mobile kod!**

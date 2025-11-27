# 4SPORTS — IMPLEMENTATION PLAN ZA MIHAJLA (MOBILE APP DEVELOPER)

**Tvoja Uloga:** Mobile App Developer
**Tvoja Odgovornost:** `mobile-app/` folder i sve što se nalazi u njemu
**Estimated Timeline:** 10-12 nedelja (solo mobile development)
**Status:** Ready to Execute

---

## 🎯 TVOJE ODGOVORNOSTI

### ✅ Šta Radiš TI:
- **Sav kod u `mobile-app/` folderu**
- React Native + Expo aplikacija
- Mobile app za trenere i roditelje
- QR kod scanning (kamera funkcionalnost)
- QR kod generation (za članove)
- Push notifications
- Kalendar i događaji
- Firebase Auth integracija (mobile)
- Mobile UI komponente (React Native Paper ili Tamagui)
- EAS Build za Android i iOS
- Mobile testiranje (Expo Go, real devices)

### ❌ Šta NE Radiš TI:
- `backend/` folder - **To je Nemanjina odgovornost**
- `web-admin/` folder - **To je Vukašinova odgovornost**
- Backend API endpoints
- Database modeli
- Web admin UI komponente

---

## 🚨 VAŽNA PRAVILA

### 1. GitHub Pravila

#### Tvoj Branch Naming:
```bash
mobile/feature-name
mobile/fix-bug-name
```

**Primeri:**
imamo sledece grane:
main, development, i nemanja, mihajlo, vukasin

#### Kako Radiš Sa Gitom:

**Početak Rada (Svaki Dan):**
```bash
# Idi u mobile-app folder
cd mobile-app

# Proveri da li si na main branch-u
git branch

# Povuci najnovije izmene
git pull origin main
# idi na dev
git checkout -b development
# Napravi svoj branch iz dev
git checkout -b mihajlo
```


**Tokom Rada:**
```bash
# Dodaj svoje izmene (SAMO iz mobile-app foldera)
git add .

# Commit sa jasnom porukom
git commit -m "mobile: add QR code scanner for attendance"

# Pushuj na GitHub
git push origin mihajlo
```

**Kada Završiš Feature:**
1. Pushuj branch na GitHub
2. Otvori Pull Request (PR)
3. Dodaj Nemanju i Vukašina kao reviewers
4. **NE MERGE-uj sam** - sačekaj approval
5. Nakon approval, merge u main

#### Commit Message Format:
```bash
mobile: kratak opis šta si uradio

Primeri:
- mobile: add login screen with firebase auth
- mobile: implement QR code scanner
- mobile: create member profile screen with QR display
- mobile: fix camera permissions on android
- mobile: add push notifications setup
```

---

### 2. ENV Fajlovi i Tajni Ključevi

#### ⚠️ NIKADA NE COMMIT-uj Ove Fajlove:
- `mobile-app/.env`
- `mobile-app/.env.local`
- Bilo koji fajl sa API ključevima

#### ✅ Kako Čuvaš ENV Fajlove:

**1. Lokalno (Tvoj Računar):**
```bash
# mobile-app/.env - samo na tvom računaru, NIKAD na Git
```

**2. Google Drive (Za Tim):**
- Napravi folder: `4Sports - ENV Files`
- Upload fajlove:
  - `mobile-app-env.txt` (sadržaj tvog .env fajla)
  - `firebase-mobile-config.json`
- Podeli pristup sa Nemanjom i Vukašinom

**3. EAS Build (Production):**
- ENV variables se dodaju u `eas.json` ili tokom build-a
- Ne hardcode-uj ih u kod

#### ENV Fajl Struktura:
Tvoj `mobile-app/.env` treba da sadrži:
```
# Backend API URL
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1

# Firebase Mobile Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456:android:abcdef
```

**Napomena:** Expo koristi `EXPO_PUBLIC_` prefix za ENV variables dostupne u klijent kodu.

**Kada Dodaš Novi ENV Variable:**
1. Dodaj ga u svoj lokalni `.env`
2. Ažuriraj `mobile-app/.env.example` (bez prave vrednosti)
3. Ažuriraj fajl na Google Drive
4. Obavesti Nemanju i Vukašina
5. Ažuriraj `eas.json` ako je potrebno za build

---

### 3. Claude Agent Pravila

#### ✅ Claude Sme Da Ti Menja Kod U:
- `mobile-app/app/` i sve podfoldere (Expo Router screens)
- `mobile-app/components/`
- `mobile-app/assets/`
- `mobile-app/constants/`
- `mobile-app/hooks/`
- `mobile-app/services/`
- `mobile-app/utils/`
- `mobile-app/types/`
- `mobile-app/package.json`
- `mobile-app/app.json`
- `mobile-app/eas.json`
- `mobile-app/.env.example`
- `mobile-app/README.md`

#### ❌ Claude NE SME Da Ti Menja Kod U:
- `backend/` - **Nemanjin folder**
- `web-admin/` - **Vukašinov folder**
- `docs/` - Samo ako svi unapred dogovorite

#### Ako Nešto Ne Radi Van Mobile-App-a:

**Primer 1: API endpoint ne vraća podatke**
- **NE MENJAJ** kod u `backend/`
- Proveri da li API URL u .env tačan
- Testiraj endpoint sa Postman-om ili browser-om
- Proveri Network requests u Expo DevTools
- Ako API ne radi → **Pozovi Nemanju**

**Primer 2: Push notifikacije se ne šalju**
- Proveri da li backend šalje notifikacije
- Testiraj sa backend endpoint-om direktno
- Proveri Expo Push Token registration
- Ako backend ne šalje → **Pozovi Nemanju**
- Ako backend šalje a app ne prima → To je tvoje

**Primer 3: QR kod skenira ali attendance ne radi**
- Proveri da li app šalje ispravan QR kod na backend
- Testiraj attendance endpoint sa Postman-om
- Ako backend vraća error → **Pozovi Nemanju**
- Ako je problem u camera logic → To je tvoje

**Pravilo:**
> Ako problem nije u `mobile-app/` folderu, **ZAUSTAVI SE** i komuniciraj sa timom.

---

## 📋 FAZE RAZVOJA (BEZ KODA - SAMO ZADACI)

### PHASE 0: Pre-Development Setup (4-6 sati)

**Tvoji Eksterni Zadaci (Van IDE):**

#### 0.1 Firebase Mobile App Setup
- [ ] Idi na https://console.firebase.google.com
- [ ] Odaberi projekat `4sports-mvp` (isti kao web i backend)
- [ ] Idi na Project Settings → General
- [ ] Scroll do "Your apps" section
- [ ] **Android App:**
  - Klikni Android icon
  - Package name: `com.yourdomain.foursports` (ili kako odlučiš)
  - App nickname: `4sports-mobile-android`
  - Download `google-services.json` (čuvaćeš ga u projektu)
  - Klikni Register
- [ ] **iOS App:**
  - Klikni iOS icon
  - Bundle ID: `com.yourdomain.foursports`
  - App nickname: `4sports-mobile-ios`
  - Download `GoogleService-Info.plist`
  - Klikni Register
- [ ] **Sačuvaj config fajlove** na Google Drive

#### 0.2 Expo Account
- [ ] Registruj se na https://expo.dev
- [ ] Verifikuj email
- [ ] Kreiraj organization (optional): `4sports`
- [ ] **Zapamti username** - trebaće za EAS Build

#### 0.3 GitHub Repository (Ako Vec Nije Kreiran)
- [ ] Koordiniraj se sa Vukašinom - on će kreirati repo
- [ ] Zatraži da te doda kao collaborator
- [ ] Kloniraj repo:
```bash
git clone https://github.com/USERNAME/4sports-monorepo.git
cd 4sports-monorepo
```

#### 0.4 Development Environment
- [ ] Instaliraj Node.js 20.x (https://nodejs.org)
- [ ] Proveri: `node --version` (v20.x.x)
- [ ] Instaliraj Expo CLI globalno: `npm install -g expo-cli`
- [ ] Instaliraj EAS CLI globalno: `npm install -g eas-cli`
- [ ] Instaliraj VS Code (https://code.visualstudio.com)
- [ ] VS Code Extensions:
  - ESLint
  - Prettier
  - React Native Tools
  - Expo Tools

#### 0.5 Test Device Setup
- [ ] **Android:**
  - Instaliraj Expo Go app iz Play Store
  - Omogući Developer mode na telefonu
- [ ] **iOS:**
  - Instaliraj Expo Go app iz App Store
  - (Za iOS development treba Mac - ako imaš)

---

### PHASE 1: Inicijalizacija Expo Projekta (6-8 sati)

**Cilj:** Setup React Native Expo projekat sa osnovnim dependencies.

#### 1.1 Kreiraj Expo Projekat
- [ ] Otvori terminal u root folderu projekta
- [ ] Pokreni:
```bash
npx create-expo-app mobile-app --template blank-typescript
cd mobile-app
```
- [ ] Ili: Idi u mobile-app i run `npx create-expo-app . --template blank-typescript`

#### 1.2 Instaliraj Expo Router
- [ ] `npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar`
- [ ] Ažuriraj `app.json` za Expo Router:
  - Dodaj `"scheme": "foursports"`
  - Update entry point

#### 1.3 Instaliraj Core Dependencies
- [ ] Navigation:
  - Expo Router je već instaliran
- [ ] HTTP Client:
  - `npm install axios`
  - `npm install @tanstack/react-query`
- [ ] Firebase:
  - `npx expo install firebase`
- [ ] QR Functionality:
  - `npx expo install expo-camera`
  - `npm install react-native-qrcode-svg`
  - `npx expo install react-native-svg`
- [ ] Storage:
  - `npx expo install @react-native-async-storage/async-storage`
- [ ] Notifications:
  - `npx expo install expo-notifications`
  - `npx expo install expo-device`
- [ ] Image Picker:
  - `npx expo install expo-image-picker`
- [ ] Date/Time:
  - `npx expo install @react-native-community/datetimepicker`

#### 1.4 Instaliraj UI Library
- [ ] Odaberi jednu:
  - **React Native Paper:** `npm install react-native-paper`
  - **Tamagui:** `npm install tamagui @tamagui/config` (naprednije)
  - Ili: Koristi custom komponente
- [ ] Instaliraj icons:
  - `npm install lucide-react-native` ili `@expo/vector-icons` (već dolazi sa Expo)

#### 1.5 Kreiraj Folder Strukturu
- [ ] Napravi foldere:
  - `app/` - Expo Router screens (već postoji)
    - `app/(auth)/` - Login, Register
    - `app/(coach)/` - Screens za trenera
    - `app/(parent)/` - Screens za roditelja
  - `components/` - Reusable komponente
    - `components/ui/` - UI komponente
  - `assets/` - Images, fonts (već postoji)
  - `constants/` - Colors, Layout constants
  - `hooks/` - Custom hooks
  - `services/` - API calls, auth, notifications
  - `utils/` - Helper functions
  - `types/` - TypeScript types

#### 1.6 Setup Environment Variables
- [ ] Kreiraj `mobile-app/.env` fajl
- [ ] Dodaj API URL i Firebase config
- [ ] Kreiraj `mobile-app/.env.example` template
- [ ] Upload .env na Google Drive
- [ ] **Proveri da je `.env` u .gitignore**

#### 1.7 Konfiguriši app.json
- [ ] Update app name, slug, version
- [ ] Setup icon i splash screen (placeholder za sada)
- [ ] Setup permissions:
  - Camera (za QR scanning)
  - Notifications

#### 1.8 Test Expo Development Server
- [ ] Run: `npx expo start`
- [ ] Skeniraj QR kod sa Expo Go app-om
- [ ] Proveri da app radi na telefonu
- [ ] **Commit:** `mobile: setup expo project with dependencies`

---

### PHASE 2: Firebase Auth Integration (8-10 sati)

**Cilj:** Implementiraj login i registraciju sa Firebase.

#### 2.1 Firebase Config
- [ ] Napravi `services/firebase.ts`
- [ ] Import Firebase modules (auth, storage)
- [ ] Inicijalizuj Firebase app sa config iz .env
- [ ] Export `auth` i `storage` instance

#### 2.2 Auth Service
- [ ] Napravi `services/auth.ts`
- [ ] Funkcije:
  - `registerWithEmail(email, password)`
  - `loginWithEmail(email, password)`
  - `logout()`
  - `getCurrentUser()`
  - `getIdToken()` - Za backend API calls

#### 2.3 API Service (Axios Setup)
- [ ] Napravi `services/api.ts`
- [ ] Kreiraj Axios instance sa baseURL iz .env
- [ ] Request interceptor:
  - Dodaj Firebase ID token u Authorization header
- [ ] Response interceptor:
  - Handle 401 (logout i redirect)
  - Handle errors
- [ ] Export API instance

#### 2.4 Auth Context
- [ ] Napravi `services/AuthContext.tsx`
- [ ] Context sa user, loading, error states
- [ ] Functions: login, register, logout
- [ ] useEffect: Firebase onAuthStateChanged listener
- [ ] Export `useAuth` hook

#### 2.5 Login Screen
- [ ] Napravi `app/(auth)/login.tsx`
- [ ] Form sa:
  - Email input
  - Password input
  - Login button
  - Link ka Register
- [ ] Validacija
- [ ] Error handling
- [ ] Loading state
- [ ] OnSuccess: Navigate ka home

#### 2.6 Register Screen
- [ ] Napravi `app/(auth)/register.tsx`
- [ ] Form sa:
  - Email
  - Password
  - Confirm Password
  - Full Name
  - Phone Number
  - Invite Code
- [ ] Radio buttons za role (COACH ili PARENT)
- [ ] Validacija
- [ ] Pozovi backend `/api/v1/auth/register` nakon Firebase registracije
- [ ] Error handling
- [ ] OnSuccess: Navigate ka home

#### 2.7 Invite Code Input Screen
- [ ] Napravi `app/(auth)/invite-code.tsx`
- [ ] Input field za invite kod
- [ ] Validate button (pozovi backend `/api/v1/invites/validate`)
- [ ] Prikaz validacije (Valid/Invalid)
- [ ] Prikaži informacije (Club name, Group name ako je MEMBER)
- [ ] Continue button

#### 2.8 Splash Screen
- [ ] Napravi `app/index.tsx` kao entry point
- [ ] Proveri auth status
- [ ] Ako je authenticated → Navigate ka (coach) ili (parent) folder
- [ ] Ako nije → Navigate ka login
- [ ] Loading spinner dok se proverava

#### 2.9 Test Authentication
- [ ] Test register flow
- [ ] Test login flow
- [ ] Test logout
- [ ] Test auto-login (persistence)
- [ ] **Commit:** `mobile: implement firebase authentication`

---

### PHASE 3: Layout & Navigation (6-8 sati)

**Cilj:** Setup tab navigation i screen structure.

#### 3.1 Coach Tab Navigation
- [ ] Napravi `app/(coach)/_layout.tsx`
- [ ] Expo Router Tabs:
  - Home (Dashboard)
  - Calendar
  - Members
  - Profile
- [ ] Icons za svaki tab (Lucide icons)
- [ ] Active state styling

#### 3.2 Parent Tab Navigation
- [ ] Napravi `app/(parent)/_layout.tsx`
- [ ] Expo Router Tabs:
  - Home
  - Calendar
  - Profile
- [ ] Icons
- [ ] Active state styling

#### 3.3 Coach Screens (Placeholder)
- [ ] `app/(coach)/index.tsx` - Dashboard
- [ ] `app/(coach)/calendar.tsx` - Calendar
- [ ] `app/(coach)/members.tsx` - Members list
- [ ] `app/(coach)/profile.tsx` - Profile
- [ ] Svaki screen sa basic text za sada

#### 3.4 Parent Screens (Placeholder)
- [ ] `app/(parent)/index.tsx` - Home
- [ ] `app/(parent)/calendar.tsx` - Calendar
- [ ] `app/(parent)/profile.tsx` - Profile

#### 3.5 Test Navigation
- [ ] Test tab switching
- [ ] Test navigation između screens
- [ ] **Commit:** `mobile: add tab navigation and screen structure`

---

### PHASE 4: Coach - QR Code Scanner (12-14 sati)

**Cilj:** Implementiraj QR skeniranje za prisustvo.

#### 4.1 Camera Permissions
- [ ] Napravi `hooks/useCameraPermissions.ts`
- [ ] Request camera permission
- [ ] Handle permission states (granted, denied)

#### 4.2 QR Scanner Screen
- [ ] Napravi `app/(coach)/attendance/scan-qr.tsx`
- [ ] Koristi Expo Camera:
  - Camera view sa QR scanning
  - Overlay sa frame za QR kod
  - "Scan QR Code" instrukcija
- [ ] OnScan:
  - Vibrate ili sound feedback
  - Pozovi API: `POST /api/v1/attendance/qr-scan`
  - Prikaži success/error message
  - Automatski close ili scan next

#### 4.3 Manual Attendance Screen
- [ ] Napravi `app/(coach)/attendance/manual-add.tsx`
- [ ] Lista članova (checkbox lista)
- [ ] Select/Deselect all
- [ ] Submit button
- [ ] API call: `POST /api/v1/attendance/manual` ili bulk

#### 4.4 Event Session Screen
- [ ] Napravi `app/(coach)/attendance/session-[id].tsx`
- [ ] Dynamic route za eventId
- [ ] Prikaži:
  - Event info (title, date, time)
  - Buttons: "Scan QR" i "Add Manually"
  - Lista članova:
    - Present (zeleni checkmark)
    - Absent (crveni X ili sivi)
  - Stats (10/12 present)
- [ ] Real-time update kad se skenira član

#### 4.5 Test QR Scanning
- [ ] Test sa pravim QR kodom (generiši ga preko web-a ili testa)
- [ ] Test camera permissions
- [ ] Test manual add
- [ ] **Commit:** `mobile: implement QR code scanner for attendance`

---

### PHASE 5: Parent - QR Code Display (6-8 sati)

**Cilj:** Prikaži QR kod za svakog člana.

#### 5.1 QR Code Component
- [ ] Napravi `components/QRCodeDisplay.tsx`
- [ ] Koristi `react-native-qrcode-svg`
- [ ] Props: qrCode (string), size, memberName
- [ ] Dizajn:
  - QR kod centriran
  - White background za QR
  - Member name ispod
  - Border radius, shadow

#### 5.2 Member Profile Screen (Parent)
- [ ] Napravi `app/(parent)/member/[id].tsx`
- [ ] Dynamic route za memberId
- [ ] Fetch member data sa API
- [ ] Prikaži:
  - Profile image (avatar)
  - Member name, age
  - QR kod (veliki, centriran)
  - Stats cards:
    - Payment Status (badge: Paid/Unpaid)
    - Medical Status (badge: Valid/Expired)
    - Attendance Rate (%)
  - Attendance history lista

#### 5.3 Parent Home Screen
- [ ] Update `app/(parent)/index.tsx`
- [ ] Lista dece (members) roditelja
- [ ] Svako dete kao card:
  - Avatar
  - Name
  - Payment i Medical status badges
  - Tap → Navigate ka member/[id]

#### 5.4 Test QR Display
- [ ] Test QR generation
- [ ] Scan sa coach app-om
- [ ] Proveri da radi end-to-end
- [ ] **Commit:** `mobile: add QR code display for members`

---

### PHASE 6: Calendar & Events (10-12 sati)

**Cilj:** Prikaz događaja i kalendar.

#### 6.1 Calendar Library
- [ ] Instaliraj: `npm install react-native-calendars`
- [ ] Ili: Koristi Expo Calendar ako treba native integracija

#### 6.2 Calendar Component
- [ ] Napravi `components/Calendar.tsx`
- [ ] Month view sa marked dates
- [ ] Different colors:
  - Training (zelena)
  - Competition (narandžasta)
- [ ] OnDayPress: Navigate ka day's events

#### 6.3 Coach Calendar Screen
- [ ] Update `app/(coach)/calendar.tsx`
- [ ] Calendar component na vrhu
- [ ] Lista događaja ispod kalendara:
  - Filter: All, Today, Upcoming
  - Event cards:
    - Title
    - Type badge (Training/Competition)
    - Date & Time
    - Location
    - Tap → Navigate ka event details
- [ ] FAB (Floating Action Button) za create event

#### 6.4 Create Event Screen (Coach)
- [ ] Napravi `app/(coach)/events/create.tsx`
- [ ] Form:
  - Title
  - Type (Training/Competition)
  - Group (select dropdown)
  - Date & Time pickers
  - Location
  - Description (optional)
- [ ] API call: `POST /api/v1/events`
- [ ] OnSuccess: Navigate nazad + refresh calendar

#### 6.5 Event Details Screen
- [ ] Napravi `app/(coach)/events/[id].tsx`
- [ ] Event info display
- [ ] Attendance section:
  - Button: "Mark Attendance"
  - Lista članova sa present/absent
  - Stats
- [ ] Edit/Delete buttons (coach only)

#### 6.6 Parent Calendar Screen
- [ ] Update `app/(parent)/calendar.tsx`
- [ ] Calendar sa marked dates (read-only)
- [ ] Lista upcoming events za dete
- [ ] Event cards:
  - Title, Date, Time
  - "Najavi odsustvo" button (optional feature)

#### 6.7 Test Calendar
- [ ] Test create event
- [ ] Test calendar display
- [ ] Test event details
- [ ] Test na oba role (coach i parent)
- [ ] **Commit:** `mobile: implement calendar and events`

---

### PHASE 7: Members List (Coach) (8-10 sati)

**Cilj:** Lista članova sa filter-ima.

#### 7.1 Members API Hooks
- [ ] Napravi `hooks/useMembers.ts`
- [ ] React Query:
  - `useQuery` za fetch members
  - Filters: paymentStatus, medicalStatus, search

#### 7.2 Member Card Component
- [ ] Napravi `components/MemberCard.tsx`
- [ ] Design:
  - Avatar (left)
  - Name, Age (center)
  - Status badges (right):
    - Payment (green/red)
    - Medical (green/red)
  - Tap → Navigate ka member details

#### 7.3 Coach Members Screen
- [ ] Update `app/(coach)/members.tsx`
- [ ] Search bar (input)
- [ ] Filters (chips ili buttons):
  - All
  - Unpaid
  - Medical Expired
- [ ] FlatList sa MemberCard komponente
- [ ] Pull-to-refresh
- [ ] Loading spinner
- [ ] Empty state

#### 7.4 Member Details Screen (Coach)
- [ ] Napravi `app/(coach)/members/[id].tsx`
- [ ] Member info display:
  - Avatar, Name, DOB, Age
  - Height, Weight, Position
  - Parent info (name, phone)
  - Group
- [ ] Action cards:
  - "Record Payment" button
  - "Record Medical" button
  - "View Attendance" button
- [ ] Stats:
  - Attendance rate
  - Last payment date
  - Medical expiry date

#### 7.5 Record Payment Screen
- [ ] Napravi `app/(coach)/payments/record.tsx`
- [ ] Form:
  - Member (pre-selected ako dolazi iz member details)
  - Amount
  - Payment Method (Cash/Bank Transfer)
  - Date (default today)
  - Note (optional)
- [ ] API call: `POST /api/v1/payments`
- [ ] OnSuccess: Update member status, navigate back

#### 7.6 Record Medical Screen
- [ ] Napravi `app/(coach)/medical/record.tsx`
- [ ] Form:
  - Member (pre-selected)
  - Examination Date
  - Note (optional)
- [ ] API call: `POST /api/v1/medical-checks`
- [ ] OnSuccess: Update member status

#### 7.7 Test Members
- [ ] Test lista članova
- [ ] Test filters i search
- [ ] Test record payment
- [ ] Test record medical
- [ ] **Commit:** `mobile: add members list and management`

---

### PHASE 8: Push Notifications (8-10 sati)

**Cilj:** Setup push notifications za reminders.

#### 8.1 Push Notification Service
- [ ] Napravi `services/pushNotifications.ts`
- [ ] Funkcije:
  - `registerForPushNotifications()` - Request permission, get Expo Push Token
  - `sendTokenToBackend(token)` - Sačuvaj token na backend
  - `setupNotificationListeners()` - Handle received notifications

#### 8.2 Request Permissions
- [ ] U App initialization (useEffect)
- [ ] Request notification permissions
- [ ] Get Expo Push Token
- [ ] Pošalji token na backend: `POST /api/v1/notifications/register-token`

#### 8.3 Notification Listeners
- [ ] Setup listener za:
  - Notification received (app in foreground)
  - Notification tapped (app in background/closed)
- [ ] Handle navigation based na notification data
  - Npr: Payment reminder → Navigate ka payment screen

#### 8.4 Test Notifications
- [ ] Testiraj sa Expo push tool
- [ ] Koordiniraj se sa Nemanjom da pošalje test notifikaciju
- [ ] Test foreground i background handling
- [ ] **Commit:** `mobile: implement push notifications`

---

### PHASE 9: Profile & Settings (6-8 sati)

**Cilj:** User profile i app settings.

#### 9.1 Coach Profile Screen
- [ ] Update `app/(coach)/profile.tsx`
- [ ] Display:
  - Avatar (editable)
  - Full Name
  - Email
  - Phone Number
  - Club Name
  - Role badge
- [ ] Buttons:
  - Edit Profile
  - Change Password
  - Logout

#### 9.2 Parent Profile Screen
- [ ] Update `app/(parent)/profile.tsx`
- [ ] Display:
  - Avatar
  - Name
  - Email
  - Phone
  - Children lista (members)
- [ ] Buttons:
  - Edit Profile
  - Logout

#### 9.3 Edit Profile Screen
- [ ] Napravi `app/profile/edit.tsx`
- [ ] Form:
  - Full Name
  - Phone Number
  - Avatar upload (Expo Image Picker)
- [ ] API call: `PATCH /api/v1/users/:userId`

#### 9.4 Image Upload
- [ ] Koristi Expo Image Picker
- [ ] Upload sliku na backend: `POST /api/v1/upload`
- [ ] Update profile image URL

#### 9.5 Test Profile
- [ ] Test edit profile
- [ ] Test image upload
- [ ] Test logout
- [ ] **Commit:** `mobile: add profile and settings`

---

### PHASE 10: News Feed (8-10 sati)

**Cilj:** Posts i novosti od trenera.

#### 10.1 Create Post Screen (Coach)
- [ ] Napravi `app/(coach)/news/create.tsx`
- [ ] Form:
  - Group (select)
  - Text content (textarea)
  - Media picker (images/videos)
    - Multiple selection
    - Preview selected media
- [ ] Upload media files
- [ ] API call: `POST /api/v1/posts`

#### 10.2 Post Card Component
- [ ] Napravi `components/PostCard.tsx`
- [ ] Design:
  - Author avatar, name, timestamp
  - Text content
  - Media (images/videos) - scrollable gallery
  - Like/Comment icons (optional future feature)

#### 10.3 News Feed Screen (Coach)
- [ ] Napravi `app/(coach)/news/index.tsx`
- [ ] Lista posts-ova (FlatList)
- [ ] Filter by group
- [ ] FAB za create post
- [ ] Pull-to-refresh

#### 10.4 News Feed Screen (Parent)
- [ ] Napravi `app/(parent)/news/index.tsx`
- [ ] Lista posts-ova za child's group
- [ ] Read-only (ne može da kreira)

#### 10.5 Test News Feed
- [ ] Test create post sa media
- [ ] Test prikaz posts-ova
- [ ] Test na oba role
- [ ] **Commit:** `mobile: implement news feed`

---

### PHASE 11: Offline Support & Caching (8-10 sati)

**Cilj:** App radi bez interneta (basic functionality).

#### 11.1 React Query Persistence
- [ ] Setup React Query persist
- [ ] Cache API responses lokalno
- [ ] Auto-sync kad se vrati connection

#### 11.2 Offline Attendance
- [ ] Čuvaj skenirane QR kodove lokalno (AsyncStorage)
- [ ] Prikaži "Offline" badge
- [ ] Sync sa backend-om kad se vrati internet
- [ ] API call: `POST /api/v1/attendance/bulk`

#### 11.3 Network Status Indicator
- [ ] Napravi `components/NetworkStatus.tsx`
- [ ] Prikaži banner: "You are offline"
- [ ] Koristi NetInfo library

#### 11.4 Test Offline
- [ ] Turn off WiFi/Data
- [ ] Test QR scanning (should cache)
- [ ] Test calendar view (should show cached)
- [ ] Turn on internet
- [ ] Proveri da se sync-uje
- [ ] **Commit:** `mobile: add offline support and caching`

---

### PHASE 12: UI Polish & Animations (8-10 sati)

**Cilj:** Poboljšaj UX sa animacijama i transitions.

#### 12.1 Loading States
- [ ] Skeleton loaders za liste
- [ ] Spinner za buttons
- [ ] Progress bar za file uploads
- [ ] Shimmer effect

#### 12.2 Animations
- [ ] Screen transitions (fade, slide)
- [ ] Card animations (scale on press)
- [ ] List item animations
- [ ] Koristi `react-native-reanimated`

#### 12.3 Pull-to-Refresh
- [ ] Na svim listama
- [ ] Custom refresh indicator

#### 12.4 Empty States
- [ ] Empty state komponenta
- [ ] Illustrations ili icons
- [ ] Friendly messages

#### 12.5 Error States
- [ ] Error screens
- [ ] Retry buttons
- [ ] Toast/Snackbar za errors

#### 12.6 Success Feedback
- [ ] Haptic feedback (vibration)
- [ ] Success toasts
- [ ] Checkmark animations

#### 12.7 Test UX
- [ ] Test sve animacije
- [ ] Test loading states
- [ ] Test error handling
- [ ] **Commit:** `mobile: add animations and UX polish`

---

### PHASE 13: Testing & Bug Fixes (20-30 sati)

**Cilj:** Kompletno testiranje app-a.

#### 13.1 Manual Testing Checklist
- [ ] **Authentication:**
  - Register COACH
  - Register PARENT
  - Login/Logout
  - Invite code validation
- [ ] **Coach Flow:**
  - View calendar
  - Create event
  - Scan QR code
  - Mark attendance manually
  - View members list
  - Record payment
  - Record medical check
  - Create news post
- [ ] **Parent Flow:**
  - View home (children list)
  - View member QR code
  - View calendar
  - View news feed
  - Check payment status
  - Check medical status

#### 13.2 Device Testing
- [ ] Android:
  - Različite verzije (Android 10, 11, 12, 13)
  - Različite rezolucije
- [ ] iOS:
  - iPhone različite veličine (SE, 11, 12, 13, 14)
  - iPad (optional)

#### 13.3 Camera & Permissions Testing
- [ ] Test camera permissions na prvom launch-u
- [ ] Test QR scanning pod različitim osvetljenjem
- [ ] Test sa pravim članom (end-to-end)

#### 13.4 Push Notifications Testing
- [ ] Test foreground notifications
- [ ] Test background notifications
- [ ] Test notification tap navigation
- [ ] Test na oba OS-a (Android i iOS)

#### 13.5 Performance Testing
- [ ] Check app size (after build)
- [ ] Check startup time
- [ ] Check scroll performance (large lists)
- [ ] Memory leaks check

#### 13.6 Bug Tracking
- [ ] Napravi listu bugova (Google Sheet ili GitHub Issues)
- [ ] Prioritizuj (Critical, High, Medium, Low)
- [ ] Fixi Critical i High bugs
- [ ] **Commit:** `mobile: fix [bug description]`

#### 13.7 Integration Testing
- [ ] Koordiniraj se sa Nemanjom (backend)
- [ ] Test all API endpoints
- [ ] Test sa pravim production backend-om
- [ ] Koordiniraj se sa Vukašinom (ako ima overlap)

---

### PHASE 14: Icon, Splash Screen & App Info (4-6 sati)

**Cilj:** Finalizuj branding.

#### 14.1 App Icon
- [ ] Dizajniraj ili zatraži icon (1024x1024px)
- [ ] Generate sve rezolucije
- [ ] Update `app.json` sa icon path
- [ ] Test na device-u

#### 14.2 Splash Screen
- [ ] Dizajniraj splash screen
- [ ] Dark background sa logo-m
- [ ] Update `app.json`
- [ ] Test splash screen

#### 14.3 App Metadata
- [ ] Update `app.json`:
  - Name: "4Sports"
  - Description
  - Version: 1.0.0
  - Orientation: portrait
  - Permissions
  - Privacy policy URL (ako treba)

#### 14.4 Test Branding
- [ ] Install app on device
- [ ] Check icon prikazan correctly
- [ ] Check splash screen
- [ ] **Commit:** `mobile: add app icon and splash screen`

---

### PHASE 15: Build & Deployment (EAS) (8-10 sati)

**Cilj:** Build app za Android i iOS.

#### 15.1 EAS Configuration
- [ ] Login: `eas login`
- [ ] Inicijalizuj: `eas build:configure`
- [ ] Ažuriraj `eas.json`:
  - Build profiles (development, preview, production)
  - Environment variables

#### 15.2 Android Build (Development/Preview)
- [ ] `eas build --platform android --profile preview`
- [ ] Sačekaj build (15-30 minuta)
- [ ] Download APK
- [ ] Instaliraj na Android device
- [ ] Test kompletnu app

#### 15.3 iOS Build (Ako Imaš Mac & Apple Dev Account)
- [ ] Apple Developer account potreban
- [ ] Certificates i provisioning profiles
- [ ] `eas build --platform ios --profile preview`
- [ ] Sačekaj build
- [ ] Test na iOS device

#### 15.4 Production Build
- [ ] Update verziju u `app.json`
- [ ] `eas build --platform android --profile production`
- [ ] `eas build --platform ios --profile production` (optional)
- [ ] Sačuvaj build URLs

#### 15.5 App Store Submission (Future - Optional Za MVP)
- [ ] Google Play Console setup
- [ ] Upload APK/AAB
- [ ] App listing (screenshots, description)
- [ ] Submit for review
- [ ] (iOS: App Store Connect - slično)

#### 15.6 Internal Distribution (MVP)
- [ ] Share APK download link sa timom
- [ ] Share sa test korisnicima (klubovima)
- [ ] Gather feedback

#### 15.7 Test Production Build
- [ ] Install production APK
- [ ] Test sa production backend URL
- [ ] Test sve funkcionalnosti
- [ ] **Commit:** `mobile: prepare production build`

---

## 🧪 TESTIRANJE

### Expo Go Testing (Development)
- [ ] `npx expo start`
- [ ] Scan QR sa Expo Go app-om
- [ ] Test na real device

### Standalone Build Testing
- [ ] Install APK/IPA na device
- [ ] Test without Expo Go
- [ ] Check permissions
- [ ] Check push notifications

---

## 📞 KOORDINACIJA SA TIMOM

### Kada Pozovati Nemanju (Backend Developer):
- [ ] Kada API endpoint ne radi
- [ ] Kada dobijaš 500 server errors
- [ ] Kada push notifikacije se ne šalju sa backend-a
- [ ] Kada QR kod validacija fail-uje na backend-u
- [ ] Kada trebaš novi API endpoint
- [ ] **NIKAD ne menjaj backend kod**

### Kada Pozovati Vukašina (Web Developer):
- [ ] Kada trebaš da se dogovoriš oko dizajn sistema
- [ ] Kada web i mobile trebaju isti flow (npr. invite code)
- [ ] **NIKAD ne menjaj web kod**

### Daily Standup (Preporučeno):
- [ ] Šta si juče uradio
- [ ] Šta planiraš danas
- [ ] Ima li blocker-a

### Code Review:
- [ ] Pull requests review-uju Nemanja i Vukašin
- [ ] Ne merge-uj sam dok neko ne approve
- [ ] Review njihove mobile-related PR-ove

---

## 🎯 DEFINITION OF DONE

### Feature je Gotov Kada:
- ✅ Screen je kreiran i stilizovan
- ✅ API integracija radi
- ✅ Testiran na Android device-u
- ✅ Testiran na iOS device-u (ako imaš)
- ✅ Loading i error states implementirani
- ✅ Permissions rade
- ✅ Nema console warnings/errors
- ✅ Commit je pushed
- ✅ Pull Request kreiran
- ✅ Code review done
- ✅ Merged u main
- ✅ Testiran na EAS build-u

---

## ✅ CHECKLIST PRE PRODUCTION BUILD

- [ ] Sve screens rade
- [ ] API calls rade sa production backend URL-om
- [ ] ENV fajlovi su na Google Drive
- [ ] `.env` NIJE na Git-u
- [ ] Camera permissions rade
- [ ] Push notifications rade
- [ ] QR scanning radi end-to-end
- [ ] QR display radi
- [ ] Offline support implementiran
- [ ] App icon i splash screen finalizovani
- [ ] `app.json` metadata ažuriran
- [ ] EAS build configuration gotova
- [ ] Testiran na real devices (Android i iOS)
- [ ] Tim je obavešten

---

## 🚀 SUCCESS CRITERIA

### Mobile App je Završen Kada:
1. ✅ Coach može da se login-uje
2. ✅ Coach može da skenira QR kod za attendance
3. ✅ Coach može da manually mark-uje attendance
4. ✅ Coach može da kreira događaje
5. ✅ Coach može da vidi kalendar
6. ✅ Coach može da vidi listu članova
7. ✅ Coach može da evidentira plaćanje
8. ✅ Coach može da evidentira medicinski pregled
9. ✅ Coach može da kreira news post
10. ✅ Parent može da se login-uje
11. ✅ Parent može da vidi QR kod deteta
12. ✅ Parent može da vidi kalendar događaja
13. ✅ Parent može da vidi payment status
14. ✅ Parent može da vidi medical status
15. ✅ Parent može da vidi attendance istoriju
16. ✅ Push notifikacije rade
17. ✅ Offline attendance caching radi
18. ✅ App je build-ovan sa EAS
19. ✅ APK radi na Android devices
20. ✅ Sve je testirano i stabilno

---

## 📁 FINALNA STRUKTURA MOBILE-APP FOLDERA

```
mobile-app/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── invite-code.tsx
│   ├── (coach)/
│   │   ├── _layout.tsx (Tabs)
│   │   ├── index.tsx (Dashboard)
│   │   ├── calendar.tsx
│   │   ├── members.tsx
│   │   ├── profile.tsx
│   │   ├── attendance/
│   │   │   ├── scan-qr.tsx
│   │   │   ├── manual-add.tsx
│   │   │   └── session-[id].tsx
│   │   ├── events/
│   │   │   ├── create.tsx
│   │   │   └── [id].tsx
│   │   ├── members/
│   │   │   └── [id].tsx
│   │   ├── payments/
│   │   │   └── record.tsx
│   │   ├── medical/
│   │   │   └── record.tsx
│   │   └── news/
│   │       ├── index.tsx
│   │       └── create.tsx
│   ├── (parent)/
│   │   ├── _layout.tsx (Tabs)
│   │   ├── index.tsx (Home)
│   │   ├── calendar.tsx
│   │   ├── profile.tsx
│   │   ├── member/
│   │   │   └── [id].tsx
│   │   └── news/
│   │       └── index.tsx
│   ├── profile/
│   │   └── edit.tsx
│   ├── _layout.tsx (Root layout)
│   └── index.tsx (Splash/Entry)
├── assets/
│   ├── images/
│   ├── fonts/
│   └── icon.png
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── Spinner.tsx
│   ├── MemberCard.tsx
│   ├── EventCard.tsx
│   ├── PostCard.tsx
│   ├── QRCodeDisplay.tsx
│   ├── QRScanner.tsx
│   ├── Calendar.tsx
│   └── NetworkStatus.tsx
├── constants/
│   ├── Colors.ts
│   └── Layout.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useMembers.ts
│   ├── useEvents.ts
│   ├── useCameraPermissions.ts
│   └── usePushNotifications.ts
├── services/
│   ├── api.ts
│   ├── auth.ts
│   ├── firebase.ts
│   ├── pushNotifications.ts
│   └── storage.ts
├── types/
│   └── index.ts
├── utils/
│   └── helpers.ts
├── .env (lokalno, Google Drive, NIKAD Git)
├── .env.example
├── .gitignore
├── app.json
├── eas.json
├── package.json
└── README.md
```

---

**Srećno sa razvojem, Mihajlo! Mobile app je najvažniji deo - tu se sve dešava u realnom vremenu! 💪📱**

**Ako se zaglaviš, prvo proveri dokumentaciju, zatim pitaj tim. Nikad ne menjaj backend ili web kod!**

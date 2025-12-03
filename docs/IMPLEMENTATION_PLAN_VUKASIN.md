# 4SPORTS — IMPLEMENTATION PLAN ZA VUKAŠINA (WEB ADMIN DEVELOPER)

**Tvoja Uloga:** Frontend Web Developer
**Tvoja Odgovornost:** `web-admin/` folder i sve što se nalazi u njemu
**Estimated Timeline:** 8-10 nedelja (solo web development)
**Status:** Ready to Execute

---

## 🎯 TVOJE ODGOVORNOSTI

### ✅ Šta Radiš TI:
- **Sav kod u `web-admin/` folderu**
- React + TypeScript aplikacija
- Admin dashboard za vlasnike klubova
- UI komponente (shadcn/ui + TailwindCSS)
- Recharts grafikoni i vizualizacije
- API integracija sa backend-om (React Query)
- Firebase Auth integracija (frontend)
- Web deployment na Vercel
- Web testiranje (browser, responsive design)

### ❌ Šta NE Radiš TI:
- `backend/` folder - **To je Nemanjina odgovornost**
- `mobile-app/` folder - **To je Mihajlova odgovornost**
- Backend API endpoints
- Database modeli i schemas
- Server-side logika
- Mobile app komponente

---

## 🚨 VAŽNA PRAVILA

### 1. GitHub Pravila

#### Tvoj Branch Naming:
```bash
web/feature-name
web/fix-bug-name
```

**Primeri:**
- `web/dashboard-kpi-cards`
- `web/member-list-table`
- `web/fix-chart-rendering`

#### Kako Radiš Sa Gitom:

**Početak Rada (Svaki Dan):**
```bash
# Idi u web-admin folder
cd web-admin

# Proveri da li si na main branch-u
git branch

# Povuci najnovije izmene
git pull origin main

# Napravi svoj feature branch
git checkout -b web/tvoj-feature-name
```

**Tokom Rada:**
```bash
# Dodaj svoje izmene (SAMO iz web-admin foldera)
git add .

# Commit sa jasnom porukom
git commit -m "web: add dashboard KPI cards component"

# Pushuj na GitHub
git push origin web/tvoj-feature-name
```

**Kada Završiš Feature:**
1. Pushuj branch na GitHub
2. Otvori Pull Request (PR)
3. Dodaj Nemanju i Mihajla kao reviewers
4. **NE MERGE-uj sam** - sačekaj approval
5. Nakon approval, merge u main

#### Commit Message Format:
```bash
web: kratak opis šta si uradio

Primeri:
- web: add login page with firebase auth
- web: implement dashboard with KPI cards
- web: create member list table with filters
- web: fix responsive design on mobile
- web: add recharts line graph for revenue
```

---

### 2. ENV Fajlovi i Tajni Ključevi

#### ⚠️ NIKADA NE COMMIT-uj Ove Fajlove:
- `web-admin/.env`
- `web-admin/.env.local`
- Bilo koji fajl sa API ključevima

#### ✅ Kako Čuvaš ENV Fajlove:

**1. Lokalno (Tvoj Računar):**
```bash
# web-admin/.env - samo na tvom računaru, NIKAD na Git
```

**2. Google Drive (Za Tim):**
- Napravi folder: `4Sports - ENV Files`
- Upload fajlove:
  - `web-admin-env.txt` (sadržaj tvog .env fajla)
  - `firebase-web-config.json` (Firebase config)
- Podeli pristup sa Nemanjom i Mihajlom

**3. Vercel (Production):**
- Idi na Vercel Dashboard
- Project Settings → Environment Variables
- Dodaj svaki ENV variable ručno

#### ENV Fajl Struktura:
Tvoj `web-admin/.env` treba da sadrži:
```
# Firebase Configuration (Frontend)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456:web:abcdef

# Backend API URL
VITE_API_URL=http://localhost:5000/api/v1
```

**Kada Dodaš Novi ENV Variable:**
1. Dodaj ga u svoj lokalni `.env`
2. Ažuriraj `web-admin/.env.example` (bez prave vrednosti)
3. Ažuriraj fajl na Google Drive
4. Obavesti Nemanju i Mihajla
5. Dodaj na Vercel (kada deploy-uješ)

---

### 3. Claude Agent Pravila

#### ✅ Claude Sme Da Ti Menja Kod U:
- `web-admin/src/` i sve podfoldere
- `web-admin/public/`
- `web-admin/package.json`
- `web-admin/tsconfig.json`
- `web-admin/tailwind.config.js`
- `web-admin/vite.config.ts`
- `web-admin/.env.example` (template, ne pravi .env!)
- `web-admin/README.md`
- `web-admin/index.html`

#### ❌ Claude NE SME Da Ti Menja Kod U:
- `backend/` - **Nemanjin folder**
- `mobile-app/` - **Mihajlov folder**
- `docs/` - Samo ako svi unapred dogovorite

#### Ako Nešto Ne Radi Van Web-Admin-a:

**Primer 1: API endpoint ne vraća podatke**
- **NE MENJAJ** kod u `backend/`
- Proveri da li API URL u .env tačan
- Testiraj endpoint sa Postman-om ili browser-om
- Proveri Network tab u browser DevTools
- Ako API ne radi → **Pozovi Nemanju**

**Primer 2: Grafikoni ne prikazuju podatke**
- Proveri da li API vraća podatke u tačnom formatu
- Proveri da li je problem u Recharts konfiguraciji
- Ako API vraća pogrešan format → **Pozovi Nemanju**
- Ako je problem u chart component-i → To je tvoje

**Primer 3: Firebase Auth ne radi**
- Proveri Firebase config u .env
- Proveri da je Email/Password provider enabled u Firebase Console
- Testiraj sa manual user creation
- Ako je problem u backend token validation → **Pozovi Nemanju**

**Pravilo:**
> Ako problem nije u `web-admin/` folderu, **ZAUSTAVI SE** i komuniciraj sa timom.

---

## 📋 FAZE RAZVOJA (BEZ KODA - SAMO ZADACI)

### PHASE 0: Pre-Development Setup (4-6 sati)

**Tvoji Eksterni Zadaci (Van IDE):**

#### 0.1 Firebase Web App Setup
- [ ] Idi na https://console.firebase.google.com
- [ ] Odaberi projekat `4sports-mvp` (kreiraj ga ako ne postoji)
- [ ] Idi na Project Settings → General
- [ ] Scroll do "Your apps" section
- [ ] Klikni Web icon (</>) da dodaš web app
- [ ] App nickname: `4sports-web-admin`
- [ ] **NE ČEKIRAJ** Firebase Hosting (koristimo Vercel)
- [ ] Klikni "Register app"
- [ ] **Kopiraj firebaseConfig objekat** - izgleda ovako:
```javascript
const firebaseConfig = {
  apiKey: "xxx",
  authDomain: "xxx",
  projectId: "xxx",
  storageBucket: "xxx",
  messagingSenderId: "xxx",
  appId: "xxx"
};
```
- [ ] Sačuvaj config u text fajl i upload na Google Drive
- [ ] **Podeli sa Nemanjom** da ima isti projekat za backend

#### 0.2 Firebase Authentication (Provera)
- [ ] Idi na Firebase Console → Build → Authentication
- [ ] Proveri da je Email/Password provider enabled
- [ ] Ako nije, omogući ga (klikni Enable)
- [ ] Save

#### 0.3 GitHub Repository (Ako Vec Nije Kreiran)
- [ ] Idi na https://github.com
- [ ] Klikni "New repository"
- [ ] Ime: `4sports-monorepo`
- [ ] Private repository
- [ ] **NE INICIJALIZUJ** sa README (već imamo fajlove)
- [ ] Klikni "Create repository"
- [ ] **Dodaj Nemanju i Mihajla kao collaborators**:
  - Settings → Collaborators → Add people

#### 0.4 Vercel Account Setup
- [ ] Idi na https://vercel.com
- [ ] Sign up sa GitHub account-om
- [ ] Authorize Vercel da pristupa tvom GitHub-u
- [ ] **Ne importuj projekat još** - to ćeš kasnije

#### 0.5 Development Environment
- [ ] Instaliraj Node.js 20.x (https://nodejs.org)
- [ ] Proveri: `node --version` (treba biti v20.x.x)
- [ ] Instaliraj VS Code (https://code.visualstudio.com)
- [ ] VS Code Extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features
  - Auto Rename Tag
  - ES7+ React/Redux/React-Native snippets

#### 0.6 Kloniraj Repository
- [ ] Otvori terminal
- [ ] Kloniraj repo:
```bash
git clone https://github.com/USERNAME/4sports-monorepo.git
cd 4sports-monorepo
```

---

### PHASE 1: Inicijalizacija Web Projekta (6-8 sati)

**Cilj:** Setup React + Vite projekat sa svim dependencies.

#### 1.1 Kreiraj Vite Projekat
- [ ] Otvori terminal u root folderu
- [ ] Pokreni: `npm create vite@latest web-admin -- --template react-ts`
- [ ] Ili: idi u web-admin i run `npm create vite@latest . -- --template react-ts`
- [ ] Idi u web-admin folder: `cd web-admin`
- [ ] Instaliraj dependencies: `npm install`

#### 1.2 Instaliraj Core Dependencies
- [ ] React Router: `npm install react-router-dom`
- [ ] TanStack Query: `npm install @tanstack/react-query`
- [ ] Axios: `npm install axios`
- [ ] Firebase: `npm install firebase`

#### 1.3 Setup TailwindCSS
- [ ] Instaliraj: `npm install -D tailwindcss postcss autoprefixer`
- [ ] Inicijalizuj: `npx tailwindcss init -p`
- [ ] Konfiguriši `tailwind.config.js`:
  - Dodaj content paths: `"./index.html", "./src/**/*.{js,ts,jsx,tsx}"`
  - Dodaj custom colors (Dark mode: #121212, Primary green: #00E676)
- [ ] Dodaj Tailwind directives u `src/index.css`

#### 1.4 Setup shadcn/ui
- [ ] Pokreni: `npx shadcn-ui@latest init`
- [ ] Odaberi:
  - TypeScript: Yes
  - Style: Default
  - Base color: Slate
  - CSS variables: Yes
  - Config path: Accept default
- [ ] Instalacija će kreirati `components/ui/` folder

#### 1.5 Instaliraj shadcn Komponente (Osnovne)
- [ ] Button: `npx shadcn-ui@latest add button`
- [ ] Card: `npx shadcn-ui@latest add card`
- [ ] Input: `npx shadcn-ui@latest add input`
- [ ] Table: `npx shadcn-ui@latest add table`
- [ ] Dialog: `npx shadcn-ui@latest add dialog`
- [ ] Select: `npx shadcn-ui@latest add select`
- [ ] Form: `npx shadcn-ui@latest add form`
- [ ] Label: `npx shadcn-ui@latest add label`
- [ ] Badge: `npx shadcn-ui@latest add badge`
- [ ] Dropdown Menu: `npx shadcn-ui@latest add dropdown-menu`

#### 1.6 Instaliraj Recharts (Za Grafikone)
- [ ] `npm install recharts`
- [ ] `npm install @types/recharts -D` (ako treba)

#### 1.7 Instaliraj Icons
- [ ] Lucide React: `npm install lucide-react`

#### 1.8 Kreiraj Folder Strukturu
- [ ] Napravi foldere u `src/`:
  - `assets/` - Slike, logotipi
  - `components/ui/` - shadcn komponente (već kreiran)
  - `components/charts/` - Chart komponente
  - `components/layout/` - Layout komponente (Sidebar, Header)
  - `components/shared/` - Reusable komponente
  - `features/` - Feature-based moduli
    - `features/auth/` - Login/Register
    - `features/dashboard/` - Dashboard stranica
    - `features/members/` - Članovi
    - `features/coaches/` - Treneri
    - `features/finances/` - Finansije
    - `features/settings/` - Podešavanja
  - `hooks/` - Custom React hooks
  - `lib/` - Utilities i konfiguracije
  - `services/` - API calls
  - `types/` - TypeScript type definitions
  - `config/` - App konfiguracija

#### 1.9 Setup Environment Variables
- [ ] Kreiraj `web-admin/.env` fajl
- [ ] Dodaj Firebase config i API URL
- [ ] Kreiraj `web-admin/.env.example` template
- [ ] Upload .env sadržaj na Google Drive
- [ ] **Proveri da je `.env` u .gitignore**

#### 1.10 Test Development Server
- [ ] Run: `npm run dev`
- [ ] Otvori browser: `http://localhost:5173`
- [ ] Proveri da Vite app radi
- [ ] **Commit:** `web: setup react vite project with tailwind and shadcn`

---

### PHASE 2: Firebase Auth Integration (8-10 sati)

**Cilj:** Implementiraj login i registration sa Firebase.

#### 2.1 Firebase Config
- [ ] Napravi `src/config/firebase.ts`
- [ ] Import Firebase modules (auth, storage)
- [ ] Inicijalizuj Firebase app sa config iz .env
- [ ] Export `auth` i `storage` instance

#### 2.2 Auth Service
- [ ] Napravi `src/services/auth.ts`
- [ ] Implementiraj funkcije:
  - `registerWithEmail(email, password)` - Firebase createUserWithEmailAndPassword
  - `loginWithEmail(email, password)` - Firebase signInWithEmailAndPassword
  - `logout()` - Firebase signOut
  - `getCurrentUser()` - Firebase currentUser
  - `getIdToken()` - Get Firebase ID token za backend

#### 2.3 API Service (Axios Setup)
- [ ] Napravi `src/services/api.ts`
- [ ] Kreiraj Axios instance sa baseURL iz .env
- [ ] Dodaj request interceptor:
  - Automatski dodaj Firebase ID token u Authorization header
- [ ] Dodaj response interceptor:
  - Handle 401 (redirect na login)
  - Handle 403, 500 errors
- [ ] Export API instance

#### 2.4 Auth Context (React Context)
- [ ] Napravi `src/features/auth/AuthContext.tsx`
- [ ] Kreiraj AuthContext i AuthProvider
- [ ] State: user, loading, error
- [ ] Functions: login, register, logout
- [ ] useEffect: Firebase onAuthStateChanged listener
- [ ] Export `useAuth` hook

#### 2.5 Login Page
- [ ] Napravi `src/features/auth/LoginPage.tsx`
- [ ] Form komponenta sa:
  - Email input
  - Password input
  - Login button
  - Link ka Register page
- [ ] Koristi shadcn/ui komponente (Input, Button, Card)
- [ ] Validacija (email format, password min length)
- [ ] Error handling i prikaz
- [ ] Loading state tokom login-a
- [ ] OnSuccess: redirect na dashboard

#### 2.6 Register Page
- [ ] Napravi `src/features/auth/RegisterPage.tsx`
- [ ] Form sa poljima:
  - Email
  - Password
  - Confirm Password
  - Full Name
  - Phone Number
  - Invite Code (optional za OWNER)
- [ ] Validacija
- [ ] Pozovi backend API `/api/v1/auth/register` nakon Firebase registracije
- [ ] Error handling
- [ ] OnSuccess: redirect na dashboard

#### 2.7 Protected Route Component
- [ ] Napravi `src/components/ProtectedRoute.tsx`
- [ ] Check da li je user authenticated
- [ ] Ako nije, redirect na /login
- [ ] Loading spinner dok se proverava auth status

#### 2.8 Router Setup
- [ ] Napravi `src/App.tsx` sa React Router
- [ ] Routes:
  - `/login` → LoginPage
  - `/register` → RegisterPage
  - `/` → ProtectedRoute → Dashboard (placeholder za sada)
  - `*` → 404 Not Found
- [ ] Wrap app sa AuthProvider

#### 2.9 Test Authentication
- [ ] Run dev server
- [ ] Testiraj register flow
- [ ] Testiraj login flow
- [ ] Testiraj logout
- [ ] Testiraj protected route redirect
- [ ] **Commit:** `web: implement firebase authentication`

---

### PHASE 3: Layout & Navigation (6-8 sati)

**Cilj:** Kreiraj dashboard layout sa sidebar navigacijom.

#### 3.1 Layout Component
- [ ] Napravi `src/components/layout/Layout.tsx`
- [ ] Struktura:
  - Sidebar (levo)
  - Main content area (desno)
  - Responsive: Collapsed sidebar na mobile

#### 3.2 Sidebar Component
- [ ] Napravi `src/components/layout/Sidebar.tsx`
- [ ] Logo/Club name na vrhu
- [ ] Navigation links:
  - Dashboard
  - Members (Članovi)
  - Coaches (Treneri)
  - Finances (Finansije)
  - Settings (Podešavanja)
- [ ] Active state styling
- [ ] Collapse/Expand funkcionalnost
- [ ] Logout dugme na dnu

#### 3.3 Header Component
- [ ] Napravi `src/components/layout/Header.tsx`
- [ ] Breadcrumbs
- [ ] User profile dropdown (menu sa logout opcijom)
- [ ] Notifications icon (placeholder)

#### 3.4 Update Routes
- [ ] Wrap dashboard routes sa Layout komponentom
- [ ] Test navigaciju između stranica
- [ ] **Commit:** `web: add dashboard layout with sidebar`

---

### PHASE 4: Dashboard KPI Cards (10-12 sati)

**Cilj:** Kreiraj dashboard sa KPI metrikama.

#### 4.1 API Hook Za Dashboard Data
- [ ] Napravi `src/features/dashboard/useDashboard.ts`
- [ ] Koristi React Query:
  - `useQuery` za fetch dashboard stats
  - API endpoint: `GET /clubs/:clubId/dashboard`
- [ ] Return KPIs, charts data, loading, error states

#### 4.2 KPI Card Component
- [ ] Napravi `src/features/dashboard/KPICard.tsx`
- [ ] Props: title, value, icon, trend (+/-), color
- [ ] Design:
  - Dark background (#1E1E1E)
  - Icon u kružnom pozadini (green)
  - Veliki broj (32px)
  - Label ispod
  - Trend indicator (strelica gore/dole)

#### 4.3 Dashboard Page
- [ ] Napravi `src/features/dashboard/Dashboard.tsx`
- [ ] Fetch data sa `useDashboard` hook-om
- [ ] Grid layout (4 KPI cards):
  - Current Revenue
  - New Members %
  - Total Members
  - Total Transactions
- [ ] Loading skeleton dok se data učitava
- [ ] Error state ako API fail-uje

#### 4.4 Loading Skeletons
- [ ] Napravi `src/components/shared/SkeletonCard.tsx`
- [ ] Shimmer animacija
- [ ] Isti size kao KPI card

#### 4.5 Error Component
- [ ] Napravi `src/components/shared/ErrorMessage.tsx`
- [ ] Display error message
- [ ] Retry button

#### 4.6 Test Dashboard
- [ ] Mock API response (ako backend nije gotov)
- [ ] Test sa pravim backend API (koordinacija sa Nemanjom)
- [ ] Test responsive design
- [ ] **Commit:** `web: add dashboard KPI cards`

---

### PHASE 5: Charts & Data Visualization (12-14 sati)

**Cilj:** Dodaj Recharts grafikone na dashboard.

#### 5.1 Line Chart - Member Growth
- [ ] Napravi `src/components/charts/MemberGrowthChart.tsx`
- [ ] Koristi Recharts `LineChart`
- [ ] Data: Member count po mesecima
- [ ] X-axis: Meseci
- [ ] Y-axis: Broj članova
- [ ] Tooltip sa detaljima
- [ ] Green color (#00E676)
- [ ] Responsive width

#### 5.2 Donut Chart - Balance (Income vs Expense)
- [ ] Napravi `src/components/charts/BalanceChart.tsx`
- [ ] Koristi Recharts `PieChart` sa innerRadius (donut)
- [ ] Data: Income i Expense
- [ ] Colors: Green za income, Red za expense
- [ ] Legend
- [ ] Tooltip sa percentages

#### 5.3 Pie Chart - Revenue by Quarter
- [ ] Napravi `src/components/charts/RevenueByQuarterChart.tsx`
- [ ] Recharts `PieChart`
- [ ] Data: Q1, Q2, Q3, Q4
- [ ] Different colors za svaki quarter
- [ ] Labels sa amounts

#### 5.4 Bar Chart - Monthly Revenue & Expenses
- [ ] Napravi `src/components/charts/MonthlyFinanceChart.tsx`
- [ ] Recharts `BarChart`
- [ ] Grouped bars: Revenue i Expenses
- [ ] X-axis: Meseci
- [ ] Y-axis: Amount
- [ ] Legend
- [ ] Tooltip

#### 5.5 Update Dashboard Sa Charts
- [ ] Dodaj charts ispod KPI cards
- [ ] Grid layout: 2 columns
- [ ] Svaki chart u Card komponenti
- [ ] Titles za svaki chart

#### 5.6 Chart Responsive Design
- [ ] Test na mobile (charts trebaju biti scrollable ili stacked)
- [ ] Test na tablet
- [ ] Test na desktop (wide screen)

#### 5.7 Empty State (Ako Nema Data)
- [ ] Napravi `src/components/shared/EmptyState.tsx`
- [ ] Icon, message, action button
- [ ] Display ako nema podataka za chart

#### 5.8 Test Charts
- [ ] Test sa mock data
- [ ] Test sa pravim API data
- [ ] Test edge cases (0 data, very large numbers)
- [ ] **Commit:** `web: add recharts data visualization`

---

### PHASE 6: Members Management (14-16 sati) ✅ COMPLETED

**Cilj:** CRUD operacije za članove kluba.

#### 6.1 Members API Hooks
- [x] Napravi `src/features/members/useMembers.ts`
- [x] `useQuery` za fetch members list
- [x] `useMutation` za create member
- [x] `useMutation` za update member
- [x] `useMutation` za delete member
- [x] Filter i search functionality

#### 6.2 Members List Page
- [x] Napravi `src/features/members/MemberListPage.tsx`
- [x] shadcn/ui Table komponenta
- [x] Columns:
  - Avatar/Profile image
  - Full Name
  - Age
  - Group
  - Payment Status (badge: green/red)
  - Medical Status (badge: green/red)
  - Actions (Edit, Delete buttons)
- [x] Search input (search by name)
- [x] Filters:
  - Payment Status (All, Paid, Unpaid)
  - Medical Status (All, Valid, Expired)
  - Group filter
- [ ] Pagination (ako ima mnogo članova) - SKIPPED FOR NOW

#### 6.3 Member Status Badges
- [x] Napravi `src/components/shared/StatusBadge.tsx`
- [x] Props: status (PAID/UNPAID, VALID/EXPIRED), type
- [x] Colors:
  - PAID / VALID → Green badge
  - UNPAID / EXPIRED → Red badge
- [x] Uppercase text, rounded corners

#### 6.4 Add Member Dialog
- [x] Napravi `src/features/members/AddMemberDialog.tsx`
- [x] shadcn/ui Dialog komponenta
- [x] Form fields:
  - Full Name
  - Date of Birth
  - Group (select dropdown)
  - Parent (select dropdown - list of parents)
  - Gender (select)
  - Height, Weight (optional)
  - Position (optional)
- [x] Validacija
- [x] OnSubmit: Call API to create member
- [x] Success: Refresh members list
- [x] Error handling

#### 6.5 Edit Member Dialog
- [x] Napravi `src/features/members/EditMemberDialog.tsx`
- [x] Slično kao Add, ali prefilled sa postojećim data
- [x] Update API call

#### 6.6 Delete Confirmation Dialog
- [x] Napravi `src/components/shared/ConfirmDialog.tsx`
- [x] Reusable confirm dialog
- [x] Props: title, message, onConfirm, onCancel
- [x] Danger styling za delete akcije

#### 6.7 Member Details Page (Optional - Ako Ima Vremena)
- [ ] `/members/:memberId` - SKIPPED (Optional)
- [ ] Prikaz svih detalja člana
- [ ] QR kod display
- [ ] Attendance history
- [ ] Payment history
- [ ] Medical history

#### 6.8 Test Members CRUD
- [x] Test add member
- [x] Test edit member
- [x] Test delete member
- [x] Test filters i search
- [ ] Test pagination - SKIPPED
- [x] **Commit:** `web: implement members management`

---

### PHASE 7: Coaches & Contracts (8-10 sati) ✅ COMPLETED

**Cilj:** Upravljanje trenerima i njihovim ugovorima.

#### 7.1 Coaches API Hooks
- [x] Napravi `src/features/coaches/useCoaches.ts`
- [x] Fetch coaches list
- [x] Create/Update/Delete mutations

#### 7.2 Coaches List Page
- [x] Napravi `src/features/coaches/CoachListPage.tsx`
- [x] Table sa kolonama:
  - Name
  - Email
  - Phone
  - Groups (broj grupa koje vodi)
  - Contract Expiry Date
  - Actions
- [x] Add Coach button (generate invite code)

#### 7.3 Generate Coach Invite Code Dialog
- [x] Napravi `src/features/coaches/GenerateInviteDialog.tsx`
- [x] Button: Generate Invite Code
- [x] API call: `POST /invites/generate` (type: COACH)
- [x] Display generisan kod
- [x] Copy to clipboard button
- [ ] Share via email option (optional) - SKIPPED

#### 7.4 Contract Management
- [x] U Coaches table dodaj kolonu "Contract Expiry"
- [x] Warning badge ako expires uskoro (30 dana)
- [x] Edit contract dialog (update expiry date) - Implemented in API hooks

#### 7.5 Test Coaches
- [x] Test lista trenera
- [x] Test generate invite kod
- [x] Test contract expiry warnings
- [x] **Commit:** `web: add coaches and contracts management`

---

### PHASE 8: Finances (10-12 sati) ✅ COMPLETED

**Cilj:** Pregled finansija i manuelni unos prihoda/rashoda.

#### 8.1 Finances API Hooks
- [x] Napravi `src/features/finances/useFinances.ts`
- [x] Fetch all finance entries
- [x] Fetch summary stats
- [x] Create/Update/Delete mutations

#### 8.2 Finance Overview Page
- [x] Napravi `src/features/finances/FinancePage.tsx`
- [x] Top section:
  - Total Income (current month)
  - Total Expenses (current month)
  - Net Profit/Loss
- [x] Tabs:
  - All Transactions
  - Membership Payments (auto-generated)
  - Manual Entries (income/expense owner dodaje)

#### 8.3 Transactions Table
- [x] Table sa svim transakcijama
- [x] Columns:
  - Date
  - Type (Income/Expense)
  - Category
  - Description
  - Amount
  - Recorded By
  - Actions (Edit/Delete - samo za manual entries)
- [x] Filters:
  - Type (All, Income, Expense)
  - Date range - SKIPPED (implementiran samo Type filter)
  - Category - SKIPPED

#### 8.4 Add Manual Finance Entry Dialog
- [x] Napravi `src/features/finances/AddFinanceDialog.tsx`
- [x] Form:
  - Type (Income / Expense)
  - Category (Equipment, Rent, Salary, Other)
  - Amount
  - Description
  - Date
  - Upload Invoice (optional - file upload) - SKIPPED
- [x] API call: Create finance entry

#### 8.5 Financial Summary Charts
- [x] Reuse charts from dashboard
- [x] Monthly trends
- [x] Category breakdown (pie chart)

#### 8.6 Test Finances
- [x] Test add income/expense
- [x] Test filters
- [x] Test summary calculations
- [x] **Commit:** `web: implement finances overview`

---

### PHASE 9: Settings & Club Management (6-8 sati)

**Cilj:** Podešavanja kluba i korisničkog profila.

#### 9.1 Settings Page
- [ ] Napravi `src/features/settings/SettingsPage.tsx`
- [ ] Tabs:
  - Club Settings
  - My Profile
  - Subscription (display current plan, member limit)

#### 9.2 Club Settings Tab
- [ ] Form za update club info:
  - Club Name
  - Address
  - Phone Number
  - Email
- [ ] Save button
- [ ] API call: Update club

#### 9.3 My Profile Tab
- [ ] Form za update user profile:
  - Full Name
  - Phone Number
  - Email (read-only)
  - Profile Image (upload)
- [ ] Change Password button (Firebase password reset)

#### 9.4 Subscription Tab
- [ ] Display trenutni plan (FREE, BASIC, PRO)
- [ ] Display member limit
- [ ] Display current members count
- [ ] Upgrade button (placeholder - future feature)

#### 9.5 Test Settings
- [ ] Test update club
- [ ] Test update profile
- [ ] Test profile image upload
- [ ] **Commit:** `web: add settings and club management`

---

### PHASE 10: Search & Filters (4-6 sati)

**Cilj:** Global search i napredni filteri.

#### 10.1 Global Search Component
- [ ] Napravi `src/components/shared/GlobalSearch.tsx`
- [ ] Search input u Header-u
- [ ] Search across members, coaches, groups
- [ ] Dropdown sa results
- [ ] Navigate on click

#### 10.2 Advanced Filters
- [ ] Za svaku list page (members, coaches), dodaj advanced filters
- [ ] Filter panel (collapsible)
- [ ] Multiple filter criteria
- [ ] Clear filters button

#### 10.3 Test Search
- [ ] Test search functionality
- [ ] Test filters
- [ ] **Commit:** `web: add global search and advanced filters`

---

### PHASE 11: Responsive Design & Mobile (8-10 sati)

**Cilj:** Optimizuj web app za tablet i mobile.

#### 11.1 Mobile Sidebar
- [ ] Sidebar collapse na mobile
- [ ] Hamburger menu button
- [ ] Overlay kad je sidebar otvoren
- [ ] Close on navigation

#### 11.2 Responsive Tables
- [ ] Tables scrollable na mobile
- [ ] Ili: Card view umesto table na mobile
- [ ] Test na različitim screen sizes

#### 11.3 Responsive Charts
- [ ] Charts stack vertically na mobile
- [ ] Reduce padding/margins na mobile
- [ ] Smaller font sizes

#### 11.4 Touch Interactions
- [ ] Larger touch targets (buttons minimum 44px)
- [ ] Swipe gestures (optional)

#### 11.5 Test Responsive Design
- [ ] Test na Chrome DevTools (responsive mode)
- [ ] Test na pravom mobile device
- [ ] Test na tablet
- [ ] **Commit:** `web: optimize responsive design for mobile`


---

### PHASE 12: Loading States & UX Polish (6-8 sati)

**Cilj:** Poboljšaj user experience.

#### 12.1 Loading StatesS
- [ ] Skeleton loaders za sve list pages
- [ ] Spinner za button actions
- [ ] Progress bar za file uploads
- [ ] Disable buttons tokom loading-a

#### 12.2 Toast Notifications
- [ ] Install toast library (npr. sonner ili react-hot-toast)
- [ ] Success toast na successful actions
- [ ] Error toast na errors
- [ ] Info toast za warnings

#### 12.3 Form Validation UX
- [ ] Real-time validation
- [ ] Error messages ispod input fields
- [ ] Highlight invalid fields
- [ ] Disable submit dok forma nije validna

#### 12.4 Animations
- [ ] Smooth transitions (fade in/out)
- [ ] Modal open/close animations
- [ ] Page transitions
- [ ] Hover effects

#### 12.5 Empty States
- [ ] Empty state za sve liste (kad nema podataka)
- [ ] Friendly message + ilustracija
- [ ] Call-to-action button (npr. "Add First Member")

#### 12.6 Test UX
- [ ] Test user flows
- [ ] Test error handling
- [ ] Test loading states
- [ ] **Commit:** `web: improve loading states and UX`

---

### PHASE 13: Testing & Bug Fixes (20-30 sati)

**Cilj:** Kompletno testiranje web app-a.

#### 13.1 Manual Testing Checklist
- [ ] **Authentication:**
  - Register kao OWNER
  - Login/Logout
  - Protected routes redirect
- [ ] **Dashboard:**
  - KPI cards display correctly
  - Charts render sa pravim data
  - Responsive na mobile
- [ ] **Members:**
  - List members
  - Add member
  - Edit member
  - Delete member
  - Filters work
  - Search works
  - Pagination works
- [ ] **Coaches:**
  - List coaches
  - Generate invite code
  - Contract warnings
- [ ] **Finances:**
  - List transactions
  - Add income/expense
  - Filters work
  - Summary calculations correct
- [ ] **Settings:**
  - Update club info
  - Update profile
  - Upload profile image

#### 13.2 Browser Testing
- [ ] Test na Chrome
- [ ] Test na Firefox
- [ ] Test na Safari (ako imaš Mac)
- [ ] Test na Edge

#### 13.3 Device Testing
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (iPad)
- [ ] Mobile (iPhone, Android)

#### 13.4 Performance Testing
- [ ] Check page load times
- [ ] Check bundle size (`npm run build`)
- [ ] Optimize images ako su velike
- [ ] Lazy load components ako treba

#### 13.5 Accessibility Testing
- [ ] Keyboard navigation
- [ ] Screen reader (optional)
- [ ] Color contrast (proveri sa WCAG tool)
- [ ] Focus states

#### 13.6 Bug Tracking
- [ ] Napravi listu svih bugova (Google Sheet ili GitHub Issues)
- [ ] Prioritizuj (Critical, High, Medium, Low)
- [ ] Fixi Critical i High bugs
- [ ] **Commit:** `web: fix [bug description]` za svaki bug

#### 13.7 Integration Testing Sa Backend-om
- [ ] Koordiniraj se sa Nemanjom
- [ ] Test all API endpoints
- [ ] Test error responses
- [ ] Test edge cases (empty data, large data)

---

### PHASE 14: Documentation & Code Cleanup (4-6 sati)

**Cilj:** Dokumentuj kod i očisti projekat.

#### 14.1 Component Documentation
- [ ] Dodaj JSDoc comments na komponente
- [ ] Dokumentuj props sa TypeScript interfaces
- [ ] Dodaj usage examples u komentarima

#### 14.2 README za Web Admin
- [ ] Napravi `web-admin/README.md`
- [ ] Setup instrukcije
- [ ] Environment variables
- [ ] Development workflow
- [ ] Build i deployment

#### 14.3 Code Cleanup
- [ ] Remove unused imports
- [ ] Remove console.log()
- [ ] Remove commented code
- [ ] Format kod sa Prettier
- [ ] Run ESLint i fixi warnings
- [ ] **Commit:** `web: add documentation and cleanup code`

---

### PHASE 15: Deployment na Vercel (6-8 sati)

**Cilj:** Deploy web app na Vercel production.

#### 15.1 Build Test (Lokalno)
- [ ] Run `npm run build`
- [ ] Proveri da nema errors
- [ ] Proveri `dist/` folder
- [ ] Test production build lokalno: `npm run preview`

#### 15.2 Environment Variables Preparation
- [ ] Pripremi production ENV variables:
  - `VITE_API_URL` → Production backend URL (od Nemanje)
  - Firebase config (isti kao development)
- [ ] Upload na Google Drive

#### 15.3 Vercel Deployment
- [ ] Idi na https://vercel.com/dashboard
- [ ] Klikni "Add New..." → "Project"
- [ ] Import GitHub repository `4sports-monorepo`
- [ ] Configure project:
  - **Framework Preset:** Vite
  - **Root Directory:** `web-admin`
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`
  - **Install Command:** `npm install`

#### 15.4 Add Environment Variables
- [ ] U Vercel project settings → Environment Variables
- [ ] Dodaj sve ENV variables:
  - VITE_FIREBASE_API_KEY
  - VITE_FIREBASE_AUTH_DOMAIN
  - VITE_FIREBASE_PROJECT_ID
  - VITE_FIREBASE_STORAGE_BUCKET
  - VITE_FIREBASE_MESSAGING_SENDER_ID
  - VITE_FIREBASE_APP_ID
  - VITE_API_URL (production backend URL)
- [ ] Klikni "Add" za svaki

#### 15.5 Deploy
- [ ] Klikni "Deploy"
- [ ] Sačekaj build (2-5 minuta)
- [ ] Proveri logs
- [ ] Kopiraj production URL (npr. `https://4sports-admin.vercel.app`)

#### 15.6 Test Production Web App
- [ ] Otvori production URL u browser-u
- [ ] Test login/register
- [ ] Test dashboard load
- [ ] Test API calls (da li rade sa production backend-om)
- [ ] Test responsive design
- [ ] **Obavesti tim:** Pošalji production URL Nemanju i Mihajlu

#### 15.7 Setup Custom Domain (Optional)
- [ ] Ako imaš domen, dodaj ga u Vercel
- [ ] Settings → Domains → Add
- [ ] Update DNS records

#### 15.8 Continuous Deployment
- [ ] Vercel automatically redeploy-uje kad push-uješ na main
- [ ] Test: Napravi malu izmenu, push, proveri da li auto-deploy radi

#### 15.9 Monitor & Debug
- [ ] Proveri Vercel Analytics
- [ ] Proveri Console logs u browser-u (production)
- [ ] Fix production-only bugs ako ih ima
- [ ] **Commit:** `web: deploy to vercel production`

---

## 🧪 TESTIRANJE

### Browser DevTools
- [ ] Network tab - proveri API calls
- [ ] Console - proveri errors
- [ ] Elements - proveri responsive
- [ ] Lighthouse - performance score

### Manual Testing
- [ ] Test svi user flows (login → dashboard → members → etc)
- [ ] Test sa različitim user rolama (OWNER only za web)
- [ ] Test error states
- [ ] Test empty states

---

## 📞 KOORDINACIJA SA TIMOM

### Kada Pozovati Nemanju (Backend Developer):
- [ ] Kada API endpoint ne vraća očekivane podatke
- [ ] Kada dobijaš 500 server errors
- [ ] Kada CORS errors se javljaju
- [ ] Kada backend format data ne odgovara tvom frontend-u
- [ ] Kada trebaš novi API endpoint
- [ ] **NIKAD ne menjaj backend kod** - uvek komuniciraj

### Kada Pozovati Mihajla (Mobile Developer):
- [ ] Kada trebaš da koordinišeš dizajn sistem (colors, typography)
- [ ] Kada mobile app ima probleme sa API-jem koje ti ne vidiš na web-u
- [ ] **NIKAD ne menjaj mobile kod** - to je njegov deo

### Daily Standup (Preporučeno):
- [ ] Šta si juče uradio
- [ ] Šta planiraš danas
- [ ] Ima li blocker-a

### Code Review:
- [ ] Pull requests review-uju Nemanja i Mihajlo
- [ ] Ne merge-uj sam dok neko ne approve
- [ ] Review njihove web-related PR-ove

---

## 🎯 DEFINITION OF DONE

### Feature je Gotov Kada:
- ✅ UI komponenta je kreirana i stilizovana
- ✅ API integracija radi (ili mock data dok Nemanja ne završi)
- ✅ Responsive design je testiran
- ✅ Loading i error states su implementirani
- ✅ Validacija forme radi
- ✅ Browser console nema errors
- ✅ Commit je pushed na GitHub
- ✅ Pull Request je kreiran
- ✅ Code review je done
- ✅ Merged u main branch
- ✅ Testirano na deployment (Vercel preview)

---

## ✅ CHECKLIST PRE DEPLOYMENT

- [ ] Sve stranice rade lokalno
- [ ] API calls rade sa production backend URL-om
- [ ] ENV fajlovi su na Google Drive
- [ ] `.env` NIJE na Git-u
- [ ] Build prolazi bez errors (`npm run build`)
- [ ] Nema TypeScript errors
- [ ] Nema ESLint warnings (critical ones)
- [ ] Responsive design testiran
- [ ] Vercel account je setup
- [ ] ENV variables su dodati na Vercel
- [ ] Deploy je uspešan
- [ ] Production site je testiran
- [ ] Tim je obavešten o production URL-u

---

## 🚀 SUCCESS CRITERIA

### Web Admin je Završen Kada:
1. ✅ Owner može da se login-uje
2. ✅ Dashboard prikazuje KPI kartice
3. ✅ Grafikoni se renderuju sa pravim data
4. ✅ Owner može da vidi listu članova
5. ✅ Owner može da doda/edit/delete članova
6. ✅ Owner može da generiše COACH invite kod
7. ✅ Owner može da vidi listu trenera
8. ✅ Owner može da vidi sve finansije (payments + manual entries)
9. ✅ Owner može da doda manuelni income/expense
10. ✅ Owner može da update-uje club settings
11. ✅ Owner može da update-uje svoj profil
12. ✅ Search i filters rade
13. ✅ Responsive design radi na mobile/tablet
14. ✅ Loading states rade
15. ✅ Error handling radi
16. ✅ App je deployed na Vercel
17. ✅ Production app radi sa production backend-om
18. ✅ Sve je testirano i stabilno

---

## 📁 FINALNA STRUKTURA WEB-ADMIN FOLDERA

```
web-admin/
├── public/
│   └── logo.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── charts/                # Chart components
│   │   │   ├── MemberGrowthChart.tsx
│   │   │   ├── BalanceChart.tsx
│   │   │   ├── RevenueByQuarterChart.tsx
│   │   │   └── MonthlyFinanceChart.tsx
│   │   ├── layout/
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   └── shared/
│   │       ├── StatusBadge.tsx
│   │       ├── SkeletonCard.tsx
│   │       ├── ErrorMessage.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── GlobalSearch.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── KPICard.tsx
│   │   │   └── useDashboard.ts
│   │   ├── members/
│   │   │   ├── MemberListPage.tsx
│   │   │   ├── AddMemberDialog.tsx
│   │   │   ├── EditMemberDialog.tsx
│   │   │   └── useMembers.ts
│   │   ├── coaches/
│   │   │   ├── CoachListPage.tsx
│   │   │   ├── GenerateInviteDialog.tsx
│   │   │   └── useCoaches.ts
│   │   ├── finances/
│   │   │   ├── FinancePage.tsx
│   │   │   ├── AddFinanceDialog.tsx
│   │   │   └── useFinances.ts
│   │   └── settings/
│   │       ├── SettingsPage.tsx
│   │       └── useSettings.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useToast.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── services/
│   │   ├── api.ts
│   │   └── auth.ts
│   ├── types/
│   │   └── index.ts
│   ├── config/
│   │   └── firebase.ts
│   ├── App.tsx
│   └── main.tsx
├── .env (lokalno, Google Drive, NIKAD Git)
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

**Srećno sa razvojem, Vukašine! Web admin je lice aplikacije - sve se vidi tu! 💪🎨**

**Ako se zaglaviš, prvo proveri dokumentaciju, zatim pitaj tim. Nikad ne menjaj backend ili mobile kod!**

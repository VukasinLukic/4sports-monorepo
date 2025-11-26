# 4SPORTS — TEAM IMPLEMENTATION PLAN

**Verzija:** 2.0 (Team Edition)
**Team Size:** 3 Developers
**Estimated Timeline:** 10-14 nedelja (Paralelni development)
**Status:** Ready to Execute

---

## 👥 TIM STRUKTURA

### Nemanja - Backend Developer
**Odgovornost:** `backend/` folder
- Node.js + Express API
- MongoDB modeli i schemas
- Firebase Admin SDK
- API endpoints
- Cron jobs
- Backend deployment (Render)

**Vidi:** [IMPLEMENTATION_PLAN_NEMANJA.md](IMPLEMENTATION_PLAN_NEMANJA.md)

### Vukašin - Web Admin Developer
**Odgovornost:** `web-admin/` folder
- React + TypeScript
- Admin dashboard
- TailwindCSS + shadcn/ui
- Recharts grafikoni
- Firebase Auth (frontend)
- Web deployment (Vercel)

**Vidi:** [IMPLEMENTATION_PLAN_VUKASIN.md](IMPLEMENTATION_PLAN_VUKASIN.md)

### Mihajlo - Mobile App Developer
**Odgovornost:** `mobile-app/` folder
- React Native + Expo
- QR kod scanning i generation
- Push notifications
- Calendar i events
- Firebase Auth (mobile)
- Mobile build (EAS)

**Vidi:** [IMPLEMENTATION_PLAN_MIHAJLO.md](IMPLEMENTATION_PLAN_MIHAJLO.md)

---

## 🎯 TEAM GOALS

### Phase 1: Foundation (Week 1-2)
**Cilj:** Setup external services i inicijalizuj sve 3 projekta.

**Koordinacija:**
- [ ] **SVI:** Kreiranje Firebase projekta (jedna osoba, deli sa ostalima)
- [ ] **Nemanja:** MongoDB Atlas setup
- [ ] **Nemanja:** Backend initialization
- [ ] **Vukašin:** Web admin initialization
- [ ] **Mihajlo:** Mobile app initialization
- [ ] **SVI:** GitHub repository i branch strategy dogovor
- [ ] **SVI:** ENV fajlovi na Google Drive

**Deliverables:**
- ✅ Backend server radi lokalno
- ✅ Web app radi lokalno
- ✅ Mobile app radi na Expo Go
- ✅ Svi mogu da commituju na GitHub

---

### Phase 2: Authentication (Week 2-3)
**Cilj:** Implementiraj Firebase auth na svim platformama.

**Paralelno:**
- [ ] **Nemanja:** Auth endpoints (register, login) + User/Club models
- [ ] **Vukašin:** Login/Register screens sa Firebase
- [ ] **Mihajlo:** Login/Register screens sa Firebase

**Sync Points:**
- [ ] Backend API ready → Vukašin i Mihajlo testiraju
- [ ] Firebase config deljenje (svi koriste isti projekat)

**Deliverables:**
- ✅ Backend auth API radi
- ✅ Web login/register radi
- ✅ Mobile login/register radi

---

### Phase 3: Core Features (Week 3-6)
**Cilj:** Invite system, Groups, Members.

**Paralelno:**
- [ ] **Nemanja:**
  - Invite code generation i validation
  - Group i Member models
  - QR kod generation (backend)
  - Member CRUD endpoints
- [ ] **Vukašin:**
  - Generate invite code UI
  - Member list table
  - Add/Edit member forms
- [ ] **Mihajlo:**
  - Invite code input screen
  - Member list (coach)
  - QR kod display (parent)

**Sync Points:**
- [ ] Nemanja završi invite API → Vukašin i Mihajlo integrišu
- [ ] Nemanja završi member API → Vukašin i Mihajlo testiraju
- [ ] QR format dogovor (svi moraju da koriste isti)

**Deliverables:**
- ✅ Invite code system radi end-to-end
- ✅ Members se mogu kreirati sa svih platformi
- ✅ QR kodovi se generišu

---

### Phase 4: Events & Attendance (Week 6-8)
**Cilj:** Kalendar, događaji, QR scanning za prisustvo.

**Paralelno:**
- [ ] **Nemanja:**
  - Event i Attendance models
  - Event CRUD endpoints
  - Attendance QR scan endpoint
  - Attendance manual endpoint
- [ ] **Vukašin:**
  - Kalendar view (read-only za owner)
  - Event lista (optional - ako owner vidi)
- [ ] **Mihajlo:**
  - Kalendar sa događajima
  - Create event (coach)
  - QR scanner (camera + API call)
  - Manual attendance

**Sync Points:**
- [ ] QR scan flow testiranje end-to-end (Mihajlo skenira → Nemanja procesira)
- [ ] Kalendar data format dogovor

**Deliverables:**
- ✅ Coach može da kreira događaj
- ✅ Coach može da skenira QR za attendance
- ✅ Parent vidi kalendar događaja

---

### Phase 5: Payments & Medical (Week 8-9)
**Cilj:** Evidencija plaćanja i lekarskih pregleda.

**Paralelno:**
- [ ] **Nemanja:**
  - Payment i MedicalCheck models
  - CRUD endpoints
  - Auto-reset logika (payment status)
  - Auto-expiry logika (medical status)
- [ ] **Vukašin:**
  - Payment list table
  - Manual finance entry (income/expense)
  - Dashboard KPI kartice
- [ ] **Mihajlo:**
  - Record payment screen (coach)
  - Record medical screen (coach)
  - Payment/Medical status display (parent)

**Sync Points:**
- [ ] Status update logika testiranje (Mihajlo evidentira → Status se menja)

**Deliverables:**
- ✅ Coach može da evidentira plaćanje
- ✅ Payment status se prikazuje
- ✅ Medical check tracking radi

---

### Phase 6: Dashboard & Analytics (Week 9-10)
**Cilj:** Owner dashboard sa KPI-jevima i grafikonima.

**Paralelno:**
- [ ] **Nemanja:**
  - Dashboard stats endpoint (KPIs, charts data)
  - Financial summary calculations
- [ ] **Vukašin:**
  - Dashboard stranica
  - KPI kartice
  - Recharts grafikoni (Line, Donut, Pie, Bar)
  - Finance overview stranica
- [ ] **Mihajlo:**
  - Coach dashboard (basic stats - optional)

**Sync Points:**
- [ ] Chart data format dogovor (Nemanja → Vukašin)
- [ ] KPI kalkulacije provera

**Deliverables:**
- ✅ Owner vidi dashboard sa svim metrikama
- ✅ Grafikoni se renderuju sa pravim podacima

---

### Phase 7: Advanced Features (Week 10-12)
**Cilj:** Push notifications, News feed, Cron jobs.

**Paralelno:**
- [ ] **Nemanja:**
  - Push notification service (Expo Push API)
  - Post model i endpoints
  - Cron jobs (payment reset, medical expiry)
  - File upload (Firebase Storage)
- [ ] **Vukašin:**
  - News feed view (optional za owner)
  - File upload integration
- [ ] **Mihajlo:**
  - Push notification setup
  - News feed (coach create, parent view)
  - File upload (images/videos)

**Sync Points:**
- [ ] Push notification testiranje (Nemanja šalje → Mihajlo prima)
- [ ] Cron job manual testiranje (svi zajedno)

**Deliverables:**
- ✅ Push notifications rade
- ✅ News feed funkcioniše
- ✅ Cron jobs se pokreću automatski

---

### Phase 8: Testing & Bug Fixes (Week 12-13)
**Cilj:** Kompletno testiranje sistema.

**Zajedno:**
- [ ] **End-to-End Testing:**
  - Kompletan user flow: Register → Add member → Create event → Mark attendance → Record payment
  - Testiranje sa pravim korisnicima (pilot klub)
- [ ] **Integration Testing:**
  - Web ↔ Backend
  - Mobile ↔ Backend
  - Push notifications end-to-end
  - QR scanning end-to-end
- [ ] **Bug Fixing:**
  - Svako fixa bugove u svom delu
  - Critical bugs prvo
  - Code review međusobno

**Deliverables:**
- ✅ Svi kritični bugovi fiksirani
- ✅ Sistem radi stabilno

---

### Phase 9: Deployment (Week 13-14)
**Cilj:** Deploy svih komponenti na production.

**Paralelno:**
- [ ] **Nemanja:**
  - Deploy backend na Render
  - Setup UptimeRobot
  - Production ENV variables
  - MongoDB production setup
- [ ] **Vukašin:**
  - Deploy web admin na Vercel
  - Production ENV variables
  - Testiranje production web app-a
- [ ] **Mihajlo:**
  - EAS build (Android + iOS)
  - Distribucija APK-a
  - Push notification production testiranje

**Sync Points:**
- [ ] Production URL sharing (Nemanja → Vukašin i Mihajlo)
- [ ] Production testiranje svi zajedno

**Deliverables:**
- ✅ Backend live na Render
- ✅ Web admin live na Vercel
- ✅ Mobile app APK dostupan
- ✅ Sve radi na production-u

---

## 🔄 DAILY WORKFLOW

### Morning Standup (15 min)
**Svaki dan, ista vreme:**
- [ ] **Nemanja:** Šta sam juče uradio, šta planiram danas, blocker-i
- [ ] **Vukašin:** Šta sam juče uradio, šta planiram danas, blocker-i
- [ ] **Mihajlo:** Šta sam juče uradio, šta planiram danas, blocker-i

### Communication Channels
- **Slack/Discord:** Brza komunikacija
- **GitHub:** Code review, issues, dokumentacija
- **Google Drive:** ENV fajlovi, dizajn fajlovi

### Code Review Process
1. Završiš feature → Push na svoj branch
2. Otvoriš Pull Request
3. Dodaj ostale kao reviewers
4. Sačekaj min 1 approval
5. Merge u main

---

## 📁 ENV FAJLOVI I GITHUB PRAVILA

### Google Drive Folder: `4Sports - ENV Files`
**Obavezan pristup za sve:**
- [ ] `backend-env.txt` - Nemanjin .env
- [ ] `web-admin-env.txt` - Vukašinov .env
- [ ] `mobile-app-env.txt` - Mihajlov .env
- [ ] `firebase-admin-key.json` - Backend Firebase key
- [ ] `firebase-web-config.json` - Firebase config za web i mobile

### Branch Naming Convention
```
backend/feature-name   → Nemanja
web/feature-name       → Vukašin
mobile/feature-name    → Mihajlo
```

### Commit Message Format
```
backend: opis
web: opis
mobile: opis
docs: opis (ako menjate dokumentaciju)
```

### .gitignore MUST Include
```
.env
.env.local
firebase-admin-key.json
node_modules/
dist/
build/
```

---

## 🚨 VAŽNA PRAVILA ZA CLAUDE AGENT

### Nemanja (Backend)
- ✅ Claude SME: `backend/` folder
- ❌ Claude NE SME: `web-admin/`, `mobile-app/`
- **Ako problem van backend-a:** Pozovi Vukašina/Mihajla

### Vukašin (Web)
- ✅ Claude SME: `web-admin/` folder
- ❌ Claude NE SME: `backend/`, `mobile-app/`
- **Ako problem van web-admin-a:** Pozovi Nemanju/Mihajla

### Mihajlo (Mobile)
- ✅ Claude SME: `mobile-app/` folder
- ❌ Claude NE SME: `backend/`, `web-admin/`
- **Ako problem van mobile-app-a:** Pozovi Nemanju/Vukašina

---

## 🎯 SUCCESS CRITERIA (TEAM)

### MVP je Kompletan Kada:
1. ✅ **Authentication:**
   - Owner, Coach, Parent mogu da se registruju i login-uju
   - Invite code system radi

2. ✅ **Members:**
   - Članovi se mogu kreirati
   - QR kodovi se generišu
   - Lista članova radi na web i mobile

3. ✅ **Events & Attendance:**
   - Coach kreira događaj
   - QR scanning radi
   - Manual attendance radi
   - Attendance se čuva u bazi

4. ✅ **Payments:**
   - Coach evidentira plaćanje
   - Status se update-uje
   - Payment history vidljiv

5. ✅ **Medical:**
   - Coach evidentira pregled
   - Status se update-uje
   - Expiry tracking radi

6. ✅ **Dashboard:**
   - Owner vidi KPI kartice
   - Grafikoni se renderuju
   - Real-time data

7. ✅ **Automation:**
   - Payment status se resetuje svakog 1.
   - Medical check expira nakon 365 dana
   - Push notifications rade

8. ✅ **Deployment:**
   - Backend na Render
   - Web na Vercel
   - Mobile APK dostupan
   - Sve radi na production

---

## 📞 KADA POZOVATI DRUGOG ČLANA TIMA

### Nemanja Poziva:
- **Vukašina:** Kada web ne može da se connectuje na API (CORS, format data)
- **Mihajla:** Kada mobile ne može da se connectuje na API, push notifications ne stižu

### Vukašin Poziva:
- **Nemanju:** Kada API ne radi, endpoint ne postoji, dobija 500 errors
- **Mihajla:** Kada trebaju da koordinišu dizajn (colors, typography)

### Mihajlo Poziva:
- **Nemanju:** Kada API ne radi, QR validacija fail-uje, push ne stižu
- **Vukašina:** Kada trebaju da koordinišu dizajn ili flow

---

## 📊 PROGRESS TRACKING

### Weekly Goals
**Svake nedelje:**
- [ ] Review šta je urađeno
- [ ] Plan za sledeću nedelju
- [ ] Blocker-i i kako ih rešiti

### GitHub Project Board (Optional)
- **Backlog:** Sve task-ove koje treba uraditi
- **In Progress:** Šta se trenutno radi (max 1-2 po osobi)
- **Review:** PR-ovi koji čekaju review
- **Done:** Završeni task-ovi

---

## 🎓 LEARNING & RESOURCES

Ako neko ne zna tehnologiju:
- **Backend (Nemanja):** Express.js docs, MongoDB docs
- **Web (Vukašin):** React docs, TailwindCSS docs, shadcn/ui docs
- **Mobile (Mihajlo):** React Native docs, Expo docs

**Help each other!** Ako neko zna više, podeli znanje.

---

## 🚀 FINALNA CHECKLIST (PRE LAUNCH)

- [ ] **Backend:**
  - [ ] Svi endpoint-i rade
  - [ ] Cron jobs rade
  - [ ] Deployed na Render
  - [ ] ENV variables na production

- [ ] **Web Admin:**
  - [ ] Sve stranice rade
  - [ ] Charts se renderuju
  - [ ] Deployed na Vercel
  - [ ] Connectuje se sa production backend-om

- [ ] **Mobile App:**
  - [ ] QR scanning radi
  - [ ] Push notifications rade
  - [ ] EAS build gotov
  - [ ] APK testiran na real devices

- [ ] **Integration:**
  - [ ] End-to-end flow testiran
  - [ ] Svi bugovi fiksirani
  - [ ] Performance testiran

- [ ] **Documentation:**
  - [ ] README updated
  - [ ] ENV fajlovi na Google Drive
  - [ ] API documentation updated

---

## 🎉 POST-LAUNCH

### Week 1 After Launch:
- [ ] Monitor production errors (svi)
- [ ] Gather user feedback
- [ ] Hot-fix critical bugs odmah

### Week 2-4:
- [ ] Implement user feedback
- [ ] Performance optimizacije
- [ ] Minor features

---

**Srećno timu! Radite paralelno, komunicirajte često, testirajte zajedno. MVP je posao za tim, ne solo! 💪🚀**

---

## 📝 TEAM CONTACTS

- **Nemanja:** (Backend) - [Slack/Discord ID]
- **Vukašin:** (Web) - [Slack/Discord ID]
- **Mihajlo:** (Mobile) - [Slack/Discord ID]

**Daily Standup Time:** [Dogovorite vreme]
**Communication Channel:** [Slack/Discord link]
**Google Drive Folder:** [Link ka 4Sports - ENV Files]
**GitHub Repository:** [Link]

---

**Individual Implementation Plans:**
- [Nemanja - Backend Plan](IMPLEMENTATION_PLAN_NEMANJA.md)
- [Vukašin - Web Plan](IMPLEMENTATION_PLAN_VUKASIN.md)
- [Mihajlo - Mobile Plan](IMPLEMENTATION_PLAN_MIHAJLO.md)

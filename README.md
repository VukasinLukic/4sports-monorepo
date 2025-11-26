# 4SPORTS - Sports Club Management Platform

**Version:** 1.0 MVP
**Status:** Ready for Development
**Architecture:** Monorepo

---

## 📋 Project Overview

4Sports is a comprehensive digital platform designed to eliminate paperwork for sports clubs. The platform serves as the "source of truth" for club owners, coaches, and parents by providing:

- Digital member management
- Attendance tracking via QR codes
- Payment and medical check monitoring
- Automated monthly resets and notifications
- Real-time analytics and reporting

**Key Philosophy:** The app does not process payments directly but maintains precise records for transparency and accountability.

---

## 🏗️ Project Structure

```
4sports-monorepo/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/            # Database & Firebase setup
│   │   ├── models/            # Mongoose schemas
│   │   ├── controllers/       # Business logic
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth & validation
│   │   ├── services/          # External services
│   │   └── utils/             # Helpers & cron jobs
│   └── package.json
│
├── web-admin/                  # React + Vite Admin Dashboard
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── features/          # Feature-based modules
│   │   ├── hooks/             # Custom React hooks
│   │   └── services/          # API calls
│   └── package.json
│
├── mobile-app/                 # React Native + Expo
│   ├── app/                   # Expo Router screens
│   ├── components/            # Mobile UI components
│   ├── services/              # API & notifications
│   └── package.json
│
└── docs/                       # Complete documentation
    ├── PRD.md                 # Product Requirements
    ├── TECHNOLOGY_STACK.md    # Tech stack & services
    ├── ARCHITECTURE.md        # System architecture
    ├── API_SPEC.md            # API documentation
    ├── DESIGN_GUIDELINES.md   # UI/UX guidelines
    ├── IMPLEMENTATION_PLAN.md # Step-by-step guide
    └── PROJECT_STRUCTURE.md   # Monorepo strategy
```

---

## 📚 Documentation

### Core Documents

| Document | Description | Link |
|----------|-------------|------|
| **Product Requirements Document** | Complete feature specifications, user roles, and business logic | [PRD.md](docs/PRD.md) |
| **Technology Stack** | All tools, services, and cost breakdown | [TECHNOLOGY_STACK.md](docs/TECHNOLOGY_STACK.md) |
| **System Architecture** | Flow diagrams, database schema, and deployment architecture | [ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| **API Specification** | Detailed API endpoints with request/response examples | [API_SPEC.md](docs/API_SPEC.md) |
| **Design Guidelines** | Complete UI/UX specifications, color system, and components | [DESIGN_GUIDELINES.md](docs/DESIGN_GUIDELINES.md) |
| **Project Structure** | Monorepo organization and folder strategy | [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) |

### Implementation Plans

| Plan | Role | Responsibility | Link |
|------|------|----------------|------|
| **Team Coordination Plan** | All Members | Overall project coordination and milestones | [IMPLEMENTATION_PLAN_TEAM.md](docs/IMPLEMENTATION_PLAN_TEAM.md) |
| **Nemanja - Backend Plan** | Backend Developer | `backend/` folder - Node.js API, MongoDB, Firebase Admin | [IMPLEMENTATION_PLAN_NEMANJA.md](docs/IMPLEMENTATION_PLAN_NEMANJA.md) |
| **Vukašin - Web Admin Plan** | Web Developer | `web-admin/` folder - React dashboard, Charts, Admin UI | [IMPLEMENTATION_PLAN_VUKASIN.md](docs/IMPLEMENTATION_PLAN_VUKASIN.md) |
| **Mihajlo - Mobile App Plan** | Mobile Developer | `mobile-app/` folder - React Native, QR scanning, Expo | [IMPLEMENTATION_PLAN_MIHAJLO.md](docs/IMPLEMENTATION_PLAN_MIHAJLO.md) |
| **Original Solo Plan** | Reference | Complete solo developer implementation guide | [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) |

---

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js** 20.x or higher
- **Git** installed
- **VS Code** (recommended)
- Accounts created on:
  - Firebase (auth & storage)
  - MongoDB Atlas (database)
  - Vercel (web hosting)
  - Render (backend hosting)
  - Resend (emails)

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/4sports-monorepo.git
cd 4sports-monorepo
```

### Step 2: Set Up Backend

```bash
cd backend
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# Add your MongoDB URI, Firebase keys, etc.

# Run development server
npm run dev
```

**Backend will run on:** http://localhost:5000

### Step 3: Set Up Web Admin

```bash
cd ../web-admin
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your Firebase config

# Run development server
npm run dev
```

**Web admin will run on:** http://localhost:5173

### Step 4: Set Up Mobile App

```bash
cd ../mobile-app
npm install

# Start Expo development server
npx expo start
```

**Scan QR code with Expo Go app on your phone**

---

## 🎯 User Roles & Features

### 1. Owner (Club Admin)
- **Dashboard:** View KPIs, member growth, revenue analytics
- **Financial Management:** Track all income/expenses, view membership payments
- **Coach Management:** Generate invite codes, manage contracts
- **Settings:** Configure club limits and subscription

### 2. Coach (Trainer)
- **Calendar:** Create training sessions and competitions
- **Attendance:** Scan QR codes or manually mark presence
- **Payments:** Record membership payments, send reminders
- **Medical Checks:** Record examinations, track expirations
- **News Feed:** Post updates, photos, and videos to groups
- **Groups:** Manage training groups and members

### 3. Parent/Member
- **Profile:** View personal QR code for check-ins
- **Calendar:** See upcoming training sessions
- **Status:** Check payment and medical examination status
- **Attendance:** View attendance history
- **News Feed:** See updates from coaches

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js 20.x
- **Framework:** Express.js + TypeScript
- **Database:** MongoDB Atlas (M0 Free Tier)
- **Authentication:** Firebase Authentication
- **Storage:** Firebase Storage
- **Scheduling:** node-cron
- **Hosting:** Render (Free Tier)

### Web Admin
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI Library:** shadcn/ui + TailwindCSS
- **Charts:** Recharts
- **State Management:** TanStack Query
- **Hosting:** Vercel (Free Tier)

### Mobile App
- **Framework:** React Native + Expo
- **Routing:** Expo Router
- **QR Features:** Expo Camera + react-native-qrcode-svg
- **Notifications:** Expo Push API
- **Build:** EAS Build

### External Services (All Free Tiers)
- **MongoDB Atlas** - Database (512 MB)
- **Firebase** - Auth + Storage (1 GB)
- **Vercel** - Web hosting (100 GB bandwidth)
- **Render** - Backend hosting (750 hours/month)
- **Resend** - Emails (3000/month)
- **Expo** - Mobile build & push notifications

**Total Monthly Cost:** $0.00 for MVP

---

## 📱 Key Features

### ✅ Invite Code System
- Hierarchical registration (Owner → Coach → Member)
- Secure, time-limited codes
- Automatic club member limit enforcement

### ✅ QR Code Attendance
- Each member has unique QR code
- Coaches scan for instant check-in
- Manual backup option available
- Real-time attendance statistics

### ✅ Automatic Payment Tracking
- Status resets monthly (1st of month)
- Push notification reminders
- Complete payment history
- Revenue analytics for owners

### ✅ Medical Check Monitoring
- 365-day validity period
- Auto-expiration notifications
- Warning alerts (30 days before expiry)
- Parent and coach notifications

### ✅ Dashboard Analytics
- Member growth charts
- Revenue vs. expenses
- Quarterly performance
- Real-time KPIs

---

## 🔒 Security Features

- Firebase Authentication with JWT
- Role-based access control (RBAC)
- Rate limiting on API endpoints
- Encrypted environment variables
- Input validation and sanitization
- HTTPS-only in production
- Secure Firebase Storage rules

---

## 📈 Development Roadmap

### Phase 0: Pre-Development (4-6 hours)
- Create all external service accounts
- Configure Firebase, MongoDB, etc.
- Set up development environment

### Phase 1-6: Backend Development (56-76 hours)
- Build complete REST API
- Implement all models and controllers
- Set up authentication and authorization
- Create cron jobs for automation

### Phase 7: Web Admin Dashboard (40-50 hours)
- Build owner dashboard with charts
- Implement member management
- Create financial tracking UI

### Phase 8-9: Mobile App (70-85 hours)
- Coach interface with QR scanning
- Parent interface with profile
- Calendar and news feed

### Phase 10-12: Testing & Deployment (38-55 hours)
- Comprehensive testing
- Bug fixes and optimization
- Production deployment

**Total Estimated Time:** 320-480 hours (8-12 weeks at 40 hrs/week)

For detailed breakdown, see [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)

---

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Web Admin Testing
```bash
cd web-admin
npm test
```

### Mobile App Testing
```bash
cd mobile-app
npm test
```

---

## 🚀 Deployment

### Backend (Render)
1. Push code to GitHub
2. Connect repository to Render
3. Configure environment variables
4. Deploy (automatic)

**Production URL:** https://4sports-api.onrender.com

### Web Admin (Vercel)
1. Push code to GitHub
2. Import project to Vercel
3. Configure build settings
4. Deploy (automatic)

**Production URL:** https://4sports-admin.vercel.app

### Mobile App (EAS)
```bash
cd mobile-app
eas build --platform android
eas build --platform ios
```

Download builds and distribute via TestFlight/APK

For detailed deployment steps, see [IMPLEMENTATION_PLAN.md - Phase 12](docs/IMPLEMENTATION_PLAN.md#phase-12-deployment--launch)

---

## 📊 API Documentation

Base URL: `https://api.4sports.app/api/v1`

### Quick Links
- [Authentication Endpoints](docs/API_SPEC.md#1-authentication)
- [Club Management](docs/API_SPEC.md#2-clubs)
- [Member Management](docs/API_SPEC.md#6-members)
- [Attendance Tracking](docs/API_SPEC.md#8-attendance)
- [Payment Recording](docs/API_SPEC.md#9-payments)

Full API documentation: [API_SPEC.md](docs/API_SPEC.md)

---

## 🎨 Design System

### Color Palette
- **Primary:** #00E676 (Green)
- **Background:** #121212 (Dark)
- **Surface:** #1E1E1E
- **Text:** #FFFFFF

### Typography
- **Font:** Inter (Web), System Default (Mobile)
- **Heading 1:** 32px / Bold
- **Body:** 14px / Regular

Full design specifications: [DESIGN_GUIDELINES.md](docs/DESIGN_GUIDELINES.md)

---

## 🤝 Contributing

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push to GitHub
git push origin feature/your-feature-name

# Create pull request on GitHub
```

### Commit Convention
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

---

## 📝 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_bucket
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_key
WEB_ADMIN_URL=http://localhost:5173
MOBILE_APP_URL=exp://localhost:19000
```

### Web Admin (.env)
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_API_URL=http://localhost:5000/api/v1
```

### Mobile App (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

**Never commit .env files to Git!**

---

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Failed:**
- Check connection string format
- Verify IP whitelist in MongoDB Atlas
- Ensure database user credentials are correct

**Firebase Auth Not Working:**
- Verify Firebase project ID
- Check if Email/Password provider is enabled
- Ensure firebase-admin-key.json is in backend folder

**Expo App Not Loading:**
- Check if backend is running
- Verify API_URL in mobile app config
- Clear Expo cache: `npx expo start -c`

For more troubleshooting tips, see [IMPLEMENTATION_PLAN.md - Troubleshooting](docs/IMPLEMENTATION_PLAN.md#troubleshooting-common-issues)

---

## 📞 Support & Resources

### Documentation
- [Complete API Reference](docs/API_SPEC.md)
- [Architecture Diagrams](docs/ARCHITECTURE.md)
- [Design System](docs/DESIGN_GUIDELINES.md)
- [Implementation Guide](docs/IMPLEMENTATION_PLAN.md)

### External Resources
- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [Firebase Documentation](https://firebase.google.com/docs)

---

## 📜 License

This project is proprietary software. All rights reserved.

---

## 🎉 Acknowledgments

- **Design Reference:** Figma prototype
- **UI Components:** shadcn/ui, React Native Paper
- **Icons:** Lucide Icons
- **Charts:** Recharts

---

## 📅 Version History

- **v1.0.0** (2025-01-15) - Initial MVP release
  - Core authentication system
  - Invite code hierarchy
  - QR-based attendance
  - Payment and medical tracking
  - Web admin dashboard
  - Mobile app for coaches and parents
  - Automated cron jobs

---

**Built with ❤️ for sports clubs everywhere**

---

## 🚦 Current Status

**Project Phase:** Pre-Development Setup
**Next Steps:** Follow [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) starting with Phase 0

Ready to start development? Begin with [Phase 0: Pre-Development Setup](docs/IMPLEMENTATION_PLAN.md#phase-0-pre-development-setup)

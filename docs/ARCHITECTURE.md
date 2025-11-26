# 4SPORTS — SYSTEM ARCHITECTURE

**Verzija:** 1.0
**Status:** Ready for Development
**Type:** Monorepo Architecture

---

## 1. High-Level Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web Admin Panel<br/>React + Vite]
        MOB[Mobile App<br/>React Native + Expo]
    end

    subgraph "API Gateway Layer"
        API[Node.js + Express API<br/>REST Endpoints]
    end

    subgraph "Authentication Layer"
        FIREBASE_AUTH[Firebase Authentication<br/>Email/Password]
    end

    subgraph "Data Layer"
        MONGO[(MongoDB Atlas<br/>Primary Database)]
        FIREBASE_STORAGE[Firebase Storage<br/>Images & Videos]
    end

    subgraph "Background Services"
        CRON[Node-Cron Jobs<br/>Scheduled Tasks]
    end

    subgraph "External Services"
        PUSH[Expo Push API<br/>Notifications]
        EMAIL[Resend<br/>Email Service]
    end

    WEB -->|HTTPS/REST| API
    MOB -->|HTTPS/REST| API

    API -->|Verify Token| FIREBASE_AUTH
    API -->|CRUD Operations| MONGO
    API -->|Upload/Download| FIREBASE_STORAGE
    API -->|Send Email| EMAIL
    API -->|Send Push| PUSH

    CRON -->|Monthly Reset| MONGO
    CRON -->|Check Expirations| MONGO
    CRON -->|Trigger Notifications| PUSH

    style WEB fill:#00E676,stroke:#00C853,color:#000
    style MOB fill:#00E676,stroke:#00C853,color:#000
    style API fill:#1E1E1E,stroke:#00E676,color:#FFF
    style MONGO fill:#1E1E1E,stroke:#00E676,color:#FFF
```

---

## 2. Monorepo Structure

```
4sports-monorepo/
├── backend/                    # Node.js API Server
├── web-admin/                  # React Web Dashboard
├── mobile-app/                 # React Native App
├── shared/                     # Shared types & utilities (Future)
├── docs/                       # Documentation
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── API_SPEC.md
│   ├── DESIGN_GUIDELINES.md
│   └── IMPLEMENTATION_PLAN.md
└── README.md
```

---

## 3. Backend Architecture

### 3.1 Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.ts              # MongoDB connection
│   │   ├── firebase.ts        # Firebase Admin SDK
│   │   └── env.ts             # Environment variables
│   ├── models/
│   │   ├── Club.ts            # Club schema
│   │   ├── User.ts            # Users (Owner, Coach, Parent)
│   │   ├── Member.ts          # Members (Athletes)
│   │   ├── Group.ts           # Training groups
│   │   ├── Event.ts           # Trainings & Competitions
│   │   ├── Attendance.ts      # Attendance records
│   │   ├── Payment.ts         # Payment records
│   │   ├── MedicalCheck.ts    # Medical examination records
│   │   ├── InviteCode.ts      # Invite codes
│   │   ├── Finance.ts         # Manual finance entries
│   │   └── Post.ts            # News feed posts
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── clubController.ts
│   │   ├── userController.ts
│   │   ├── memberController.ts
│   │   ├── groupController.ts
│   │   ├── eventController.ts
│   │   ├── attendanceController.ts
│   │   ├── paymentController.ts
│   │   ├── medicalController.ts
│   │   ├── inviteController.ts
│   │   ├── financeController.ts
│   │   └── postController.ts
│   ├── routes/
│   │   ├── index.ts           # Main router
│   │   ├── authRoutes.ts
│   │   ├── clubRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── memberRoutes.ts
│   │   ├── groupRoutes.ts
│   │   ├── eventRoutes.ts
│   │   ├── attendanceRoutes.ts
│   │   ├── paymentRoutes.ts
│   │   ├── medicalRoutes.ts
│   │   ├── inviteRoutes.ts
│   │   ├── financeRoutes.ts
│   │   └── postRoutes.ts
│   ├── middleware/
│   │   ├── authMiddleware.ts  # JWT verification
│   │   ├── roleMiddleware.ts  # Role-based access
│   │   ├── uploadMiddleware.ts # File upload handling
│   │   ├── validationMiddleware.ts # Request validation
│   │   └── errorMiddleware.ts # Error handling
│   ├── services/
│   │   ├── authService.ts
│   │   ├── emailService.ts    # Resend integration
│   │   ├── pushService.ts     # Expo Push API
│   │   ├── storageService.ts  # Firebase Storage
│   │   └── qrService.ts       # QR code generation
│   ├── utils/
│   │   ├── cronJobs.ts        # Scheduled tasks
│   │   ├── helpers.ts         # Utility functions
│   │   └── constants.ts       # App constants
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   └── index.ts               # Entry point
├── tests/                     # Test files
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

### 3.2 Database Schema Architecture

```mermaid
erDiagram
    CLUB ||--o{ USER : "has"
    CLUB ||--o{ GROUP : "has"
    CLUB ||--o{ INVITE_CODE : "generates"
    CLUB ||--o{ FINANCE : "tracks"

    USER ||--o{ GROUP : "manages"
    USER ||--o{ MEMBER : "supervises"
    USER ||--o{ POST : "creates"

    GROUP ||--o{ MEMBER : "contains"
    GROUP ||--o{ EVENT : "schedules"
    GROUP ||--o{ INVITE_CODE : "has"

    MEMBER ||--o{ ATTENDANCE : "records"
    MEMBER ||--o{ PAYMENT : "makes"
    MEMBER ||--o{ MEDICAL_CHECK : "has"

    EVENT ||--o{ ATTENDANCE : "tracks"

    CLUB {
        ObjectId _id
        string name
        string ownerId
        date createdAt
        number memberLimit
        number currentMembers
        string subscriptionPlan
    }

    USER {
        ObjectId _id
        string firebaseUid
        string email
        string role
        ObjectId clubId
        string fullName
        string phoneNumber
    }

    GROUP {
        ObjectId _id
        string name
        ObjectId clubId
        ObjectId coachId
        array memberIds
        date createdAt
    }

    MEMBER {
        ObjectId _id
        string fullName
        date dateOfBirth
        ObjectId clubId
        ObjectId groupId
        ObjectId parentId
        string qrCode
        boolean paymentStatus
        date lastPaymentDate
        boolean medicalStatus
        date lastMedicalDate
    }

    EVENT {
        ObjectId _id
        string title
        string type
        ObjectId groupId
        date startTime
        date endTime
        ObjectId createdBy
    }

    ATTENDANCE {
        ObjectId _id
        ObjectId eventId
        ObjectId memberId
        boolean present
        date timestamp
        string scannedBy
    }

    PAYMENT {
        ObjectId _id
        ObjectId memberId
        number amount
        date paymentDate
        string recordedBy
        string month
    }

    MEDICAL_CHECK {
        ObjectId _id
        ObjectId memberId
        date examinationDate
        date expiryDate
        string recordedBy
    }

    INVITE_CODE {
        ObjectId _id
        string code
        string type
        ObjectId clubId
        ObjectId groupId
        boolean isActive
        date expiresAt
    }

    FINANCE {
        ObjectId _id
        ObjectId clubId
        string type
        number amount
        string description
        date date
        string recordedBy
    }

    POST {
        ObjectId _id
        ObjectId authorId
        ObjectId groupId
        string content
        array mediaUrls
        date createdAt
    }
```

---

## 4. Frontend Architecture

### 4.1 Web Admin Panel Structure

```
web-admin/
├── public/
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── charts/
│   │   │   ├── LineChart.tsx
│   │   │   ├── DonutChart.tsx
│   │   │   ├── PieChart.tsx
│   │   │   └── BarChart.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Layout.tsx
│   │   └── shared/
│   │       ├── DataTable.tsx
│   │       ├── StatusBadge.tsx
│   │       └── LoadingSpinner.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   └── useAuth.ts
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── KPICard.tsx
│   │   │   └── useDashboard.ts
│   │   ├── members/
│   │   │   ├── MemberList.tsx
│   │   │   ├── MemberForm.tsx
│   │   │   └── useMembers.ts
│   │   ├── finances/
│   │   │   ├── FinanceOverview.tsx
│   │   │   ├── TransactionList.tsx
│   │   │   └── useFinances.ts
│   │   ├── coaches/
│   │   │   ├── CoachList.tsx
│   │   │   └── ContractManagement.tsx
│   │   └── settings/
│   │       ├── ClubSettings.tsx
│   │       └── SubscriptionManagement.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   └── useToast.ts
│   ├── lib/
│   │   ├── axios.ts           # API client
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── services/
│   │   └── api.ts             # API functions
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

### 4.2 Mobile App Structure

```
mobile-app/
├── app/                       # Expo Router
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── invite-code.tsx
│   ├── (coach)/               # Coach role screens
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx      # Dashboard
│   │   │   ├── calendar.tsx
│   │   │   ├── members.tsx
│   │   │   └── profile.tsx
│   │   ├── attendance/
│   │   │   ├── scan-qr.tsx
│   │   │   ├── manual-add.tsx
│   │   │   └── session-[id].tsx
│   │   ├── payment/
│   │   │   ├── record-payment.tsx
│   │   │   └── send-reminder.tsx
│   │   ├── medical/
│   │   │   └── record-exam.tsx
│   │   └── news/
│   │       └── create-post.tsx
│   ├── (parent)/              # Parent role screens
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx      # Home
│   │   │   ├── calendar.tsx
│   │   │   └── profile.tsx
│   │   └── member/
│   │       └── [id].tsx       # Member details
│   ├── _layout.tsx            # Root layout
│   └── index.tsx              # Entry point
├── assets/
│   ├── images/
│   └── fonts/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Badge.tsx
│   ├── MemberCard.tsx
│   ├── EventCard.tsx
│   ├── QRCodeDisplay.tsx
│   ├── QRScanner.tsx
│   └── Calendar.tsx
├── constants/
│   ├── Colors.ts
│   └── Layout.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useApi.ts
│   └── usePushNotifications.ts
├── services/
│   ├── api.ts
│   ├── auth.ts
│   ├── storage.ts
│   └── notifications.ts
├── types/
│   └── index.ts
├── utils/
│   └── helpers.ts
├── app.json
└── package.json
```

---

## 5. Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client (Web/Mobile)
    participant API as Backend API
    participant FA as Firebase Auth
    participant DB as MongoDB

    Note over U,DB: Registration Flow
    U->>C: Enter email & password
    C->>FA: Create user account
    FA-->>C: Return Firebase UID & Token
    C->>API: POST /auth/register (UID, Token, UserData)
    API->>FA: Verify Token
    FA-->>API: Token Valid
    API->>DB: Create User document
    DB-->>API: User created
    API-->>C: Return User & JWT
    C-->>U: Registration successful

    Note over U,DB: Login Flow
    U->>C: Enter credentials
    C->>FA: Sign in with email/password
    FA-->>C: Return Firebase Token
    C->>API: POST /auth/login (Token)
    API->>FA: Verify Token
    FA-->>API: Token valid, return UID
    API->>DB: Find user by Firebase UID
    DB-->>API: Return user data
    API-->>C: Return User & JWT
    C-->>U: Login successful

    Note over U,DB: Authenticated Request
    U->>C: Request protected resource
    C->>API: GET /resource (Authorization: Bearer JWT)
    API->>API: Verify JWT
    API->>DB: Fetch data
    DB-->>API: Return data
    API-->>C: Return response
    C-->>U: Display data
```

---

## 6. Invite Code System Flow

```mermaid
flowchart TD
    Start([Owner Creates Club]) --> GenOwnerCode[Generate Coach Invite Code]
    GenOwnerCode --> StoreOwnerCode[(Store in DB:<br/>type: COACH<br/>clubId: X)]

    StoreOwnerCode --> CoachInstalls[Coach Installs App]
    CoachInstalls --> CoachEntersCode[Coach Enters Code]
    CoachEntersCode --> ValidateCoachCode{Validate Code}

    ValidateCoachCode -->|Invalid| Error1[Show Error]
    ValidateCoachCode -->|Valid| CreateCoach[Create Coach Account]

    CreateCoach --> LinkCoachToClub[Link Coach to Club]
    LinkCoachToClub --> CoachCreatesGroup[Coach Creates Group]

    CoachCreatesGroup --> GenGroupCode[Generate Member Invite Code]
    GenGroupCode --> StoreGroupCode[(Store in DB:<br/>type: MEMBER<br/>groupId: Y)]

    StoreGroupCode --> ParentInstalls[Parent Installs App]
    ParentInstalls --> ParentEntersCode[Parent Enters Code]
    ParentEntersCode --> ValidateMemberCode{Validate Code}

    ValidateMemberCode -->|Invalid| Error2[Show Error]
    ValidateMemberCode -->|Valid| CheckLimit{Club Member<br/>Limit Reached?}

    CheckLimit -->|Yes| ErrorLimit[Show Limit Error]
    CheckLimit -->|No| CreateParent[Create Parent Account]

    CreateParent --> CreateMember[Create Member Profile]
    CreateMember --> LinkToGroup[Link Member to Group]
    LinkToGroup --> IncrementCount[Increment Club Member Count]
    IncrementCount --> End([Member Added])

    style Start fill:#00E676,color:#000
    style End fill:#00E676,color:#000
    style Error1 fill:#FF5252,color:#FFF
    style Error2 fill:#FF5252,color:#FFF
    style ErrorLimit fill:#FF5252,color:#FFF
```

---

## 7. Attendance Tracking Flow

```mermaid
sequenceDiagram
    participant C as Coach
    participant App as Mobile App
    participant API as Backend API
    participant DB as Database
    participant M as Member

    Note over C,M: Create Event
    C->>App: Create training event
    App->>API: POST /events
    API->>DB: Save event
    DB-->>API: Event created
    API-->>App: Return event ID

    Note over C,M: Start Attendance Session
    C->>App: Open attendance for event
    App->>API: GET /events/:id/members
    API->>DB: Fetch group members
    DB-->>API: Return member list
    API-->>App: Display members

    Note over C,M: QR Scan Method
    C->>App: Tap "Scan QR"
    App->>App: Open camera
    M->>App: Show QR code
    App->>App: Scan QR code
    App->>API: POST /attendance/qr-scan
    API->>DB: Create attendance record
    DB-->>API: Record saved
    API-->>App: Member marked present
    App-->>C: Show green checkmark

    Note over C,M: Manual Method
    C->>App: Tap "Add Manually"
    App->>App: Show member list
    C->>App: Select member
    App->>API: POST /attendance/manual
    API->>DB: Create attendance record
    DB-->>API: Record saved
    API-->>App: Member marked present
    App-->>C: Update list

    Note over C,M: View Summary
    C->>App: View attendance summary
    App->>API: GET /attendance/event/:id
    API->>DB: Fetch all records for event
    DB-->>API: Return attendance data
    API-->>App: Display statistics
    App-->>C: Show present/absent counts
```

---

## 8. Payment & Membership Logic Flow

```mermaid
flowchart TD
    Start([New Month Begins]) --> CronJob[Cron Job Triggers<br/>1st of Month, 00:00]

    CronJob --> FetchMembers[Fetch All Active Members]
    FetchMembers --> ResetStatus[Set paymentStatus = false<br/>for all members]

    ResetStatus --> NotifyCoaches[Send Push Notification<br/>to all Coaches]

    NotifyCoaches --> CoachCheck{Coach Opens App}
    CoachCheck --> ViewList[View Members List<br/>Red badges = Unpaid]

    ViewList --> ParentPays[Parent Pays Coach<br/>Cash/Bank Transfer]
    ParentPays --> CoachRecords[Coach: Tap 'Record Payment']

    CoachRecords --> ConfirmPayment{Confirm Payment?}
    ConfirmPayment -->|No| ViewList
    ConfirmPayment -->|Yes| UpdateDB[(Update DB:<br/>paymentStatus = true<br/>lastPaymentDate = now)]

    UpdateDB --> CreatePaymentRecord[(Create Payment Record:<br/>memberId, amount, date)]
    CreatePaymentRecord --> NotifyParent[Send Push to Parent]
    NotifyParent --> BadgeGreen[Member Badge Turns Green]

    BadgeGreen --> CheckUnpaid{Any Unpaid<br/>Members Left?}
    CheckUnpaid -->|Yes| SendReminder[Coach: Send Reminder]
    SendReminder --> PushToParent[Push Notification to Parent]
    PushToParent --> CheckUnpaid

    CheckUnpaid -->|No| AllPaid[All Members Paid]
    AllPaid --> NextMonth[Wait for Next Month]
    NextMonth --> Start

    style Start fill:#FFB300,color:#000
    style AllPaid fill:#00E676,color:#000
    style BadgeGreen fill:#00E676,color:#000
    style ViewList fill:#FF5252,color:#FFF
```

---

## 9. Medical Check Expiration Flow

```mermaid
flowchart TD
    Start([Daily Cron Job<br/>00:00]) --> FetchMembers[Fetch All Members<br/>with lastMedicalDate]

    FetchMembers --> CheckEach{For Each Member}
    CheckEach --> CalcDays[Calculate Days Since<br/>Last Examination]

    CalcDays --> IsExpired{Days > 365?}

    IsExpired -->|No| CheckWarning{Days > 335?}
    IsExpired -->|Yes| MarkExpired[Set medicalStatus = false]

    MarkExpired --> NotifyCoachExpired[Send Push to Coach:<br/>'Medical Expired']
    NotifyCoachExpired --> NotifyParentExpired[Send Push to Parent:<br/>'Renew Medical']
    NotifyParentExpired --> NextMember1[Next Member]

    CheckWarning -->|Yes| NotifyWarning[Send Warning Push:<br/>'Medical Expiring Soon']
    NotifyWarning --> NextMember2[Next Member]

    CheckWarning -->|No| NextMember3[Next Member]

    NextMember1 --> MoreMembers{More Members?}
    NextMember2 --> MoreMembers
    NextMember3 --> MoreMembers

    MoreMembers -->|Yes| CheckEach
    MoreMembers -->|No| End([Job Complete<br/>Wait 24 Hours])

    End --> Start

    style Start fill:#FFB300,color:#000
    style MarkExpired fill:#FF5252,color:#FFF
    style NotifyWarning fill:#FFB300,color:#000
```

---

## 10. Data Synchronization Strategy

### 10.1 Real-time Updates (Future Enhancement)
Currently using REST API with polling. Future implementation could use:
- **WebSockets** for real-time attendance updates
- **Firebase Realtime Database** for live event changes
- **React Query** with auto-refresh for dashboard KPIs

### 10.2 Caching Strategy

**Web Admin:**
```typescript
// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
    },
  },
});
```

**Mobile App:**
```typescript
// Cache attendance records locally
import AsyncStorage from '@react-native-async-storage/async-storage';

// Sync when online
const syncAttendance = async () => {
  const cached = await AsyncStorage.getItem('pending_attendance');
  if (cached && isOnline) {
    await api.post('/attendance/bulk', JSON.parse(cached));
    await AsyncStorage.removeItem('pending_attendance');
  }
};
```

---

## 11. Security Architecture

### 11.1 Authentication Layers

```
1. Firebase Authentication (User Identity)
   ↓
2. Custom JWT Token (API Access)
   ↓
3. Role-Based Middleware (Permission Check)
   ↓
4. Resource Ownership Validation (Data Access)
```

### 11.2 API Security Measures

```typescript
// Rate Limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Helmet.js for security headers
import helmet from 'helmet';
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: [
    'https://yourdomain.com',
    'exp://localhost:19000', // Expo dev
  ],
  credentials: true,
};
```

### 11.3 Data Validation

```typescript
// Zod schemas for request validation
import { z } from 'zod';

const createMemberSchema = z.object({
  fullName: z.string().min(2).max(100),
  dateOfBirth: z.string().datetime(),
  groupId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  parentId: z.string().regex(/^[0-9a-fA-F]{24}$/),
});
```

---

## 12. Performance Optimization

### 12.1 Backend Optimizations

```typescript
// Database indexing
memberSchema.index({ clubId: 1, groupId: 1 });
memberSchema.index({ qrCode: 1 }, { unique: true });
attendanceSchema.index({ eventId: 1, memberId: 1 });
paymentSchema.index({ memberId: 1, paymentDate: -1 });

// Query optimization
const members = await Member.find({ clubId })
  .select('fullName paymentStatus medicalStatus')
  .lean(); // Returns plain JS objects, faster

// Aggregation pipelines for dashboard
const stats = await Payment.aggregate([
  { $match: { clubId: new ObjectId(clubId) } },
  { $group: {
      _id: { $month: '$paymentDate' },
      total: { $sum: '$amount' },
      count: { $sum: 1 }
    }
  },
]);
```

### 12.2 Frontend Optimizations

```typescript
// Code splitting
const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));
const MemberList = lazy(() => import('./features/members/MemberList'));

// Virtualized lists for large datasets
import { VirtualizedList } from '@tanstack/react-virtual';

// Image optimization
<Image
  source={{ uri: imageUrl }}
  resizeMode="cover"
  defaultSource={require('./placeholder.png')}
/>
```

---

## 13. Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        DEV_CODE[Local Development]
        DEV_CODE -->|git push| GITHUB[GitHub Repository]
    end

    subgraph "CI/CD"
        GITHUB -->|trigger| VERCEL_BUILD[Vercel Build]
        GITHUB -->|trigger| RENDER_BUILD[Render Build]
        GITHUB -->|trigger| EAS_BUILD[EAS Build]
    end

    subgraph "Production - Web"
        VERCEL_BUILD --> VERCEL_DEPLOY[Vercel Deployment<br/>web-admin/]
        VERCEL_DEPLOY --> WEB_URL[https://admin.4sports.app]
    end

    subgraph "Production - Backend"
        RENDER_BUILD --> RENDER_DEPLOY[Render Deployment<br/>backend/]
        RENDER_DEPLOY --> API_URL[https://api.4sports.app]
    end

    subgraph "Production - Mobile"
        EAS_BUILD --> APP_STORE[Apple App Store]
        EAS_BUILD --> PLAY_STORE[Google Play Store]
    end

    subgraph "External Services"
        MONGO_ATLAS[(MongoDB Atlas)]
        FIREBASE[Firebase<br/>Auth + Storage]
    end

    API_URL -.->|connects| MONGO_ATLAS
    API_URL -.->|connects| FIREBASE
    WEB_URL -->|API calls| API_URL
    APP_STORE -->|API calls| API_URL
    PLAY_STORE -->|API calls| API_URL

    style WEB_URL fill:#00E676,color:#000
    style API_URL fill:#00E676,color:#000
```

### Deployment Configuration

**Vercel (Web Admin):**
```json
{
  "buildCommand": "cd web-admin && npm run build",
  "outputDirectory": "web-admin/dist",
  "installCommand": "cd web-admin && npm install"
}
```

**Render (Backend):**
```yaml
services:
  - type: web
    name: 4sports-api
    env: node
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: FIREBASE_PROJECT_ID
        sync: false
```

**EAS (Mobile):**
```json
{
  "build": {
    "production": {
      "node": "18.x.x",
      "channel": "production",
      "env": {
        "API_URL": "https://api.4sports.app"
      }
    }
  }
}
```

---

## 14. Monitoring & Logging

### 14.1 Backend Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Log critical events
logger.info('Member payment recorded', { memberId, amount });
logger.error('Payment failed', { error: e.message, memberId });
```

### 14.2 Error Tracking

```typescript
// Sentry integration (optional, paid service)
import * as Sentry from '@sentry/node';

Sentry.init({ dsn: process.env.SENTRY_DSN });

app.use(Sentry.Handlers.errorHandler());
```

### 14.3 Uptime Monitoring

**UptimeRobot** (Free):
- Monitor API endpoint: `https://api.4sports.app/health`
- Check every 5 minutes
- Ping to keep Render free tier awake

---

## 15. Scalability Considerations

### Current MVP Architecture (Free Tier)
- **MongoDB Atlas M0**: 512 MB storage, ~100 members per club
- **Render Free**: Sleeps after inactivity, 750 hours/month
- **Vercel Hobby**: 100 GB bandwidth/month
- **Firebase Spark**: 1 GB storage, 50K reads/day

### Future Scaling Path
1. **Phase 1** (10-50 clubs):
   - Upgrade MongoDB to M2 ($9/month)
   - Render Starter ($7/month) - No sleep

2. **Phase 2** (50-200 clubs):
   - MongoDB M5 ($25/month)
   - Render Standard ($25/month)
   - Firebase Blaze (Pay as you go)
   - Implement Redis for caching

3. **Phase 3** (200+ clubs):
   - Microservices architecture
   - Load balancers
   - CDN for media files
   - Dedicated database cluster

---

## 16. Backup & Disaster Recovery

### Automated Backups

```typescript
// MongoDB Atlas: Daily automatic backups (included in free tier)
// Retention: 2 days on M0, configure longer on paid tiers

// Manual backup script
import { execSync } from 'child_process';

const backupDatabase = () => {
  const timestamp = new Date().toISOString();
  const command = `mongodump --uri="${MONGODB_URI}" --out="./backups/${timestamp}"`;
  execSync(command);
};

// Run weekly via cron
```

### Firebase Storage Backup
```typescript
// Download all files to external storage
import admin from 'firebase-admin';

const bucket = admin.storage().bucket();
const [files] = await bucket.getFiles();

for (const file of files) {
  await file.download({ destination: `./backup/${file.name}` });
}
```

---

## 17. Development Workflow

```mermaid
graph LR
    LOCAL[Local Development] -->|git push| FEAT[Feature Branch]
    FEAT -->|Pull Request| CODE_REVIEW[Code Review]
    CODE_REVIEW -->|Merge| MAIN[Main Branch]

    MAIN -->|Auto Deploy| STAGING[Staging Environment]
    STAGING -->|Manual Trigger| PROD[Production]

    PROD -->|Monitor| LOGS[Logs & Metrics]
    LOGS -->|Issues Found| LOCAL

    style LOCAL fill:#1E1E1E,stroke:#00E676,color:#FFF
    style PROD fill:#00E676,color:#000
```

---

## 18. Testing Strategy

### Backend Testing
```typescript
// Unit tests with Jest
import { createMember } from '../controllers/memberController';

describe('Member Controller', () => {
  test('should create member when limit not reached', async () => {
    const result = await createMember(mockReq, mockRes);
    expect(result.status).toBe(201);
  });

  test('should reject member when limit reached', async () => {
    // Mock club with current_members >= limit
    const result = await createMember(mockReq, mockRes);
    expect(result.status).toBe(403);
  });
});
```

### Frontend Testing
```typescript
// Component tests with React Testing Library
import { render, screen } from '@testing-library/react';
import MemberCard from './MemberCard';

test('renders member name and status', () => {
  render(<MemberCard member={mockMember} />);
  expect(screen.getByText('John Doe')).toBeInTheDocument();
  expect(screen.getByText('PAID')).toBeInTheDocument();
});
```

### E2E Testing (Future)
```typescript
// Playwright for critical user flows
import { test, expect } from '@playwright/test';

test('coach can mark attendance', async ({ page }) => {
  await page.goto('/attendance/scan');
  await page.click('button:has-text("Scan QR")');
  // ... simulate QR scan
  await expect(page.locator('.member-status')).toHaveClass('present');
});
```

---

## 19. API Versioning Strategy

```typescript
// Current: /api/v1/...
// Future: /api/v2/... (when breaking changes needed)

app.use('/api/v1', routerV1);
app.use('/api/v2', routerV2); // Future

// Client specifies version in header (alternative)
const version = req.headers['api-version'] || 'v1';
```

---

## 20. Next Steps

1. **Initialize monorepo structure**
2. **Set up backend with Express + MongoDB**
3. **Configure Firebase Authentication**
4. **Create core API endpoints**
5. **Build web admin dashboard**
6. **Develop mobile app with Expo**
7. **Implement cron jobs for automation**
8. **Deploy to staging environments**
9. **Conduct testing**
10. **Launch MVP**

---

**This architecture is designed to be:**
- ✅ Cost-effective (entirely on free tiers for MVP)
- ✅ Scalable (clear path to paid tiers as you grow)
- ✅ Maintainable (single developer can manage entire stack)
- ✅ Modern (uses latest best practices and tools)

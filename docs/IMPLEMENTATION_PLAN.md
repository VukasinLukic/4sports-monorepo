# 4SPORTS — IMPLEMENTATION PLAN

**Verzija:** 1.0
**Estimated Timeline:** 8-12 weeks (Solo Developer)
**Status:** Ready to Execute

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 0: Pre-Development Setup](#phase-0-pre-development-setup)
3. [Phase 1: Backend Foundation](#phase-1-backend-foundation)
4. [Phase 2: Authentication & User Management](#phase-2-authentication--user-management)
5. [Phase 3: Core Features - Invite System](#phase-3-core-features---invite-system)
6. [Phase 4: Groups & Members](#phase-4-groups--members)
7. [Phase 5: Events & Attendance](#phase-5-events--attendance)
8. [Phase 6: Payments & Medical Checks](#phase-6-payments--medical-checks)
9. [Phase 7: Web Admin Dashboard](#phase-7-web-admin-dashboard)
10. [Phase 8: Mobile App - Coach Interface](#phase-8-mobile-app---coach-interface)
11. [Phase 9: Mobile App - Parent Interface](#phase-9-mobile-app---parent-interface)
12. [Phase 10: Automation & Cron Jobs](#phase-10-automation--cron-jobs)
13. [Phase 11: Testing & Bug Fixes](#phase-11-testing--bug-fixes)
14. [Phase 12: Deployment & Launch](#phase-12-deployment--launch)
15. [Post-Launch](#post-launch)

---

## Overview

This implementation plan is designed for a solo developer building the 4Sports MVP from scratch. Each phase builds upon the previous one and includes:
- **External Tasks** (tasks outside the IDE: creating accounts, configuring services)
- **Development Tasks** (coding in IDE)
- **Testing Tasks** (validation and QA)
- **Time Estimates** (approximate hours for each phase)

### Estimated Total Time: 320-480 hours (8-12 weeks at 40 hours/week)

---

## Phase 0: Pre-Development Setup

**Goal:** Set up all external services and development environment.

**Estimated Time:** 4-6 hours

### External Tasks (Do these FIRST)

#### 0.1 Create Firebase Project
**Platform:** https://console.firebase.google.com

1. Go to Firebase Console
2. Click "Add project"
3. Enter project name: `4sports-mvp`
4. Disable Google Analytics (optional for MVP)
5. Click "Create project"
6. **Wait for project to be created**

#### 0.2 Enable Firebase Authentication
**Location:** Firebase Console > Build > Authentication

1. Click "Get started"
2. Go to "Sign-in method" tab
3. Enable "Email/Password" provider
4. Click "Save"

#### 0.3 Enable Firebase Storage
**Location:** Firebase Console > Build > Storage

1. Click "Get started"
2. Choose "Start in production mode"
3. Select location: `europe-west` (closest to Serbia)
4. Click "Done"
5. Go to "Rules" tab
6. Update rules to:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024; // 10MB limit
    }
  }
}
```
7. Click "Publish"

#### 0.4 Generate Firebase Admin SDK Credentials
**Location:** Firebase Console > Project Settings > Service Accounts

1. Click "Project settings" (gear icon)
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Click "Generate key" (downloads JSON file)
5. **IMPORTANT:** Rename file to `firebase-admin-key.json`
6. **IMPORTANT:** Keep this file secure, never commit to Git

#### 0.5 Get Firebase Web Config
**Location:** Firebase Console > Project Settings > General

1. Scroll to "Your apps" section
2. Click "Web" icon (</>) to add web app
3. Register app name: `4sports-web`
4. Copy the firebaseConfig object, save it somewhere:
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
5. Repeat for mobile app: `4sports-mobile`

#### 0.6 Create MongoDB Atlas Account
**Platform:** https://cloud.mongodb.com

1. Sign up with email or Google
2. Choose "Free" tier (M0 Sandbox)
3. Create organization: `4sports`
4. Create project: `4sports-mvp`
5. Click "Build a Database"
6. Choose "M0 Free" tier
7. Select provider: AWS
8. Select region: Frankfurt (eu-central-1) - closest to Serbia
9. Cluster name: `4sports-cluster`
10. Click "Create"
11. **Wait 3-5 minutes for cluster to be created**

#### 0.7 Configure MongoDB Atlas Access
**Location:** MongoDB Atlas Dashboard

1. **Set up Database User:**
   - Go to "Database Access" (left sidebar)
   - Click "Add New Database User"
   - Authentication Method: Password
   - Username: `4sports-admin`
   - Password: Click "Autogenerate Secure Password" and **save it**
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

2. **Set up Network Access:**
   - Go to "Network Access" (left sidebar)
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Description: `Development Access`
   - Click "Confirm"
   - **Note:** For production, restrict to specific IPs

3. **Get Connection String:**
   - Go to "Database" (left sidebar)
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Driver: Node.js, Version: 5.5 or later
   - Copy connection string:
   ```
   mongodb+srv://4sports-admin:<password>@4sports-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - **Replace `<password>` with the password you saved**
   - **Save this connection string**

#### 0.8 Create GitHub Repository
**Platform:** https://github.com

1. Sign in to GitHub
2. Click "New repository"
3. Repository name: `4sports-monorepo`
4. Description: `Sports club management platform`
5. Visibility: Private
6. **DO NOT** initialize with README (we already have files)
7. Click "Create repository"
8. **Save the repository URL** (e.g., `https://github.com/yourusername/4sports-monorepo.git`)

#### 0.9 Create Vercel Account
**Platform:** https://vercel.com

1. Sign up with GitHub account (easiest integration)
2. Authorize Vercel to access your GitHub
3. No need to create project yet (we'll do this during deployment)

#### 0.10 Create Render Account
**Platform:** https://render.com

1. Sign up with GitHub account
2. Authorize Render to access your GitHub
3. No need to create service yet (we'll do this during deployment)

#### 0.11 Create Resend Account
**Platform:** https://resend.com

1. Sign up with email
2. Verify your email
3. Go to "API Keys"
4. Click "Create API Key"
5. Name: `4sports-backend`
6. Permission: Full Access
7. Click "Create"
8. **Copy and save the API key** (starts with `re_...`)

#### 0.12 Optional: Create Expo Account
**Platform:** https://expo.dev

1. Sign up with email or GitHub
2. Verify your email
3. Create organization: `4sports` (optional)
4. No further setup needed for now

---

### Development Environment Setup

#### 0.13 Install Required Software

**Node.js:**
1. Download from https://nodejs.org (LTS version, currently 20.x)
2. Run installer
3. Verify: Open terminal and run `node --version` (should show v20.x.x)

**Git:**
1. Download from https://git-scm.com
2. Run installer
3. Verify: `git --version`

**VS Code:**
1. Download from https://code.visualstudio.com
2. Install extensions:
   - ESLint
   - Prettier
   - TypeScript and JavaScript Language Features
   - Tailwind CSS IntelliSense
   - MongoDB for VS Code (optional)

#### 0.14 Initialize Git Repository (Local)

**Location:** Your working directory

Open terminal in `C:\Users\Vukasin\Documents\git projekti\4sports-monorepo`:

```bash
# Initialize git if not already done
git init

# Create .gitignore file
echo "node_modules/
.env
*.log
dist/
build/
.DS_Store
firebase-admin-key.json
.expo/
.expo-shared/
*.jks
*.p8
*.p12
*.mobileprovision
*.orig.*" > .gitignore

# Stage all files
git add .

# Initial commit
git commit -m "Initial commit: Project documentation and structure"

# Add remote repository (replace with your GitHub URL)
git remote add origin https://github.com/yourusername/4sports-monorepo.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Phase 1: Backend Foundation

**Goal:** Create the basic backend structure with database connection.

**Estimated Time:** 8-10 hours

### Development Tasks

#### 1.1 Initialize Backend Project

**Location:** Terminal in project root

```bash
# Create backend directory if it doesn't exist
mkdir backend
cd backend

# Initialize Node.js project
npm init -y

# Install core dependencies
npm install express mongoose dotenv cors helmet express-rate-limit

# Install Firebase Admin SDK
npm install firebase-admin

# Install TypeScript and dev dependencies
npm install -D typescript @types/node @types/express @types/cors ts-node nodemon

# Initialize TypeScript
npx tsc --init
```

#### 1.2 Configure TypeScript

**File:** `backend/tsconfig.json`

Replace content with:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### 1.3 Create Folder Structure

**Location:** `backend/src/`

```bash
# Create all folders
mkdir -p src/config
mkdir -p src/models
mkdir -p src/controllers
mkdir -p src/routes
mkdir -p src/middleware
mkdir -p src/services
mkdir -p src/utils
mkdir -p src/types
```

#### 1.4 Create Environment Configuration

**File:** `backend/.env`

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb+srv://4sports-admin:<YOUR_PASSWORD>@4sports-cluster.xxxxx.mongodb.net/4sports?retryWrites=true&w=majority

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Resend API Key
RESEND_API_KEY=re_your_api_key_here

# Frontend URLs (for CORS)
WEB_ADMIN_URL=http://localhost:5173
MOBILE_APP_URL=exp://localhost:19000
```

**File:** `backend/.env.example` (copy of above with placeholder values)

#### 1.5 Create Database Connection

**File:** `backend/src/config/db.ts`

```typescript
import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI!);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};
```

#### 1.6 Create Firebase Configuration

**File:** `backend/src/config/firebase.ts`

```typescript
import admin from 'firebase-admin';
import path from 'path';

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../../firebase-admin-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

export const auth = admin.auth();
export const storage = admin.storage();
export const bucket = storage.bucket();

export default admin;
```

**IMPORTANT:** Copy your `firebase-admin-key.json` file to `backend/` directory.

#### 1.7 Create Main Server File

**File:** `backend/src/index.ts`

```typescript
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.WEB_ADMIN_URL!,
    process.env.MOBILE_APP_URL!,
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  });
});

// API routes (will be added later)
app.use('/api/v1', (req, res) => {
  res.json({ message: 'API v1 - Coming soon' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
```

#### 1.8 Update Package.json Scripts

**File:** `backend/package.json`

Add these scripts:
```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

#### 1.9 Test Backend

**Terminal:**
```bash
cd backend
npm run dev
```

**Expected Output:**
```
Server running in development mode on port 5000
MongoDB Connected: 4sports-cluster-xxxxx.mongodb.net
```

**Test in Browser:**
Navigate to `http://localhost:5000/health`

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "version": "1.0.0"
  }
}
```

✅ **Phase 1 Complete** - Backend foundation is running!

---

## Phase 2: Authentication & User Management

**Goal:** Implement Firebase authentication and user CRUD operations.

**Estimated Time:** 10-12 hours

### Development Tasks

#### 2.1 Create User Model

**File:** `backend/src/models/User.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: 'OWNER' | 'COACH' | 'PARENT';
  clubId?: mongoose.Types.ObjectId;
  profileImage?: string;
  pushToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
    },
    role: {
      type: String,
      enum: ['OWNER', 'COACH', 'PARENT'],
      required: true,
    },
    clubId: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
    },
    profileImage: {
      type: String,
    },
    pushToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', UserSchema);
```

#### 2.2 Create Club Model

**File:** `backend/src/models/Club.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IClub extends Document {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  address?: string;
  phoneNumber?: string;
  email?: string;
  subscriptionPlan: 'FREE' | 'BASIC' | 'PRO';
  memberLimit: number;
  currentMembers: number;
  createdAt: Date;
  updatedAt: Date;
}

const ClubSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    address: String,
    phoneNumber: String,
    email: String,
    subscriptionPlan: {
      type: String,
      enum: ['FREE', 'BASIC', 'PRO'],
      default: 'FREE',
    },
    memberLimit: {
      type: Number,
      default: 50, // FREE tier default
    },
    currentMembers: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IClub>('Club', ClubSchema);
```

#### 2.3 Create Auth Middleware

**File:** `backend/src/middleware/authMiddleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authentication token provided',
        },
      });
      return;
    }

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token);

    // Get user from database
    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found in database',
        },
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }
};
```

#### 2.4 Create Auth Controller

**File:** `backend/src/controllers/authController.ts`

```typescript
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';
import Club from '../models/Club';
import { auth } from '../config/firebase';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firebaseToken, email, fullName, phoneNumber, role, inviteCode } = req.body;

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(firebaseToken);

    // Check if user already exists
    const existingUser = await User.findOne({ firebaseUid: decodedToken.uid });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User already registered',
        },
      });
      return;
    }

    // TODO: Validate invite code (Phase 3)
    // For now, if role is OWNER, create a new club
    let clubId;
    if (role === 'OWNER') {
      const club = await Club.create({
        name: `${fullName}'s Club`, // Temporary name
        ownerId: null, // Will be updated after user creation
        subscriptionPlan: 'FREE',
        memberLimit: 50,
      });
      clubId = club._id;
    }

    // Create user
    const user = await User.create({
      firebaseUid: decodedToken.uid,
      email,
      fullName,
      phoneNumber,
      role,
      clubId,
    });

    // Update club owner
    if (role === 'OWNER' && clubId) {
      await Club.findByIdAndUpdate(clubId, { ownerId: user._id });
    }

    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          firebaseUid: user.firebaseUid,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          clubId: user.clubId,
        },
        token: firebaseToken, // Client already has this
      },
      message: 'User registered successfully',
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error.message,
      },
    });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firebaseToken } = req.body;

    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(firebaseToken);

    // Find user
    const user = await User.findOne({ firebaseUid: decodedToken.uid }).populate('clubId');

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found. Please register first.',
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          clubId: user.clubId,
        },
        token: firebaseToken,
      },
      message: 'Login successful',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error.message,
      },
    });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id).populate('clubId').select('-__v');

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error.message,
      },
    });
  }
};
```

#### 2.5 Create Auth Routes

**File:** `backend/src/routes/authRoutes.ts`

```typescript
import express from 'express';
import { register, login, getCurrentUser } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getCurrentUser);

export default router;
```

#### 2.6 Create Main Router

**File:** `backend/src/routes/index.ts`

```typescript
import express from 'express';
import authRoutes from './authRoutes';

const router = express.Router();

router.use('/auth', authRoutes);

export default router;
```

#### 2.7 Update Main Server File

**File:** `backend/src/index.ts`

Update the API routes section:
```typescript
import routes from './routes';

// Replace the placeholder API routes with:
app.use('/api/v1', routes);
```

#### 2.8 Test Authentication

**Using Postman or curl:**

1. **First, create a user in Firebase:**
   - Go to Firebase Console > Authentication > Users
   - Click "Add user"
   - Email: `test@example.com`
   - Password: `Test123!`
   - Click "Add user"
   - **Copy the UID**

2. **Get Firebase ID Token:**
   - You need to use Firebase REST API or client SDK
   - For testing, use Firebase Web SDK temporarily
   - Or use this test endpoint (create it temporarily):

**File:** `backend/src/routes/authRoutes.ts` (temporary test route)

```typescript
router.post('/test-register', async (req, res) => {
  // This is just for testing - remove in production
  const { email, password, fullName, role } = req.body;

  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName,
    });

    const customToken = await auth.createCustomToken(userRecord.uid);

    res.json({
      uid: userRecord.uid,
      customToken, // Client can exchange this for ID token
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
```

✅ **Phase 2 Complete** - Authentication system is working!

---

## Phase 3: Core Features - Invite System

**Goal:** Implement invite code generation and validation.

**Estimated Time:** 6-8 hours

### Development Tasks

#### 3.1 Create InviteCode Model

**File:** `backend/src/models/InviteCode.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IInviteCode extends Document {
  code: string;
  type: 'COACH' | 'MEMBER';
  clubId: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  expiresAt: Date;
  usedCount: number;
  maxUses?: number;
  createdAt: Date;
}

const InviteCodeSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['COACH', 'MEMBER'],
      required: true,
    },
    clubId: {
      type: Schema.Types.ObjectId,
      ref: 'Club',
      required: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    maxUses: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IInviteCode>('InviteCode', InviteCodeSchema);
```

#### 3.2 Create Invite Code Controller

**File:** `backend/src/controllers/inviteController.ts`

```typescript
import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import InviteCode from '../models/InviteCode';
import Club from '../models/Club';
import crypto from 'crypto';

const generateCode = (): string => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

export const generateInviteCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, clubId, groupId, expiresInDays = 30, maxUses } = req.body;

    // Validate permissions
    if (type === 'COACH' && req.user.role !== 'OWNER') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only club owners can generate coach invite codes',
        },
      });
      return;
    }

    if (type === 'MEMBER' && !['OWNER', 'COACH'].includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only owners and coaches can generate member invite codes',
        },
      });
      return;
    }

    // Generate unique code
    let code = generateCode();
    let codeExists = await InviteCode.findOne({ code });
    while (codeExists) {
      code = generateCode();
      codeExists = await InviteCode.findOne({ code });
    }

    // Calculate expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create invite code
    const inviteCode = await InviteCode.create({
      code,
      type,
      clubId: clubId || req.user.clubId,
      groupId: type === 'MEMBER' ? groupId : undefined,
      createdBy: req.user._id,
      expiresAt,
      maxUses,
    });

    res.status(201).json({
      success: true,
      data: inviteCode,
      message: 'Invite code generated successfully',
    });
  } catch (error: any) {
    console.error('Generate invite code error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error.message,
      },
    });
  }
};

export const validateInviteCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { code } = req.body;

    const inviteCode = await InviteCode.findOne({ code })
      .populate('clubId')
      .populate('groupId');

    if (!inviteCode) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Invite code not found',
        },
      });
      return;
    }

    // Check if active
    if (!inviteCode.isActive) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Invite code is inactive',
        },
      });
      return;
    }

    // Check if expired
    if (new Date() > inviteCode.expiresAt) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Invite code has expired',
        },
      });
      return;
    }

    // Check max uses
    if (inviteCode.maxUses && inviteCode.usedCount >= inviteCode.maxUses) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Invite code has reached maximum uses',
        },
      });
      return;
    }

    // Check club member limit
    const club = await Club.findById(inviteCode.clubId);
    const canAcceptMembers = club && club.currentMembers < club.memberLimit;

    res.status(200).json({
      success: true,
      data: {
        isValid: true,
        type: inviteCode.type,
        club: {
          _id: club?._id,
          name: club?.name,
          canAcceptMembers,
        },
        group: inviteCode.groupId,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error.message,
      },
    });
  }
};

// Add more controller methods...
```

#### 3.3 Create Invite Routes

**File:** `backend/src/routes/inviteRoutes.ts`

```typescript
import express from 'express';
import { generateInviteCode, validateInviteCode } from '../controllers/inviteController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/generate', protect, generateInviteCode);
router.post('/validate', validateInviteCode); // Public endpoint

export default router;
```

#### 3.4 Update Main Router

**File:** `backend/src/routes/index.ts`

```typescript
import inviteRoutes from './inviteRoutes';

router.use('/invites', inviteRoutes);
```

✅ **Phase 3 Complete** - Invite system is working!

---

## Phase 4: Groups & Members

**Goal:** Implement group and member management.

**Estimated Time:** 10-12 hours

*Due to length constraints, I'll provide a summary for remaining phases.*

### Key Models to Create:
- **Group.ts** - Training groups
- **Member.ts** - Athletes/members with QR codes

### Key Controllers:
- **groupController.ts** - CRUD operations for groups
- **memberController.ts** - CRUD operations for members, QR generation

### Important Features:
- Auto-generate unique QR code for each member
- Check club member limit before creating member
- Increment/decrement club's `currentMembers` count

---

## Phase 5: Events & Attendance

**Estimated Time:** 12-14 hours

### Key Models:
- **Event.ts** - Trainings and competitions
- **Attendance.ts** - Attendance records

### Key Features:
- Calendar event creation
- QR code scanning for attendance
- Manual attendance marking
- Attendance statistics

---

## Phase 6: Payments & Medical Checks

**Estimated Time:** 10-12 hours

### Key Models:
- **Payment.ts** - Payment records
- **MedicalCheck.ts** - Medical examination records

### Key Features:
- Record payments and update member status
- Send payment reminders (push notifications)
- Track medical examination expiration
- Warning notifications for expiring medical checks

---

## Phase 7: Web Admin Dashboard

**Estimated Time:** 40-50 hours

### Setup Steps:

#### 7.1 Initialize Web Project

```bash
cd ..
npm create vite@latest web-admin -- --template react-ts
cd web-admin
npm install

# Install dependencies
npm install react-router-dom @tanstack/react-query axios
npm install tailwindcss postcss autoprefixer
npm install recharts lucide-react
npm install -D @types/node

# Initialize Tailwind
npx tailwindcss init -p
```

#### 7.2 Install shadcn/ui

```bash
npx shadcn-ui@latest init
```

Follow prompts, choose:
- TypeScript: Yes
- Style: Default
- Base color: Slate
- CSS variables: Yes

#### 7.3 Add shadcn components

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add form
```

#### 7.4 Configure Firebase (Web)

```bash
npm install firebase
```

Create `src/config/firebase.ts` with your Firebase config from Phase 0.

#### 7.5 Key Features to Build:
- Dashboard with KPI cards and charts
- Member management (list, add, edit, delete)
- Financial overview and manual entry
- Coach management and contracts
- Settings and subscription management

---

## Phase 8: Mobile App - Coach Interface

**Estimated Time:** 50-60 hours

### Setup Steps:

#### 8.1 Initialize Expo Project

```bash
cd ..
npx create-expo-app mobile-app --template blank-typescript
cd mobile-app

# Install dependencies
npx expo install expo-router expo-camera expo-image-picker
npx expo install react-native-qrcode-svg
npx expo install @react-native-async-storage/async-storage
npx expo install expo-notifications
npm install axios @tanstack/react-query
npm install firebase
```

#### 8.2 Configure Expo Router

Update `app.json` for Expo Router configuration.

#### 8.3 Key Screens to Build:
- Login/Register with invite code
- Dashboard (coach view)
- Calendar with events
- QR scanner for attendance
- Member list with payment/medical status
- Payment recording
- Medical check recording
- News feed creation

---

## Phase 9: Mobile App - Parent Interface

**Estimated Time:** 20-25 hours

### Key Screens:
- Home screen with member profile
- QR code display for check-in
- Calendar with attendance status
- Payment status view
- Medical check status
- News feed view

---

## Phase 10: Automation & Cron Jobs

**Estimated Time:** 8-10 hours

### Setup:

#### 10.1 Install node-cron

```bash
cd backend
npm install node-cron
npm install -D @types/node-cron
```

#### 10.2 Create Cron Jobs

**File:** `backend/src/utils/cronJobs.ts`

```typescript
import cron from 'node-cron';
import Member from '../models/Member';
import MedicalCheck from '../models/MedicalCheck';
// Import notification service

// Reset payment status every 1st of month at midnight
export const resetPaymentStatus = cron.schedule('0 0 1 * *', async () => {
  console.log('Running payment status reset...');
  await Member.updateMany(
    { isActive: true },
    { paymentStatus: false }
  );
  // Send notifications to coaches
});

// Check medical expiration daily at midnight
export const checkMedicalExpiration = cron.schedule('0 0 * * *', async () => {
  console.log('Checking medical expirations...');

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  await Member.updateMany(
    { lastMedicalDate: { $lte: oneYearAgo } },
    { medicalStatus: false }
  );

  // Send notifications for expiring medicals (within 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Find and notify
});

export const startCronJobs = () => {
  resetPaymentStatus.start();
  checkMedicalExpiration.start();
  console.log('Cron jobs started');
};
```

#### 10.3 Start Cron Jobs

**File:** `backend/src/index.ts`

```typescript
import { startCronJobs } from './utils/cronJobs';

// After database connection
startCronJobs();
```

---

## Phase 11: Testing & Bug Fixes

**Estimated Time:** 20-30 hours

### Testing Checklist:

#### Backend API Testing:
- [ ] Test all auth endpoints
- [ ] Test invite code flow
- [ ] Test member creation (with limit check)
- [ ] Test attendance marking (QR and manual)
- [ ] Test payment recording
- [ ] Test medical check recording
- [ ] Test cron jobs manually

#### Web Admin Testing:
- [ ] Test dashboard data loading
- [ ] Test member CRUD operations
- [ ] Test charts rendering
- [ ] Test finance entry
- [ ] Test responsive design

#### Mobile App Testing:
- [ ] Test login/register flow
- [ ] Test QR scanning
- [ ] Test calendar view
- [ ] Test push notifications
- [ ] Test offline behavior

---

## Phase 12: Deployment & Launch

**Estimated Time:** 10-15 hours

### 12.1 Deploy Backend to Render

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** `4sports-api`
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install && npm run build`
   - **Start Command:** `cd backend && npm start`
   - **Instance Type:** Free
5. Add Environment Variables (from your `.env`)
6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. **Copy the URL** (e.g., `https://4sports-api.onrender.com`)

### 12.2 Update Frontend API URLs

**File:** `web-admin/src/config/api.ts`

```typescript
const API_URL = import.meta.env.PROD
  ? 'https://4sports-api.onrender.com/api/v1'
  : 'http://localhost:5000/api/v1';
```

**File:** `mobile-app/src/config/api.ts`

```typescript
const API_URL = 'https://4sports-api.onrender.com/api/v1';
```

### 12.3 Deploy Web Admin to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `web-admin`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add Environment Variables (Firebase config)
6. Click "Deploy"
7. Wait for deployment (2-3 minutes)
8. **Copy the URL** (e.g., `https://4sports-admin.vercel.app`)

### 12.4 Build Mobile App with EAS

```bash
cd mobile-app

# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for Android (APK for testing)
eas build --platform android --profile preview

# Build for iOS (requires Apple Developer account)
eas build --platform ios --profile preview

# Wait for build (15-30 minutes)
# Download APK/IPA when ready
```

### 12.5 Set up UptimeRobot

1. Go to https://uptimerobot.com
2. Sign up (free account)
3. Add New Monitor:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** 4Sports API
   - **URL:** `https://4sports-api.onrender.com/health`
   - **Monitoring Interval:** 5 minutes
4. Click "Create Monitor"
5. This will keep your Render service awake on free tier

---

## Post-Launch

### Immediate Tasks (Week 1):

1. **Monitor Error Logs:**
   - Check Render logs daily
   - Check Firebase Console for auth issues
   - Monitor MongoDB Atlas metrics

2. **Gather Feedback:**
   - Test with real users (a small pilot club)
   - Document bugs and feature requests

3. **Quick Fixes:**
   - Address critical bugs
   - Improve UX based on feedback

### Short-term Improvements (Month 1-3):

1. **Performance Optimization:**
   - Add Redis caching for frequently accessed data
   - Optimize MongoDB queries with proper indexing
   - Implement pagination everywhere

2. **Enhanced Features:**
   - Add export functionality (Excel/PDF)
   - Implement search functionality
   - Add data visualization improvements

3. **Testing:**
   - Add unit tests for critical functions
   - Add integration tests for API endpoints
   - Set up CI/CD pipeline

### Long-term Roadmap (Month 3+):

1. **Scale Infrastructure:**
   - Upgrade MongoDB to paid tier
   - Upgrade Render to prevent sleep
   - Implement CDN for media files

2. **New Features:**
   - Real-time updates with WebSockets
   - Advanced analytics and reports
   - Multi-language support
   - Mobile app submission to stores

3. **Business Development:**
   - Create marketing website
   - Set up payment processing for subscriptions
   - Develop pricing tiers

---

## Development Best Practices

### Code Organization:
- Keep components small and focused
- Use TypeScript strictly (no `any` types)
- Write meaningful commit messages
- Document complex logic

### Git Workflow:
```bash
# Create feature branch
git checkout -b feature/attendance-qr-scan

# Make changes and commit
git add .
git commit -m "feat: implement QR code scanning for attendance"

# Push to GitHub
git push origin feature/attendance-qr-scan

# Merge to main when done
git checkout main
git merge feature/attendance-qr-scan
```

### Error Handling:
- Always use try-catch in async functions
- Return consistent error responses
- Log errors with context
- Never expose sensitive data in errors

### Security:
- Never commit `.env` files
- Never commit `firebase-admin-key.json`
- Always validate user input
- Implement rate limiting
- Use HTTPS in production

---

## Troubleshooting Common Issues

### MongoDB Connection Issues:
```bash
# Check connection string format
# Ensure IP whitelist includes your IP
# Verify database user credentials
```

### Firebase Auth Issues:
```bash
# Verify Firebase project ID
# Check if auth provider is enabled
# Ensure firebase-admin-key.json is correct
```

### Build Issues:
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear TypeScript cache
rm -rf dist
npm run build
```

### Render Deployment Issues:
- Check build logs in Render dashboard
- Verify environment variables are set
- Ensure start command is correct

---

## Time Tracking Summary

| Phase | Task | Hours |
|-------|------|-------|
| 0 | Pre-Development Setup | 4-6 |
| 1 | Backend Foundation | 8-10 |
| 2 | Authentication & User Management | 10-12 |
| 3 | Invite System | 6-8 |
| 4 | Groups & Members | 10-12 |
| 5 | Events & Attendance | 12-14 |
| 6 | Payments & Medical Checks | 10-12 |
| 7 | Web Admin Dashboard | 40-50 |
| 8 | Mobile App - Coach | 50-60 |
| 9 | Mobile App - Parent | 20-25 |
| 10 | Automation & Cron Jobs | 8-10 |
| 11 | Testing & Bug Fixes | 20-30 |
| 12 | Deployment & Launch | 10-15 |
| **Total** | **All Phases** | **320-480 hours** |

---

## Success Criteria

### MVP is Complete When:
- ✅ Owner can create club and generate coach invite codes
- ✅ Coaches can register and create groups
- ✅ Coaches can generate member invite codes
- ✅ Parents can register and add members
- ✅ Coaches can create events (trainings/competitions)
- ✅ Coaches can mark attendance via QR scan or manually
- ✅ Coaches can record payments and medical checks
- ✅ Payment status auto-resets monthly
- ✅ Medical status auto-expires yearly
- ✅ Push notifications work for reminders
- ✅ Owner can view dashboard with KPIs and charts
- ✅ Owner can view all financial data
- ✅ All apps deployed and accessible online

---

**This implementation plan is a living document. Update it as you progress and adjust timelines based on actual experience.**

**Good luck with your 4Sports MVP development! 🚀**

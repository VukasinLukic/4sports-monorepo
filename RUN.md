# Pokretanje 4Sports projekta

## 1. Setup (prvi put)

```bash
# Backend
cd backend
npm install
cp ../.env.example .env   # popuni .env sa svojim vrednostima

# Web Admin
cd ../web-admin
npm install
# napravi web-admin/.env sa VITE_ varijablama

# Mobile App
cd ../mobile-app
npm install
# napravi mobile-app/.env sa EXPO_PUBLIC_ varijablama
```

## 2. Pokretanje

### Backend (port 5000)
```bash
cd backend
npm run dev
```

### Web Admin (port 5173)
```bash
cd web-admin
npm run dev
```

### Mobile App (Expo)
```bash
cd mobile-app
npm start
# ili: npm run android / npm run ios
```

## 3. Potrebne .env varijable

**backend/.env:**
- `MONGODB_URI` - MongoDB connection string
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `JWT_SECRET`
- `PORT=5000`

**web-admin/.env:**
- `VITE_API_URL=http://localhost:5000/api/v1`
- `VITE_FIREBASE_*` varijable

**mobile-app/.env:**
- `EXPO_PUBLIC_API_URL=http://localhost:5000/api/v1`
- `EXPO_PUBLIC_FIREBASE_*` varijable

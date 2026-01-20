# 4Sports Web Admin Dashboard

Web admin dashboard for sports club owners built with React, TypeScript, and Vite.

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **React Router** - Client-side routing
- **Firebase** - Authentication
- **Axios** - HTTP client
- **TanStack Query** - Data fetching
- **Recharts** - Data visualization
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Add your Firebase configuration to `.env`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456:web:abcdef

VITE_API_URL=http://localhost:5000/api/v1
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
web-admin/
├── src/
│   ├── assets/          # Static assets (images, fonts)
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   ├── layout/      # Layout components (Sidebar, Header)
│   │   ├── charts/      # Chart components (Recharts)
│   │   └── shared/      # Shared/reusable components
│   ├── features/        # Feature-based modules
│   │   ├── auth/        # Authentication (Login, Register)
│   │   ├── dashboard/   # Dashboard page
│   │   ├── members/     # Members management
│   │   ├── coaches/     # Coaches management
│   │   ├── finances/    # Financial reports
│   │   └── settings/    # Settings
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities (cn helper)
│   ├── services/        # API services (auth, api)
│   ├── types/           # TypeScript types
│   ├── config/          # App configuration (Firebase)
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Public assets
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies
```

## Features

### Phase 1 ✅
- Vite + React + TypeScript setup
- TailwindCSS with custom 4Sports brand colors
- shadcn/ui component library
- Recharts and Lucide icons
- Project folder structure

### Phase 2 ✅
- Firebase Authentication integration
- Login and Register pages
- Protected routes
- API service with Axios interceptors
- Auth Context for global state

### Phase 3 ✅
- Dashboard layout with sidebar
- Responsive navigation
- Header with user dropdown
- Dark mode support

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | `AIza...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | `1:123:web:abc` |
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api/v1` |

## Deployment

This project is configured for deployment on **Vercel**.

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to `main` branch

## License

Private - 4Sports Team

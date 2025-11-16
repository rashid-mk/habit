# Habit Experiment Tracker

A data-driven habit tracking system that enables users to run 30-day habit experiments with daily check-ins, smart reminders, and meaningful analytics.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Backend**: Firebase (Auth, Firestore, Cloud Functions, Hosting)
- **Date Handling**: Day.js

## Prerequisites

- Node.js 18+ and npm
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project (create one at https://console.firebase.google.com)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
cd functions && npm install && cd ..
```

### 2. Configure Firebase

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password and Google providers)
3. Create a Firestore database
4. Copy your Firebase config from Project Settings > General > Your apps

### 3. Set Environment Variables

1. Copy `.env.example` to `.env.local`
2. Update `.env.local` with your Firebase project credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Initialize Firebase (if not already done)

```bash
firebase login
firebase init
```

Select:
- Firestore
- Functions
- Hosting

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at http://localhost:5173

### 6. Run with Firebase Emulators (Optional)

For local development with Firebase emulators:

1. Update `.env.local`:
```env
VITE_USE_FIREBASE_EMULATORS=true
```

2. Start emulators:
```bash
firebase emulators:start
```

3. In another terminal, start the dev server:
```bash
npm run dev
```

## Project Structure

```
├── src/
│   ├── config/
│   │   └── firebase.ts          # Firebase initialization
│   ├── App.tsx                   # Main app component
│   ├── main.tsx                  # Entry point
│   └── style.css                 # Global styles (Tailwind)
├── functions/
│   └── src/
│       └── index.ts              # Cloud Functions
├── public/                       # Static assets
├── firebase.json                 # Firebase configuration
├── firestore.rules              # Firestore security rules
├── firestore.indexes.json       # Firestore indexes
└── .env.local                   # Environment variables (not in git)
```

## Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run TypeScript checks
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

### Firebase Emulators
- `npm run emulators` - Start Firebase emulators

### Deployment
- `npm run deploy` - Build and deploy everything
- `npm run deploy:hosting` - Deploy frontend only
- `npm run deploy:functions` - Deploy Cloud Functions only
- `npm run deploy:rules` - Deploy Firestore rules only
- `npm run deploy:all` - Run tests, build, and deploy everything
- `npm run deploy:check` - Dry run deployment

### Scripts (Windows & Unix)
- `./scripts/deploy.sh [env] [component]` - Deploy with checks (Unix/Mac)
- `.\scripts\deploy.ps1 [env] [component]` - Deploy with checks (Windows)
- `./scripts/setup-env.sh` - Set up Cloud Function environment variables (Unix/Mac)
- `.\scripts\setup-env.ps1` - Set up Cloud Function environment variables (Windows)
- `./scripts/verify-deployment.sh [project-id]` - Verify deployment (Unix/Mac)
- `.\scripts\verify-deployment.ps1 [project-id]` - Verify deployment (Windows)

## Features

- ✅ Project structure and Firebase configuration
- ✅ User authentication (Email/Password, Google OAuth)
- ✅ Habit creation and management
- ✅ Daily check-in functionality
- ✅ Analytics dashboard (streaks, completion rate)
- ✅ Timeline visualization
- ✅ Push notifications and reminders
- ✅ Offline support
- ✅ Error handling and loading states
- ✅ Performance monitoring
- ✅ Security rules and rate limiting

## Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Quick Deploy

1. **Set up Firebase project**:
   ```bash
   firebase login
   firebase use --add  # Select your project
   ```

2. **Configure environment variables**:
   ```bash
   # Unix/Mac
   ./scripts/setup-env.sh
   
   # Windows
   .\scripts\setup-env.ps1
   ```

3. **Deploy**:
   ```bash
   # Deploy everything
   npm run deploy:all
   
   # Or use the deployment script
   ./scripts/deploy.sh production all    # Unix/Mac
   .\scripts\deploy.ps1 production all   # Windows
   ```

4. **Verify deployment**:
   ```bash
   # Unix/Mac
   ./scripts/verify-deployment.sh
   
   # Windows
   .\scripts\verify-deployment.ps1
   ```

### Deployment Checklist

Before deploying to production, review [.deployment-checklist.md](./.deployment-checklist.md) to ensure:
- All tests pass
- Security rules are configured
- Environment variables are set
- Performance is optimized

## Firebase Services Configuration

### Firestore Offline Persistence

Offline persistence is automatically enabled in `src/config/firebase.ts`. This allows:
- Caching of habit and check-in data
- Offline check-ins that sync when online
- Improved performance and user experience

### Security Rules

Firestore security rules are defined in `firestore.rules`:
- Users can only access their own data
- Analytics documents are read-only (updated by Cloud Functions)
- All operations require authentication

## Monitoring and Alerts

The application includes comprehensive monitoring and alerting capabilities:

### Setup Monitoring

```bash
# Linux/Mac
./scripts/setup-monitoring.sh

# Windows
.\scripts\setup-monitoring.ps1
```

### View Metrics

```bash
# Interactive metrics viewer
./scripts/view-metrics.sh          # Linux/Mac
.\scripts\view-metrics.ps1         # Windows
```

### Health Check

Test the health check endpoint:
```bash
curl https://REGION-PROJECT_ID.cloudfunctions.net/healthCheck
```

### Documentation

- **[Monitoring Guide](MONITORING.md)** - Complete monitoring setup and usage
- **[Alert Configuration](docs/ALERT_CONFIGURATION.md)** - Step-by-step alert setup
- **[Quick Reference](docs/MONITORING_QUICK_REFERENCE.md)** - Common commands and queries

### Key Features

- Structured JSON logging for all Cloud Functions
- Log-based metrics for error rates, latency, and delivery rates
- Health check endpoint for uptime monitoring
- Performance monitoring with Firebase Performance
- Firestore usage tracking
- FCM notification delivery monitoring

## License

MIT

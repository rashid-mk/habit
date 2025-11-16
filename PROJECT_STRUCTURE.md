# Project Structure

This document describes the structure of the Habit Experiment Tracker project.

## Root Directory

```
habit-experiment-tracker/
├── .kiro/                      # Kiro specs and configuration
│   └── specs/
│       └── habit-experiment-mvp/
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
├── functions/                  # Firebase Cloud Functions
│   ├── src/
│   │   └── index.ts           # Cloud Functions entry point
│   ├── .gitignore
│   ├── package.json
│   └── tsconfig.json
├── public/                     # Static assets
│   └── vite.svg
├── src/                        # React application source
│   ├── config/
│   │   └── firebase.ts        # Firebase initialization & config
│   ├── App.tsx                # Main app component
│   ├── main.tsx               # React entry point
│   ├── style.css              # Global styles (Tailwind)
│   └── vite-env.d.ts          # Vite environment types
├── .env.example               # Environment variables template
├── .env.local                 # Local environment variables (not in git)
├── .firebaserc                # Firebase project configuration
├── .gitignore                 # Git ignore rules
├── firebase.json              # Firebase services configuration
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore indexes
├── index.html                 # HTML entry point
├── package.json               # Frontend dependencies
├── postcss.config.js          # PostCSS configuration
├── quick-start.md             # Quick start guide
├── README.md                  # Project documentation
├── SETUP.md                   # Detailed setup guide
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── tsconfig.node.json         # TypeScript config for Node
└── vite.config.ts             # Vite configuration
```

## Key Files Explained

### Configuration Files

- **firebase.json**: Configures Firebase services (Hosting, Firestore, Functions, Emulators)
- **firestore.rules**: Security rules ensuring users can only access their own data
- **firestore.indexes.json**: Database indexes for optimized queries
- **.firebaserc**: Links the project to a Firebase project ID
- **vite.config.ts**: Vite bundler configuration with React plugin
- **tailwind.config.js**: Tailwind CSS configuration
- **postcss.config.js**: PostCSS plugins (Tailwind + Autoprefixer)
- **tsconfig.json**: TypeScript compiler options for the frontend
- **tsconfig.node.json**: TypeScript config for Vite config files

### Environment Files

- **.env.example**: Template showing required environment variables
- **.env.local**: Actual environment variables (gitignored, must be created)

### Source Files

#### Frontend (src/)

- **main.tsx**: React application entry point, renders App component
- **App.tsx**: Root component with React Query and Router setup
- **style.css**: Global styles with Tailwind directives
- **vite-env.d.ts**: TypeScript definitions for Vite environment variables
- **config/firebase.ts**: Firebase SDK initialization with offline persistence

#### Backend (functions/)

- **src/index.ts**: Cloud Functions entry point (placeholder for now)
- **package.json**: Cloud Functions dependencies
- **tsconfig.json**: TypeScript config for Cloud Functions

### Documentation

- **README.md**: Project overview and basic instructions
- **SETUP.md**: Comprehensive setup guide
- **quick-start.md**: Quick 5-minute setup guide
- **PROJECT_STRUCTURE.md**: This file

## Technology Stack

### Frontend
- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **TailwindCSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **React Query**: Server state management and caching
- **Firebase SDK**: Client-side Firebase integration
- **Day.js**: Date manipulation library

### Backend
- **Firebase Authentication**: User authentication
- **Firestore**: NoSQL database with offline support
- **Cloud Functions**: Serverless backend logic
- **Firebase Hosting**: Static site hosting
- **Cloud Tasks**: Scheduled notifications (to be implemented)
- **Firebase Cloud Messaging**: Push notifications (to be implemented)

## Development Workflow

### Local Development
1. Run `npm run dev` to start Vite dev server
2. App runs at http://localhost:5173
3. Hot module replacement for instant updates

### With Emulators
1. Run `npm run emulators` to start Firebase emulators
2. Run `npm run dev` in another terminal
3. Emulator UI at http://localhost:4000

### Building
1. Run `npm run build` to create production build
2. Output in `dist/` directory
3. Run `npm run preview` to preview production build

### Deployment
1. Run `npm run deploy` to deploy everything
2. Or use specific deploy commands:
   - `npm run deploy:hosting` - Deploy frontend only
   - `npm run deploy:functions` - Deploy Cloud Functions only
   - `npm run deploy:rules` - Deploy Firestore rules only

## Firebase Services Configuration

### Firestore Structure
```
/users/{uid}
  - User profile document
  /habits/{habitId}
    - Habit document
    /checks/{dateKey}
      - Check-in document
    /analytics
      - Analytics summary document
```

### Security Rules
- All data requires authentication
- Users can only access their own data
- Analytics documents are read-only (Cloud Functions write)

### Offline Persistence
- Enabled in `src/config/firebase.ts`
- Caches data for offline access
- Syncs when connection restored

## Next Steps

Refer to `.kiro/specs/habit-experiment-mvp/tasks.md` for the implementation plan:

1. ✅ Task 1: Initialize project structure (COMPLETED)
2. ⏳ Task 2: Implement authentication system
3. ⏳ Task 3: Build habit creation functionality
4. ⏳ Task 4: Implement dashboard and habit display
5. ⏳ Task 5: Implement daily check-in functionality
6. ⏳ Task 6: Build timeline graph visualization
7. ⏳ Task 7: Implement Cloud Functions for backend logic
8. ⏳ Task 8: Implement reminder notification system
9. ⏳ Task 9: Implement security rules and access control
10. ⏳ Task 10: Add offline support and performance optimizations
11. ⏳ Task 11: Build error handling and user feedback
12. ⏳ Task 12: Deploy application to Firebase

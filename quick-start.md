# Quick Start Guide

Get up and running in 5 minutes!

## 1. Install Dependencies

```bash
npm install
cd functions && npm install && cd ..
```

## 2. Set Up Firebase

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password + Google)
3. Create a Firestore database
4. Get your Firebase config from Project Settings

## 3. Configure Environment

Copy `.env.example` to `.env.local` and add your Firebase credentials:

```bash
copy .env.example .env.local
```

Edit `.env.local` with your Firebase config values.

## 4. Update Firebase Project ID

Edit `.firebaserc` and replace `your-project-id` with your actual Firebase project ID.

## 5. Deploy Firestore Rules

```bash
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```

## 6. Start Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## That's it! 🎉

You now have a working development environment.

For detailed setup instructions, see [SETUP.md](./SETUP.md)

## Available Commands

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run emulators` - Start Firebase emulators
- `npm run deploy` - Deploy to Firebase

## Next Steps

1. Test authentication by signing up
2. Create your first habit experiment
3. Complete daily check-ins
4. View your analytics

Refer to `.kiro/specs/habit-experiment-mvp/tasks.md` for the full implementation roadmap.

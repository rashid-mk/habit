# Setup Guide - Habit Experiment Tracker

This guide will walk you through setting up the Habit Experiment Tracker from scratch.

## Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- npm or yarn package manager
- A Google account (for Firebase)
- Git (optional, for version control)

## Step 1: Install Dependencies

Install the frontend dependencies:

```bash
npm install
```

Install Cloud Functions dependencies:

```bash
cd functions
npm install
cd ..
```

## Step 2: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter a project name (e.g., "habit-experiment-tracker")
4. Disable Google Analytics (optional for MVP)
5. Click "Create project"

## Step 3: Enable Firebase Services

### Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** provider
3. Enable **Google** provider
   - Add your support email
   - Save

### Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in production mode** (we'll deploy security rules later)
4. Select a location (choose closest to your users)
5. Click "Enable"

### Enable Cloud Functions

1. Go to **Functions** in the Firebase Console
2. Click "Get started" if prompted
3. Upgrade to Blaze (pay-as-you-go) plan if needed
   - Note: Firebase has a generous free tier

## Step 4: Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **Web** icon (`</>`)
4. Register your app with a nickname (e.g., "Habit Tracker Web")
5. Copy the Firebase configuration object

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:

```bash
copy .env.example .env.local
```

2. Open `.env.local` and replace the values with your Firebase config:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Step 6: Install Firebase CLI

Install the Firebase CLI globally:

```bash
npm install -g firebase-tools
```

Login to Firebase:

```bash
firebase login
```

## Step 7: Link Firebase Project

Update `.firebaserc` with your project ID:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

Or use the Firebase CLI:

```bash
firebase use --add
```

Select your project and give it an alias (e.g., "default").

## Step 8: Deploy Firestore Rules and Indexes

Deploy the security rules:

```bash
firebase deploy --only firestore:rules
```

Deploy the indexes:

```bash
firebase deploy --only firestore:indexes
```

## Step 9: Run the Development Server

Start the Vite development server:

```bash
npm run dev
```

The app will be available at http://localhost:5173

## Step 10: Test the Setup

1. Open http://localhost:5173 in your browser
2. You should see the Habit Experiment Tracker homepage
3. The Firebase configuration should be loaded (check browser console for errors)

## Optional: Use Firebase Emulators

For local development without using production Firebase services:

### Install Emulators

```bash
firebase init emulators
```

Select:
- Authentication Emulator
- Functions Emulator
- Firestore Emulator

### Update Environment Variables

In `.env.local`, set:

```env
VITE_USE_FIREBASE_EMULATORS=true
```

### Start Emulators

```bash
npm run emulators
```

Or:

```bash
firebase emulators:start
```

The Emulator UI will be available at http://localhost:4000

### Run Dev Server with Emulators

In a separate terminal:

```bash
npm run dev
```

## Deployment

### Deploy Everything

```bash
npm run deploy
```

### Deploy Only Hosting

```bash
npm run deploy:hosting
```

### Deploy Only Functions

```bash
npm run deploy:functions
```

### Deploy Only Firestore Rules

```bash
npm run deploy:rules
```

## Troubleshooting

### Build Errors

If you encounter TypeScript errors:

```bash
npm run lint
```

### Firebase Connection Issues

1. Check that your `.env.local` file has the correct values
2. Verify your Firebase project is active in the console
3. Check browser console for specific error messages

### Firestore Permission Errors

If you get "Missing or insufficient permissions":

1. Ensure you're authenticated
2. Verify Firestore rules are deployed: `firebase deploy --only firestore:rules`
3. Check that the rules in `firestore.rules` match your needs

### Emulator Issues

If emulators won't start:

1. Check that ports 4000, 5001, 8080, 9099 are not in use
2. Try stopping all Firebase processes: `firebase emulators:stop`
3. Restart emulators: `firebase emulators:start`

## Next Steps

Now that your project is set up, you can:

1. Implement authentication (Task 2)
2. Build habit creation functionality (Task 3)
3. Add daily check-in features (Task 5)
4. Create the analytics dashboard (Task 4)

Refer to the tasks.md file in `.kiro/specs/habit-experiment-mvp/` for the implementation plan.

## Support

For issues or questions:

- Check the [Firebase Documentation](https://firebase.google.com/docs)
- Review the [Vite Documentation](https://vitejs.dev)
- Check the project's README.md

`# Deployment Guide - Firebase Spark (Free) Plan

This guide covers deploying the Habit Experiment Tracker on Firebase's free Spark plan without Cloud Functions.

## What's Included

✅ **Working Features:**
- User authentication (Email/Password, Google OAuth)
- Habit creation, editing, and deletion
- Daily check-ins
- Analytics (streak tracking, completion rate)
- Timeline visualization
- Offline support
- Real-time sync

❌ **Not Available (Requires Blaze Plan):**
- Scheduled push notifications
- Server-side validation
- Background analytics processing
- Cloud Functions

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged in to Firebase: `firebase login`
3. Firebase project on Spark plan
4. Node.js and npm installed

## Setup Steps

### 1. Configure Firebase Project

Update `.firebaserc` with your Firebase project ID:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

Or use the CLI:
```bash
firebase use --add
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase config:

```bash
cp .env.example .env.local
```

Get your Firebase config from:
https://console.firebase.google.com/project/YOUR_PROJECT_ID/settings/general

### 3. Enable Firebase Services

In Firebase Console, enable:
- **Authentication**: Email/Password and Google providers
- **Firestore Database**: Start in production mode
- **Hosting**: Will be enabled automatically on first deploy

### 4. Build the Application

```bash
npm install
npm run build
```

### 5. Deploy

```bash
# Deploy everything (hosting + firestore rules)
npm run deploy

# Or deploy individually
npm run deploy:hosting  # Deploy frontend only
npm run deploy:rules    # Deploy Firestore rules only
```

## Post-Deployment

### 1. Verify Deployment

Visit your deployed site:
```
https://YOUR_PROJECT_ID.web.app
```

### 2. Test Core Functionality

- ✅ Sign up with email/password
- ✅ Sign in with Google
- ✅ Create a habit
- ✅ Complete a check-in
- ✅ View analytics (streak, completion rate)
- ✅ View timeline graph

### 3. Monitor Usage

Check your Firebase Console for:
- **Firestore**: Read/write operations
- **Hosting**: Bandwidth usage
- **Authentication**: Active users

## Spark Plan Limits

### Firestore
- **Reads**: 50,000/day
- **Writes**: 20,000/day
- **Deletes**: 20,000/day
- **Storage**: 1 GB

### Hosting
- **Storage**: 10 GB
- **Transfer**: 360 MB/day

### Authentication
- **Users**: Unlimited

## Optimization Tips

1. **Enable Offline Persistence**: Already configured in the app
2. **Limit Queries**: Use pagination for large datasets
3. **Cache Analytics**: Analytics are cached in Firestore
4. **Optimize Images**: Use WebP format and lazy loading

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Deployment Fails

```bash
# Check if logged in
firebase login

# Check project
firebase use

# Validate Firestore rules
firebase firestore:rules:validate firestore.rules
```

### App Not Loading

1. Check browser console for errors
2. Verify Firebase config in `.env.local`
3. Check Firestore rules are deployed
4. Ensure Authentication providers are enabled

## Upgrading to Blaze Plan

If you need Cloud Functions features:

1. Visit: https://console.firebase.google.com/project/YOUR_PROJECT_ID/usage/details
2. Click "Upgrade to Blaze"
3. Add payment method
4. Set budget alerts
5. Redeploy with functions: `firebase deploy`

## Local Development

Test locally without deploying:

```bash
# Start development server
npm run dev

# Or use Firebase emulators
npm run emulators
```

## Support

- Firebase Documentation: https://firebase.google.com/docs
- Firebase Console: https://console.firebase.google.com
- GitHub Issues: [Your repository URL]


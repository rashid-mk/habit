# Deployment Guide

This guide covers deploying the Habit Experiment Tracker to Firebase.

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged in to Firebase: `firebase login`
3. Firebase project created and configured in `.firebaserc`
4. Environment variables set in `.env.local` for local development

## Deployment Steps

### 1. Configure Firebase Project

Update `.firebaserc` with your Firebase project ID:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

### 2. Set Cloud Function Environment Variables

Set required environment variables for Cloud Functions:

```bash
# Set FCM server key (if using FCM for notifications)
firebase functions:config:set fcm.server_key="YOUR_FCM_SERVER_KEY"

# View current config
firebase functions:config:get
```

### 3. Deploy Everything

Deploy the entire application (hosting, functions, and rules):

```bash
npm run deploy
```

This command will:
- Build the React frontend
- Deploy to Firebase Hosting
- Deploy Cloud Functions
- Deploy Firestore security rules

### 4. Deploy Individual Components

#### Deploy Frontend Only

```bash
npm run deploy:hosting
```

#### Deploy Cloud Functions Only

```bash
npm run deploy:functions
```

#### Deploy Firestore Rules Only

```bash
npm run deploy:rules
```

## Deployment Configuration

### Firebase Hosting

The hosting configuration in `firebase.json` includes:

- **Build Output**: `dist` directory (Vite build output)
- **SPA Routing**: All routes rewrite to `/index.html`
- **Caching Headers**:
  - Static assets (JS, CSS, images): 1 year cache with immutable flag
  - HTML files: No cache to ensure fresh content
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
- **Clean URLs**: Enabled for better SEO
- **Trailing Slash**: Disabled for consistency

### Cloud Functions

Cloud Functions configuration:
- **Runtime**: Node.js 18
- **Source**: `functions` directory
- **Build**: TypeScript compiled to `functions/lib`

### Firestore

- **Security Rules**: `firestore.rules`
- **Indexes**: `firestore.indexes.json`

## Post-Deployment Verification

### 1. Check Hosting

Visit your deployed site:
```
https://your-project-id.web.app
```

### 2. Verify Cloud Functions

Check deployed functions in Firebase Console:
```
https://console.firebase.google.com/project/your-project-id/functions
```

### 3. Test Authentication

- Sign up with email/password
- Sign in with Google OAuth
- Verify user profile created in Firestore

### 4. Test Core Functionality

- Create a habit
- Complete a check-in
- View analytics on dashboard
- Check timeline graph

### 5. Monitor Logs

View Cloud Function logs:
```bash
npm run logs
# or
firebase functions:log
```

## Performance Optimization

The deployment includes several optimizations:

### Frontend
- Code splitting for vendor libraries (React, Firebase, React Query)
- Minification with Terser
- Console.log removal in production
- Aggressive caching for static assets
- Lazy loading for route components

### Backend
- Cloud Functions with Node.js 18 runtime
- Optimized Firestore queries with indexes
- Analytics denormalization for fast reads

## Monitoring and Alerts

### Firebase Console

Monitor your application in the Firebase Console:

1. **Hosting**: View traffic and bandwidth usage
2. **Functions**: Monitor invocations, errors, and execution time
3. **Firestore**: Track read/write operations and quota usage
4. **Authentication**: View user sign-ups and authentication methods

### Performance Monitoring

Firebase Performance Monitoring is integrated in the app. View metrics:
- Page load times
- Check-in latency
- Custom traces for key operations

### Error Tracking

Cloud Function errors are logged automatically. View logs:
```bash
firebase functions:log --only <function-name>
```

## Rollback

If you need to rollback a deployment:

### Hosting Rollback

1. Go to Firebase Console > Hosting
2. View deployment history
3. Click "Rollback" on a previous version

### Functions Rollback

Redeploy a previous version:
```bash
git checkout <previous-commit>
npm run deploy:functions
```

## Environment-Specific Deployments

### Staging Environment

Create a staging project:

```bash
firebase use --add
# Select staging project
# Give it an alias like "staging"

# Deploy to staging
firebase use staging
npm run deploy
```

### Production Environment

```bash
firebase use production
npm run deploy
```

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Functions Deployment Fails

```bash
# Rebuild functions
cd functions
rm -rf lib node_modules
npm install
npm run build
cd ..
firebase deploy --only functions
```

### Firestore Rules Deployment Fails

Validate rules before deploying:
```bash
firebase firestore:rules:validate firestore.rules
```

## Security Checklist

Before deploying to production:

- [ ] Update `.firebaserc` with production project ID
- [ ] Set Cloud Function environment variables
- [ ] Review and test Firestore security rules
- [ ] Enable Firebase App Check (optional but recommended)
- [ ] Configure CORS if using external APIs
- [ ] Review authentication providers and settings
- [ ] Set up billing alerts in Google Cloud Console
- [ ] Enable audit logging for sensitive operations

## Cost Optimization

Monitor and optimize costs:

1. **Firestore**: Use indexes efficiently, avoid unnecessary reads
2. **Cloud Functions**: Optimize cold start times, use appropriate memory allocation
3. **Hosting**: Leverage caching to reduce bandwidth
4. **Authentication**: Monitor active users

Set up budget alerts in Google Cloud Console to avoid unexpected charges.

## Support

For issues or questions:
- Firebase Documentation: https://firebase.google.com/docs
- Firebase Support: https://firebase.google.com/support
- GitHub Issues: [Your repository URL]

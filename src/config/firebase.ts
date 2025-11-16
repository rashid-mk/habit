import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence
} from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import { getPerformance, trace } from 'firebase/performance'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const functions = getFunctions(app)
export const performance = getPerformance(app)

// Initialize Firebase Messaging (only if supported)
let messaging: ReturnType<typeof getMessaging> | null = null
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app)
  }
}).catch((err) => {
  console.warn('Firebase Messaging not supported:', err)
})

export { messaging, getToken, onMessage, trace }

// Enable Firestore offline persistence with multi-tab support
// Try multi-tab persistence first, fall back to single-tab if needed
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multi-tab not supported, try single-tab
    console.warn('Multi-tab persistence not available, falling back to single-tab mode.')
    return enableIndexedDbPersistence(db)
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support offline persistence.')
  }
  return Promise.reject(err)
}).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.')
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support offline persistence.')
  }
})

// Connect to emulators in development
if (import.meta.env.DEV) {
  const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
  
  if (useEmulators) {
    connectAuthEmulator(auth, 'http://localhost:9099')
    connectFirestoreEmulator(db, 'localhost', 8080)
    connectFunctionsEmulator(functions, 'localhost', 5001)
    console.log('Connected to Firebase emulators')
  }
}

export default app

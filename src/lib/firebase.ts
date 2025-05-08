
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
// import { getAuth, type Auth } from 'firebase/auth'; // If Firebase Auth is integrated later

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let isFirebaseProperlyConfigured = true;

// Check if the project ID is configured, as this is a common cause for "projects//" errors.
if (!firebaseConfig.projectId) {
  isFirebaseProperlyConfigured = false;
  const errorMessage = "Firebase project ID is not configured. Please ensure the NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable is set correctly.";
  console.error(errorMessage);
  // In a client-side environment, throwing an error here might be too disruptive.
  // For a server-side context or build process, an error throw is appropriate.
  // Since this runs in both contexts in Next.js, logging an error is a safer default.
}


// Initialize Firebase
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

// Only attempt to initialize Firebase if the project ID is set
if (isFirebaseProperlyConfigured) {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
      db = getFirestore(app);
      if (typeof window !== 'undefined') { // IndexedDB persistence only works in the browser
        enableIndexedDbPersistence(db, { cacheSizeBytes: CACHE_SIZE_UNLIMITED })
          .then(() => {
            console.log("Firestore offline persistence enabled.");
          })
          .catch((err) => {
            if (err.code === 'failed-precondition') {
              console.warn('Firestore offline persistence failed (failed-precondition). This can happen if multiple tabs are open or due to other browser restrictions. The app will continue to function but may rely more on network connectivity for Firestore data.');
            } else if (err.code === 'unimplemented') {
              console.warn('Firestore offline persistence failed (unimplemented). The browser may not support IndexedDB for offline persistence.');
            } else {
              console.error('Firestore offline persistence failed: ', err);
            }
          });
      }
    } catch (initError) {
        console.error("Firebase initialization failed:", initError);
        isFirebaseProperlyConfigured = false; // Set to false if init itself fails
        app = null;
        db = null;
    }
  } else {
    try {
        app = getApp();
        db = getFirestore(app); // Ensure db is initialized for existing app instance
    } catch (getError) {
        console.error("Failed to get existing Firebase app or Firestore instance:", getError);
        isFirebaseProperlyConfigured = false; // Set to false if getting existing instance fails
        app = null;
        db = null;
    }
  }
} else {
  console.warn("Firebase was not initialized due to missing Project ID. App will rely on localStorage for mock data if available.");
  // app and db remain null
}


// const auth: Auth | null = app ? getAuth(app) : null; // Uncomment if Firebase Auth is used

export { app, db, isFirebaseProperlyConfigured /*, auth */ };


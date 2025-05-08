
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
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (!firebaseConfig.projectId) {
  isFirebaseProperlyConfigured = false;
  const warningMessage = "Firebase project ID is not configured. Please ensure the NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable is set correctly. The application will fall back to using localStorage for mock data if available (client-side only).";
  console.warn(warningMessage);
} else {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized.");
    } else {
      app = getApp();
      console.log("Existing Firebase app retrieved.");
    }

    if (app) {
      db = getFirestore(app);
      console.log("Firestore instance obtained.");
      if (typeof window !== 'undefined' && db) { // IndexedDB persistence only works in the browser
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
              console.error('Firestore offline persistence error: ', err);
            }
          });
      }
    } else {
      // This case should ideally not be reached if initializeApp/getApp behaves as expected
      isFirebaseProperlyConfigured = false;
      console.error("Firebase app is null after initialization/retrieval attempt.");
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    isFirebaseProperlyConfigured = false;
    app = null;
    db = null;
  }
}

if (!db) {
    // If db is still null here, it means getFirestore failed or app was null
    if(isFirebaseProperlyConfigured){ // Only set to false if it wasn't already false due to projectId
        console.error("Firestore instance (db) is null. Firebase might not be properly configured or getFirestore failed.");
        isFirebaseProperlyConfigured = false;
    }
}


// const auth: Auth | null = app ? getAuth(app) : null; // Uncomment if Firebase Auth is used

export { app, db, isFirebaseProperlyConfigured /*, auth */ };


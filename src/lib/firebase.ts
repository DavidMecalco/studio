
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

console.log("[FIREBASE_INIT] Starting Firebase initialization process...");
console.log(`[FIREBASE_INIT] NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${firebaseConfig.projectId}`);

if (!firebaseConfig.projectId || firebaseConfig.projectId === "undefined" || firebaseConfig.projectId.trim() === "") {
  isFirebaseProperlyConfigured = false;
  console.warn("[FIREBASE_INIT] WARNING: Firebase project ID (NEXT_PUBLIC_FIREBASE_PROJECT_ID) is missing or invalid. Firebase real-time features will be disabled. The application will attempt to use local storage fallback for mock data persistence.");
} else {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log("[FIREBASE_INIT] Firebase app initialized successfully.");
    } else {
      app = getApp();
      console.log("[FIREBASE_INIT] Existing Firebase app retrieved.");
    }

    if (app) {
      db = getFirestore(app);
      console.log("[FIREBASE_INIT] Firestore instance obtained successfully.");
      if (typeof window !== 'undefined' && db) { // IndexedDB persistence only works in the browser
        enableIndexedDbPersistence(db, { cacheSizeBytes: CACHE_SIZE_UNLIMITED })
          .then(() => {
            console.log("[FIREBASE_INIT] Firestore offline persistence enabled.");
          })
          .catch((err) => {
            if (err.code === 'failed-precondition') {
              console.warn('[FIREBASE_INIT] Firestore offline persistence failed (failed-precondition). This can happen if multiple tabs are open or due to other browser restrictions. The app will continue to function but may rely more on network connectivity for Firestore data.');
            } else if (err.code === 'unimplemented') {
              console.warn('[FIREBASE_INIT] Firestore offline persistence failed (unimplemented). The browser may not support IndexedDB for offline persistence.');
            } else {
              console.error('[FIREBASE_INIT] Firestore offline persistence error: ', err);
            }
          });
      }
    } else {
      isFirebaseProperlyConfigured = false;
      console.error("[FIREBASE_INIT] CRITICAL: Firebase app is null after initialization/retrieval attempt. Firebase features will be disabled.");
    }
  } catch (error) {
    console.error("[FIREBASE_INIT] CRITICAL: Firebase initialization failed:", error);
    isFirebaseProperlyConfigured = false;
    app = null;
    db = null;
  }
}

if (!db && isFirebaseProperlyConfigured) { 
  // This case means projectId was present, app initialization might have seemed to succeed (or not thrown), but getFirestore failed or db is otherwise unexpectedly null.
  console.error("[FIREBASE_INIT] CRITICAL: Firestore instance (db) is null, but Firebase was initially expected to be configured (projectId was present). Firebase features will be disabled.");
  isFirebaseProperlyConfigured = false; // Correct the flag if db is unexpectedly null
}

console.log(`[FIREBASE_INIT] Final Status: isFirebaseProperlyConfigured = ${isFirebaseProperlyConfigured}, app initialized = ${!!app}, db initialized = ${!!db}`);


// const auth: Auth | null = app ? getAuth(app) : null; // Uncomment if Firebase Auth is used

export { app, db, isFirebaseProperlyConfigured /*, auth */ };


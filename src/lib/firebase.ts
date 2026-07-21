import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

// Reuse the app during Fast Refresh to avoid duplicate-app initialization.
export const firebaseApp = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

// These live bindings are initialized explicitly after the browser mounts. This
// avoids a server/pre-render evaluation leaving the client stuck with null
// services while still keeping builds safe before .env.local is configured.
export let auth: Auth | null = null;
export let db: Firestore | null = null;

export function initializeFirebaseClientServices() {
  if (typeof window !== "undefined" && firebaseApp) {
    auth ??= getAuth(firebaseApp);
    db ??= getFirestore(firebaseApp);
  }
  return { auth, db };
}

initializeFirebaseClientServices();

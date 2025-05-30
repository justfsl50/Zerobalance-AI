import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore"; // Import Firestore

// Your web app's Firebase configuration
// IMPORTANT: These should be in your .env.local file!
const firebaseConfig = {
  apiKey: "AIzaSyCNrGQn4p2Ecnc9oKcvOWDt8HZyHT1FVc8",
  authDomain: "tracksheet-26df0.firebaseapp.com",
  projectId: "tracksheet-26df0",
  storageBucket: "tracksheet-26df0.firebasestorage.app",
  messagingSenderId: "1033180561931",
  appId: "1:1033180561931:web:300eb648435a3e26677d0e",
};

console.log("Firebase Config:", firebaseConfig); // Added for debugging

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app); // Initialize Firestore

export { app, auth, db };

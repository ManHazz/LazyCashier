// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined";

// Initialize Firebase only if we have the required configuration
let app = null;
let analytics = null;
let db = null;

try {
  // Check if all required config values are present
  const requiredConfigKeys = [
    "apiKey",
    "authDomain",
    "projectId",
    "messagingSenderId",
    "appId",
  ];

  const missingKeys = requiredConfigKeys.filter((key) => !firebaseConfig[key]);

  if (missingKeys.length > 0) {
    console.error("Missing Firebase configuration values:", missingKeys);
    throw new Error(
      `Missing Firebase configuration values: ${missingKeys.join(", ")}`
    );
  }

  // Initialize Firebase
  app = initializeApp(firebaseConfig);

  if (isBrowser) {
    analytics = getAnalytics(app);
    db = getFirestore(app);
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  if (isBrowser) {
    // Show a user-friendly error message in the browser
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background-color: #ff4444;
      color: white;
      padding: 1rem;
      text-align: center;
      z-index: 9999;
    `;
    errorDiv.textContent =
      "Firebase configuration error. Please check your environment variables.";
    document.body.appendChild(errorDiv);
  }
}

export { app, analytics, db };

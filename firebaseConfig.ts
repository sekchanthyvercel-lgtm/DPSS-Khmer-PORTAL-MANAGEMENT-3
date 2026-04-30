import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRYPeVT3FetNyjgx9x6oRcJomjPSi5wsY",
  authDomain: "dps-staff-portal.firebaseapp.com",
  projectId: "dps-staff-portal",
  storageBucket: "dps-staff-portal.firebasestorage.app",
  messagingSenderId: "957109906172",
  appId: "1:957109906172:web:0e557a54065e2a11884579",
  measurementId: "G-B5Y73M289B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);

export default app;
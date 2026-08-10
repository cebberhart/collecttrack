import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCVo86b8zDZ0ym2mkAA1jK_xE1SPwNb4jw",
  authDomain: "collecttrack-dev.firebaseapp.com",
  projectId: "collecttrack-dev",
  storageBucket: "collecttrack-dev.firebasestorage.app",
  messagingSenderId: "520125667460",
  appId: "1:520125667460:web:14479797f9cf3001454ad1",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

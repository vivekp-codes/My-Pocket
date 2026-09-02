import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCqpT0TQa5o-HGN3gdRNsiccfz1qpRRL1E",
  authDomain: "my-pocket-2026.firebaseapp.com",
  projectId: "my-pocket-2026",
  storageBucket: "my-pocket-2026.firebasestorage.app",
  messagingSenderId: "348539351238",
  appId: "1:348539351238:web:5227523536ea12841867c7",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// utils/firebaseClientLogin.js
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/config/firebase";

export const firebaseClientLogin = async (email, password) => {
  try {
    if (!auth.currentUser) {
      await signInWithEmailAndPassword(auth, email, password);
      
    }
  } catch (err) {
    console.error("Client-side Firebase login failed:", err.message);
  }
};

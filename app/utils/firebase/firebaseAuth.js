/**
 * Client-side helper to authenticate with Firebase and set auth cookie
 */
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/config/firebase";

export const firebaseSignIn = async (email, password) => {
  try {
    // Sign in with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get the Firebase ID token
    const token = await user.getIdToken();

    // Set the token as a cookie via our API
    await fetch("/api/auth/set-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      credentials: "include",
    });

    return { success: true, user };
  } catch (error) {
    throw error;
  }
};

export const firebaseSignOut = async () => {
  try {
    await auth.signOut();
    // Clear the auth cookie
    await fetch("/api/auth/clear-token", {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Sign out error:", error);
    throw error;
  }
};

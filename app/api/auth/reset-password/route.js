// app/api/auth/reset-password/route.js

import {
  verifyCode,
} from "@/app/services/verificationService";
import { firestore } from "@/app/config/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialize Firebase Admin if not already initialized
if (!getApps().length && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
  try {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n");
    
    initializeApp({
      credential: cert({
        type: process.env.FIREBASE_ADMIN_TYPE,
        project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
        private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
        auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
        token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
      }),
    });
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error.message);
  }
}

/**
 * POST /api/auth/reset-password
 *
 * Resets user password after verifying email address and code
 *
 * Body: { 
 *   email: string, 
 *   verificationCode: string,
 *   newPassword: string 
 * }
 * Returns: { success: boolean, error?: string }
 */
export async function POST(req) {
  try {
    const { email, verificationCode, newPassword } = await req.json();

    if (!email || !verificationCode || !newPassword) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email, verification code, and new password are required",
        }),
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Password must be at least 8 characters long",
        }),
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists with this email
    const usersQuery = query(
      collection(firestore, "users"),
      where("email", "==", normalizedEmail)
    );
    const usersSnapshot = await getDocs(usersQuery);

    if (usersSnapshot.empty) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No account found with this email address",
        }),
        { status: 404 }
      );
    }

    ;

    try {
      // Verify the code (uses special prefix for password reset codes)
      const codeVerification = await verifyCode(`reset_${normalizedEmail}`, verificationCode);

      if (!codeVerification.valid) {
        
        return new Response(
          JSON.stringify({
            success: false,
            error: codeVerification.error || "Invalid or expired verification code",
          }),
          { status: 400 }
        );
      }

      // Get user document
      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();
      const userId = userData.uid;
      
      

      // Get Firebase Admin Auth
      let auth;
      try {
        auth = getAuth();
      } catch (error) {
        console.error("Auth initialization failed:", error);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: "Authentication service not available" 
          }),
          { status: 500 }
        );
      }

      // Update password in Firebase Auth
      await auth.updateUser(userId, {
        password: newPassword,
      });

      

      return new Response(
        JSON.stringify({
          success: true,
          message: "Password reset successfully. You can now sign in with your new password.",
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error("❌ Error in password reset:", {
        message: error.message,
        code: error.code,
        email: normalizedEmail,
        fullError: error
      });

      // Handle specific Firebase Auth errors
      if (error.code === "auth/user-not-found") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "User account not found",
          }),
          { status: 404 }
        );
      } else if (error.code === "auth/weak-password") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Password is too weak. Please choose a stronger password.",
          }),
          { status: 400 }
        );
      } else if (error.code === "auth/invalid-password") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid password format",
          }),
          { status: 400 }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || "Failed to reset password. Please try again.",
        }),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/auth/reset-password:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred",
      }),
      { status: 500 }
    );
  }
}

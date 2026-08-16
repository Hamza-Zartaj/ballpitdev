// app/api/auth/send-verification-code/route.js

import {
  generateVerificationCode,
  storeVerificationCode,
} from "@/app/services/verificationService";
import { sendVerificationCode as sendVerificationEmail } from "@/app/services/emailService";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getFirestoreInstance } from "@/app/config/firebase";

/**
 * POST /api/auth/send-verification-code
 *
 * Sends a verification code to the user's email address
 *
 * Body: { email: string }
 * Returns: { success: boolean, error?: string }
 */
export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email is required",
        }),
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid email format. Please enter a valid email address.",
        }),
        { status: 400 }
      );
    }

    

    try {
      // Check if email is already registered in Firestore
      const firestore = await getFirestoreInstance();
      
      
      const usersQuery = query(
        collection(firestore, "users"),
        where("email", "==", email)
      );
      const usersSnap = await getDocs(usersQuery);
      
      
      
      if (!usersSnap.empty) {
        
        return new Response(
          JSON.stringify({
            success: false,
            error: "This email is already registered. Please use a different email or sign in to your account.",
            code: "email-already-in-use",
          }),
          { status: 400 }
        );
      }

      
      // Generate code
      const code = generateVerificationCode();

      // Store code in database with 10-minute expiry
      await storeVerificationCode(email, code);

      // Send verification code via email
      const emailResult = await sendVerificationEmail(email, code);

      if (!emailResult.success) {
        console.error(
          "Error sending verification email:",
          emailResult.error
        );
      }

      

      return new Response(
        JSON.stringify({
          success: true,
          message: "Verification code sent to your email address",
        }),
        { status: 200 }
      );
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send verification email. Please try again.",
        }),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/auth/send-verification-code:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred",
      }),
      { status: 500 }
    );
  }
}

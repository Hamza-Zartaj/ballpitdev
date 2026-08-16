// app/api/auth/send-password-reset-code/route.js

import {
  generateVerificationCode,
  storeVerificationCode,
} from "@/app/services/verificationService";
import { sendPasswordResetCode as sendPasswordResetEmail } from "@/app/services/emailService";
import { firestore } from "@/app/config/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

/**
 * POST /api/auth/send-password-reset-code
 *
 * Sends a password reset verification code to the user's email address
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

    // Check if user exists with this email
    const normalizedEmail = email.toLowerCase().trim();
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

    

    try {
      // Generate code
      const code = generateVerificationCode();

      // Store code in database with 10-minute expiry
      // Use a special prefix to distinguish password reset codes from signup codes
      await storeVerificationCode(`reset_${normalizedEmail}`, code);

      // Send password reset code via email
      const emailResult = await sendPasswordResetEmail(normalizedEmail, code);

      if (!emailResult.success) {
        console.error(
          "Error sending password reset email:",
          emailResult.error
        );
      }

      

      return new Response(
        JSON.stringify({
          success: true,
          message: "Password reset code sent to your email address",
        }),
        { status: 200 }
      );
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to send password reset email. Please try again.",
        }),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/auth/send-password-reset-code:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred",
      }),
      { status: 500 }
    );
  }
}

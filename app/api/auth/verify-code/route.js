// app/api/auth/verify-code/route.js

import { verifyCode } from "@/app/services/verificationService";
import userController from "@/app/controllers/userController";

/**
 * POST /api/auth/verify-code
 *
 * Verifies the code entered by the user and marks email as verified
 *
 * Body: { email: string, code: string, userId?: string }
 * Returns: { valid: boolean, error?: string }
 */
export async function POST(req) {
  try {
    const { email, code, userId } = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "Email and code are required",
        }),
        { status: 400 }
      );
    }

    

    const result = await verifyCode(email, code);

    if (!result.valid) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: result.error,
        }),
        { status: 400 }
      );
    }

    // If userId provided, update user doc to mark email as verified
    if (userId) {
      try {
        await userController.updateUser(userId, {
          emailVerified: true,
          emailVerificationDate: new Date(),
        });
        
      } catch (updateError) {
        console.warn(
          "Could not update user doc verification status:",
          updateError
        );
        // Don't fail the request if doc update fails
      }
    }

    

    return new Response(
      JSON.stringify({
        valid: true,
        message: "Email verified successfully",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/auth/verify-code:", error);
    return new Response(
      JSON.stringify({
        valid: false,
        error: error.message || "An unexpected error occurred",
      }),
      { status: 500 }
    );
  }
}

// app/api/auth/get-phone-by-email/route.js

import { firestore } from "@/app/config/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { normalizePhoneNumber } from "@/app/services/verificationService";

/**
 * POST /api/auth/get-phone-by-email
 *
 * Fetches and masks phone number for password reset by email
 *
 * Body: { email: string }
 * Returns: { success: boolean, maskedPhone?: string, error?: string }
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

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();

    

    try {
      // Find user by email
      const usersQuery = query(
        collection(firestore, "users"),
        where("email", "==", normalizedEmail)
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (usersSnapshot.empty) {
        console.warn(`No user found with email: ${normalizedEmail}`);
        return new Response(
          JSON.stringify({
            success: false,
            error: "No account found with this email address",
          }),
          { status: 404 }
        );
      }

      // Get the user document
      const userDoc = usersSnapshot.docs[0];
      const phoneNumber = userDoc.data().phoneNumber;

      

      if (!phoneNumber) {
        console.warn(`User found but no phoneNumber for email: ${normalizedEmail}`);
        return new Response(
          JSON.stringify({
            success: false,
            error: "No phone number associated with this account",
          }),
          { status: 404 }
        );
      }

      // Mask phone number - show only last 4 digits
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      const maskedPhone = `***-***-${cleanPhone.slice(-4)}`;

     

      return new Response(
        JSON.stringify({
          success: true,
          maskedPhone: maskedPhone,
          phoneNumber: phoneNumber, // Store the actual phone for later use
        }),
        { status: 200 }
      );
    } catch (dbError) {
      console.error("Database error in get-phone-by-email:", dbError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Error looking up account. Please try again.",
        }),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/auth/get-phone-by-email:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred",
      }),
      { status: 500 }
    );
  }
}

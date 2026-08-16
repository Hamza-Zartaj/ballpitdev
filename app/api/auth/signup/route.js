import { auth } from "@/app/config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import userController from "@/app/controllers/userController";

export async function POST(req) {
  try {
    const body = await req.json();
    
    
    const { email, password, businessName, businessUrl, qualificationCriteria } = body;

    // Validate required fields
    if (!email || !password) {
      
      return new Response(
        JSON.stringify({ message: "Email and password are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    try {
      await userController.createUser(
        {
          name: businessName || "User",
          email: email,
          businessUrl: businessUrl || "",
          qualificationCriteria: qualificationCriteria || "",
          notificationstate: true,
          emailVerified: false,
        },
        user.uid
      );
      
    } catch (createErr) {
      console.error(`⚠️ Warning: User document creation failed for ${user.uid}:`, createErr.message);
      // Continue anyway - user can be created on first signin
    }

    return new Response(
      JSON.stringify({
        message: "User created successfully",
        userId: user.uid,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Signup error:", error);

    // Handle specific Firebase auth errors
    let errorMessage = "Failed to create account";
    let errorCode = error.code || "unknown-error";
    
    if (error.code === "auth/email-already-in-use") {
      errorMessage = "This email is already registered. Please use a different email.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address. Please enter a valid email.";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password must be at least 6 characters long.";
    }

    return new Response(
      JSON.stringify({ 
        message: errorMessage, 
        code: errorCode,
        fullError: error.message 
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}

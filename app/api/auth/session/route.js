import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/app/config/firebase-admin";
import { doc, getDoc } from "firebase-admin/firestore";

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("firebase-token");
    
    if (!tokenCookie) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(tokenCookie.value);

    // Fetch user data from Firestore
    const userQuery = await adminDb
      .collection("users")
      .where("uid", "==", decodedToken.uid)
      .limit(1)
      .get();

    let userData = null;
    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      userData = userDoc.data();
    }

    return new Response(
      JSON.stringify({
        user: {
          id: decodedToken.uid,
          email: decodedToken.email,
          name: userData?.name || decodedToken.name || decodedToken.email,
          image: userData?.profilePicture || decodedToken.picture || null,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Session verification error:", error);
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}

import { cookies } from "next/headers";

export async function POST(req) {
  try {
    const { token } = await req.json();
    
    if (!token) {
      return new Response(JSON.stringify({ error: "No token provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const cookieStore = await cookies();
    cookieStore.set("firebase-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Token set error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

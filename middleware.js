import { NextResponse } from "next/server";

export const runtime = "nodejs"; // Use Node.js runtime for middleware since we use firebase-admin

const publicPaths = ["/instantChat", "/auth/signin", "/auth/resetinput"];
const portfolioMode =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_PORTFOLIO_MODE === "true";

export async function middleware(req) {
  if (portfolioMode) {
    return NextResponse.next();
  }

  // Allow public paths without auth
  if (publicPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("firebase-token")?.value;

  if (!token) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  try {
    const { adminAuth } = await import("./app/config/firebase-admin");
    // Verify Firebase token
    await adminAuth.verifyIdToken(token);
    return NextResponse.next();
  } catch (error) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/checkout/:path*",
    "/chat/:path*",
    "/notification/:path*",
    "/persona/:path*",
    // Remove /api/users and /api/avatar from protected - they need to work for guest chats
    // "/api/users/:path*",
    // "/api/avatar/:path*",
    "/api/chat/:path*",
    "/api/notification/:path*",
    "/api/search/:path*",
    "/api/spreadsheet/:path*",
    // Remove /api/transcripts from protected - needs to work for guest browsers
    // "/api/transcripts/:path*",
    // SMS API needs to work without auth for background jobs and guest chats
    // "/api/sms/:path*",
  ],
};

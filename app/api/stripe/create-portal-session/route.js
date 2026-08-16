/**
 * ============================================================================
 * Create Portal Session — POST /api/stripe/create-portal-session
 * ============================================================================
 *
 * Accepts { uid } in request body.
 * Looks up the user's stripeCustomerId from Firestore, creates a Stripe
 * Billing Portal session, and returns the URL to redirect the user.
 *
 * The hosted portal lets customers:
 *   - Switch plans (monthly ↔ yearly)
 *   - Cancel subscription
 *   - Update payment method
 *   - View invoice history
 * ============================================================================
 */

import { NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { adminDb } from "@/app/config/firebase-admin";

const normalizeUrl = (url) => {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
};

export async function POST(req) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "uid is required" }, { status: 400 });
    }

    // Look up user in Firestore
    const snap = await adminDb
      .collection("users")
      .where("uid", "==", uid)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = snap.docs[0].data();
    const stripeCustomerId = userData.stripeCustomerId;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer linked to this account" },
        { status: 400 }
      );
    }

    // Create Billing Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${normalizeUrl(process.env.APP_URL || process.env.VERCEL_URL || "http://localhost:3000")}/profile/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[Portal Session] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create portal session" },
      { status: 500 }
    );
  }
}

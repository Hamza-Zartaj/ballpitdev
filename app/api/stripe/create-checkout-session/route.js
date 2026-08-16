/**
 * ============================================================================
 * Create Checkout Session — POST /api/stripe/create-checkout-session
 * ============================================================================
 *
 * Creates a Stripe Checkout Session with a subscription price (monthly or
 * yearly), a 7-day trial (card required), and proper success/cancel URLs
 * so the user is redirected back to the app after payment.
 *
 * Body: { uid, email, plan: "monthly" | "yearly" }
 * Returns: { url } — the Stripe-hosted checkout page URL
 * ============================================================================
 */

import { NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { adminDb } from "@/app/config/firebase-admin";

export async function POST(req) {
  try {
    const { uid, email, plan } = await req.json();

    if (!uid || !plan) {
      return NextResponse.json(
        { error: "uid and plan are required" },
        { status: 400 }
      );
    }

    // Pick the right price ID
    const priceId =
      plan === "monthly"
        ? process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for plan: ${plan}` },
        { status: 500 }
      );
    }

    // ── Step 1: Find existing Stripe customer ──────────────────────────
    // Check Firestore first, then search Stripe by email to avoid duplicates
    let stripeCustomerId = null;
    let hadPreviousSubscription = false;

    const snap = await adminDb
      .collection("users")
      .where("uid", "==", uid)
      .limit(1)
      .get();

    if (!snap.empty) {
      stripeCustomerId = snap.docs[0].data().stripeCustomerId || null;
    }

    // If no customer ID in Firestore, search Stripe by email to reuse existing customer
    if (!stripeCustomerId && email) {
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1,
      });
      if (existingCustomers.data.length > 0) {
        stripeCustomerId = existingCustomers.data[0].id;
        
      }
    }

    // ── Step 2: Check if this customer (or email) ever had a subscription ─
    // If yes, they don't get another free trial
    if (stripeCustomerId) {
      const subs = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        limit: 1,
        status: "all", // includes canceled, past_due, etc.
      });
      if (subs.data.length > 0) {
        hadPreviousSubscription = true;
        
      }
    }

    // Also check our deletedUsers collection for this email
    if (!hadPreviousSubscription && email) {
      const deletedSnap = await adminDb
        .collection("deletedUsers")
        .where("email", "==", email)
        .limit(1)
        .get();
      if (!deletedSnap.empty) {
        hadPreviousSubscription = true;
        
      }
    }

    let baseUrl = process.env.APP_URL || process.env.VERCEL_URL || "http://localhost:3000";
    // Ensure baseUrl has a scheme
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      // VERCEL_URL and custom domains don't have scheme, so add https
      baseUrl = `https://${baseUrl}`;
    }

    // ── Step 3: Build session params ──────────────────────────────────────
    const sessionParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/checkout?success=true`,
      cancel_url: `${baseUrl}/checkout?canceled=true`,
      client_reference_id: uid,
      subscription_data: {
        metadata: { firebaseUid: uid },
      },
      payment_method_collection: "always", // card required for trial
      metadata: { firebaseUid: uid },
    };

    // Only give trial to genuinely new customers
    if (!hadPreviousSubscription) {
      sessionParams.subscription_data.trial_period_days = 7;
    }

    // Reuse existing Stripe customer, or let Stripe create one
    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
    } else {
      sessionParams.customer_email = email || undefined;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[Checkout Session] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

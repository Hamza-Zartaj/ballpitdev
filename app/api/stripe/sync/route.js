/**
 * ============================================================================
 * Sync Subscription — POST /api/stripe/sync
 * ============================================================================
 *
 * Manually pulls the latest subscription data from Stripe and updates
 * the Firestore user document. Use this when webhooks weren't received
 * (e.g. during local dev without Stripe CLI) or as a recovery mechanism.
 *
 * Body: { uid }
 * Returns: { status, subscriptionId, ... } or { error }
 * ============================================================================
 */

import { NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { adminDb } from "@/app/config/firebase-admin";

export async function POST(req) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "uid is required" }, { status: 400 });
    }

    // Find the Firestore user
    const snap = await adminDb
      .collection("users")
      .where("uid", "==", uid)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userDoc = snap.docs[0];
    const userData = userDoc.data();
    let stripeCustomerId = userData.stripeCustomerId;

    // If no stripeCustomerId stored, try to find by email in Stripe
    if (!stripeCustomerId && userData.email) {
      const customers = await stripe.customers.list({
        email: userData.email,
        limit: 1,
      });
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
        
      }
    }

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer found for this user", tip: "Make sure the Stripe customer email matches the user email in Firestore" },
        { status: 404 }
      );
    }

    // Fetch all active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "all",
      limit: 10,
    });

    // Pick the most relevant subscription (active > trialing > others)
    const priorityOrder = ["active", "trialing", "past_due", "incomplete", "canceled"];
    const sorted = subscriptions.data.sort((a, b) => {
      return priorityOrder.indexOf(a.status) - priorityOrder.indexOf(b.status);
    });

    const subscription = sorted[0]; // best match

    if (!subscription) {
      // No subscriptions at all — clear the fields
      await userDoc.ref.update({
        stripeCustomerId,
        subscriptionStatus: "none",
        subscriptionId: null,
        priceId: null,
        subscriptionEndDate: null,
        hasSubscription: false,
        updatedAt: new Date(),
      });

      return NextResponse.json({
        synced: true,
        stripeCustomerId,
        subscriptionStatus: "none",
        message: "Customer found but no subscriptions exist",
      });
    }

    // Map and update
    const statusMap = {
      trialing: "trialing",
      active: "active",
      past_due: "past_due",
      canceled: "canceled",
      unpaid: "past_due",
      incomplete: "past_due",
      incomplete_expired: "canceled",
      paused: "canceled",
    };

    const mappedStatus = statusMap[subscription.status] || "none";
    const isActiveOrTrialing = mappedStatus === "active" || mappedStatus === "trialing";

    await userDoc.ref.update({
      stripeCustomerId,
      subscriptionStatus: mappedStatus,
      subscriptionId: subscription.id,
      priceId: subscription.items?.data?.[0]?.price?.id || null,
      subscriptionEndDate: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
      hasSubscription: isActiveOrTrialing,
      updatedAt: new Date(),
    });

    

    return NextResponse.json({
      synced: true,
      stripeCustomerId,
      subscriptionStatus: mappedStatus,
      subscriptionId: subscription.id,
      priceId: subscription.items?.data?.[0]?.price?.id || null,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    });
  } catch (err) {
    console.error("[Stripe Sync] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to sync subscription" },
      { status: 500 }
    );
  }
}

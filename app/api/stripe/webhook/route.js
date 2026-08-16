/**
 * ============================================================================
 * Stripe Webhook Handler — POST /api/stripe/webhook
 * ============================================================================
 *
 * Listens for Stripe events and syncs subscription state → Firestore.
 * Firestore is the source of truth for the app; we never query Stripe
 * at runtime to check subscription status.
 *
 * Events handled:
 *   - checkout.session.completed        ← links Stripe customer to Firebase user
 *   - customer.subscription.created
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *   - invoice.payment_succeeded
 *   - invoice.payment_failed
 * ============================================================================
 */

import { NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { adminDb } from "@/app/config/firebase-admin";

// ── Disable Next.js body parsing so we can verify the raw Stripe signature ──
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Next.js App Router needs this to receive the raw body
export async function POST(req) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text(); // raw body for signature verification

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find the Firestore user doc by stripeCustomerId, uid, or email.
 */
async function findUserDoc(stripeCustomerId, metadata = {}) {
  // 1. Try by stripeCustomerId already stored in Firestore
  if (stripeCustomerId) {
    let snap = await adminDb
      .collection("users")
      .where("stripeCustomerId", "==", stripeCustomerId)
      .limit(1)
      .get();
    if (!snap.empty) {
      
      return snap.docs[0];
    }
  }

  // 2. Try by uid from metadata (set via client_reference_id on Checkout Sessions)
  const uid = metadata?.firebaseUid || metadata?.uid;
  if (uid) {
    const snap = await adminDb
      .collection("users")
      .where("uid", "==", uid)
      .limit(1)
      .get();
    if (!snap.empty) {
      
      return snap.docs[0];
    }
  }

  // 3. Try matching by Stripe customer email → Firestore user email
  if (stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(stripeCustomerId);
      if (customer?.email) {
        const snap = await adminDb
          .collection("users")
          .where("email", "==", customer.email)
          .limit(1)
          .get();
        if (!snap.empty) {
          
          return snap.docs[0];
        }
      }
    } catch (e) {
      console.warn("[Stripe Webhook] Could not retrieve customer:", e.message);
    }
  }

  console.warn(`[Stripe Webhook] No user found for customer=${stripeCustomerId}, metadata=`, metadata);
  return null;
}

/**
 * Map Stripe subscription status → our simplified enum.
 */
function mapStatus(stripeStatus) {
  const MAP = {
    trialing: "trialing",
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    incomplete: "past_due",
    incomplete_expired: "canceled",
    paused: "canceled",
  };
  return MAP[stripeStatus] || "none";
}

// ─────────────────────────────────────────────────────────────────────────────
// Event handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * checkout.session.completed — fires when the Stripe Checkout page is done.
 * This is where we link the Stripe customerId → Firestore user for the first time,
 * using the client_reference_id we passed when creating the session.
 */
async function handleCheckoutCompleted(session) {
  

  const uid = session.client_reference_id; // Firebase UID we set
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  if (!uid && !customerId) {
    console.warn("[Stripe Webhook] checkout.session.completed: no uid or customer");
    return;
  }

  // Find user — first by uid from client_reference_id, then by email
  let userDoc = null;

  if (uid) {
    const snap = await adminDb
      .collection("users")
      .where("uid", "==", uid)
      .limit(1)
      .get();
    if (!snap.empty) userDoc = snap.docs[0];
  }

  // Fallback: match by email
  if (!userDoc && session.customer_details?.email) {
    const snap = await adminDb
      .collection("users")
      .where("email", "==", session.customer_details.email)
      .limit(1)
      .get();
    if (!snap.empty) userDoc = snap.docs[0];
  }

  if (!userDoc) {
    console.error(
      `[Stripe Webhook] checkout.session.completed: cannot find Firestore user. uid=${uid}, email=${session.customer_details?.email}`
    );
    return;
  }

  // Link the Stripe customer + subscription to the Firestore user
  const updateData = {
    stripeCustomerId: customerId,
    updatedAt: new Date(),
  };

  // If there's a subscription, fetch its current status
  if (subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const status = mapStatus(subscription.status);
      Object.assign(updateData, {
        subscriptionStatus: status,
        subscriptionId: subscription.id,
        priceId: subscription.items?.data?.[0]?.price?.id || null,
        subscriptionEndDate: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
        hasSubscription: status === "active" || status === "trialing",
      });
    } catch (e) {
      console.warn("[Stripe Webhook] Could not fetch subscription:", e.message);
    }
  }

  await userDoc.ref.update(updateData);
  
}

async function handleSubscriptionChange(subscription) {
  const customerId = subscription.customer;
  const userDoc = await findUserDoc(customerId, subscription.metadata);

  if (!userDoc) {
    console.warn(
      `[Stripe Webhook] No Firestore user found for customer ${customerId}`
    );
    return;
  }

  const status = mapStatus(subscription.status);
  const isActiveOrTrialing = status === "active" || status === "trialing";

  await userDoc.ref.update({
    subscriptionStatus: status,
    stripeCustomerId: customerId,
    subscriptionId: subscription.id,
    priceId: subscription.items?.data?.[0]?.price?.id || null,
    subscriptionEndDate: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null,
    hasSubscription: isActiveOrTrialing,
    updatedAt: new Date(),
  });

  
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;
  const userDoc = await findUserDoc(customerId, subscription.metadata);

  if (!userDoc) {
    console.warn(
      `[Stripe Webhook] No Firestore user for deleted sub customer ${customerId}`
    );
    return;
  }

  await userDoc.ref.update({
    subscriptionStatus: "canceled",
    subscriptionId: null,
    priceId: null,
    subscriptionEndDate: subscription.ended_at
      ? new Date(subscription.ended_at * 1000)
      : new Date(),
    hasSubscription: false,
    updatedAt: new Date(),
  });

  
}

async function handleInvoicePaymentSucceeded(invoice) {
  // Only care about subscription invoices
  if (!invoice.subscription) return;

  const customerId = invoice.customer;
  const userDoc = await findUserDoc(customerId);
  if (!userDoc) return;

  // Refresh subscription from Stripe to get current period
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const status = mapStatus(subscription.status);

  await userDoc.ref.update({
    subscriptionStatus: status,
    subscriptionEndDate: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null,
    hasSubscription: status === "active" || status === "trialing",
    updatedAt: new Date(),
  });

  
}

async function handleInvoicePaymentFailed(invoice) {
  if (!invoice.subscription) return;

  const customerId = invoice.customer;
  const userDoc = await findUserDoc(customerId);
  if (!userDoc) return;

  await userDoc.ref.update({
    subscriptionStatus: "past_due",
    hasSubscription: false,
    updatedAt: new Date(),
  });

  
}

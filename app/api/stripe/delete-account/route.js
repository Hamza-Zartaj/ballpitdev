/**
 * ============================================================================
 * Delete Account — POST /api/stripe/delete-account
 * ============================================================================
 *
 * Accepts { uid } in request body.
 * 1. Cancels any active Stripe subscription immediately
 * 2. Delegates full Firestore + Auth cleanup to userController.deleteUser()
 *
 * The Stripe Customer object is intentionally kept for record-keeping.
 * ============================================================================
 */

import { NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import { adminDb } from "@/app/config/firebase-admin";
import userController from "@/app/controllers/userController";

export async function POST(req) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "uid is required" }, { status: 400 });
    }

    // ── Step 1: Fetch user data before deletion ─────────────────────────
    const snap = await adminDb
      .collection("users")
      .where("uid", "==", uid)
      .limit(1)
      .get();

    let userData = null;
    if (!snap.empty) {
      userData = snap.docs[0].data();

      // ── Step 2: Archive user to deletedUsers collection ───────────────
      try {
        await adminDb.collection("deletedUsers").add({
          uid: uid,
          email: userData.email || null,
          name: userData.name || null,
          stripeCustomerId: userData.stripeCustomerId || null,
          subscriptionId: userData.subscriptionId || null,
          subscriptionStatus: userData.subscriptionStatus || null,
          priceId: userData.priceId || null,
          deletedAt: new Date(),
          reason: "user_requested",
        });
        
      } catch (archiveErr) {
        console.warn(
          "[Delete Account] Failed to archive user:",
          archiveErr.message
        );
        // Don't block deletion if archiving fails
      }

      // ── Step 3: Cancel Stripe subscription if exists ──────────────────
      if (userData.subscriptionId) {
        try {
          await stripe.subscriptions.cancel(userData.subscriptionId);
          
        } catch (stripeErr) {
          // Subscription may already be canceled — that's fine
          if (stripeErr.code !== "resource_missing") {
            console.warn(
              "[Delete Account] Stripe cancel warning:",
              stripeErr.message
            );
          }
        }
      }
    }

    // ── Step 4: Full user deletion (Auth + Firestore via existing controller)
    const result = await userController.deleteUser(uid);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[Delete Account] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}

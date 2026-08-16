/**
 * useSubscription — Client-side hook to read subscription state
 *
 * Reads the user's subscription fields from Firestore in real-time.
 * Automatically syncs with Stripe if Firestore shows no subscription
 * but the user might have one (e.g. webhook was missed).
 *
 * Usage:
 *   const { status, isActive, loading } = useSubscription();
 *   if (!isActive) { // block feature }
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/contexts/AuthProvider";
import { doc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "@/app/config/firebase";

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState({
    status: "none",            // "trialing" | "active" | "canceled" | "past_due" | "none"
    stripeCustomerId: null,
    subscriptionId: null,
    priceId: null,
    subscriptionEndDate: null,
    loading: true,
  });
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!user?.uid) {
      setSubscription((prev) => ({ ...prev, loading: false, status: "none" }));
      hasSynced.current = false;
      return;
    }

    let unsubscribe;

    // We need the Firestore doc ID first (documents are keyed by auto-ID, not uid)
    (async () => {
      try {
        const q = query(
          collection(firestore, "users"),
          where("uid", "==", user.uid)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          setSubscription((prev) => ({ ...prev, loading: false }));
          return;
        }

        const docRef = doc(firestore, "users", snap.docs[0].id);

        // Real-time listener
        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (!docSnap.exists()) {
            setSubscription((prev) => ({ ...prev, loading: false, status: "none" }));
            return;
          }
          const data = docSnap.data();
          const currentStatus = data.subscriptionStatus || "none";
          const currentCustomerId = data.stripeCustomerId || null;

          setSubscription({
            status: currentStatus,
            stripeCustomerId: currentCustomerId,
            subscriptionId: data.subscriptionId || null,
            priceId: data.priceId || null,
            subscriptionEndDate: data.subscriptionEndDate?.toDate?.() || data.subscriptionEndDate || null,
            loading: false,
          });

          // Auto-sync: if Firestore has no active subscription data,
          // try syncing from Stripe once per session in case webhooks were missed
          if (
            !hasSynced.current &&
            (currentStatus === "none" || (!currentCustomerId && !data.subscriptionId))
          ) {
            hasSynced.current = true;
            autoSyncFromStripe(user.uid);
          }
        });
      } catch (err) {
        console.error("[useSubscription] Error:", err);
        setSubscription((prev) => ({ ...prev, loading: false }));
      }
    })();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  return {
    ...subscription,
    /** true when user has paid access (trialing or active) */
    isActive:
      subscription.status === "trialing" || subscription.status === "active",
  };
}

/**
 * Silently attempt to sync subscription from Stripe.
 * If successful, Firestore gets updated and the onSnapshot listener
 * will automatically push the new state to the hook.
 */
async function autoSyncFromStripe(uid) {
  try {
    
    const res = await fetch("/api/stripe/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });
    const data = await res.json();
    if (res.ok && data.synced) {
      
    } else {
      
    }
  } catch (err) {
    // Silent fail — user can still manually sync from billing page
    console.warn("[useSubscription] Auto-sync failed:", err.message);
  }
}

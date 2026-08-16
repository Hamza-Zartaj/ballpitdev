"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthProvider";
import { useSubscription } from "../../hooks/useSubscription";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import MenuBar from "../../components/MenuBar";

const STATUS_CONFIG = {
  trialing: { label: "Trial", color: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
  active:   { label: "Active", color: "bg-green-100 text-green-800", dot: "bg-green-500" },
  past_due: { label: "Past Due", color: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-500" },
  canceled: { label: "Canceled", color: "bg-red-100 text-red-800", dot: "bg-red-500" },
  none:     { label: "No Plan", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
};

export default function BillingPage() {
  const { user } = useAuth();
  const { status, priceId, subscriptionEndDate, isActive, loading, stripeCustomerId } = useSubscription();
  const router = useRouter();
  const [portalLoading, setPortalLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.none;

  // Determine plan name from priceId
  const monthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID;
  const yearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID;
  let planName = "—";
  if (priceId === monthlyPriceId) planName = "Monthly";
  else if (priceId === yearlyPriceId) planName = "Yearly";
  else if (priceId) planName = "Custom";

  const handleManageBilling = async () => {
    if (!user?.uid) return;
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Portal error:", data.error);
      }
    } catch (err) {
      console.error("Portal error:", err);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSyncSubscription = async () => {
    if (!user?.uid) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/stripe/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });
      const data = await res.json();
      if (res.ok && data.synced) {
        setSyncMessage(`Synced! Status: ${data.subscriptionStatus}`);
      } else {
        setSyncMessage(data.error || "Sync failed");
      }
    } catch (err) {
      setSyncMessage("Sync failed: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-white">
      <Header text="Billing" routing="/profile" />
      <div className="flex-1 overflow-y-auto pt-[90px] pb-24 px-4">
        <div className="max-w-4xl mx-auto py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Billing & Subscription</h1>
          <p className="text-gray-500 mb-8 text-sm">Manage your plan, payment method, and invoices</p>

          {/* Status Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Plan</p>
                <p className="text-base font-semibold text-gray-900">{isActive ? planName : "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
                  {status === "canceled" ? "Ended" : "Renews"}
                </p>
                <p className="text-base font-semibold text-gray-900">
                  {subscriptionEndDate
                    ? new Date(subscriptionEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Account</p>
                <p className="text-sm text-gray-700 truncate">{user?.email || user?.uid}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {isActive ? (
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="w-full bg-gray-900 text-white font-semibold py-3.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {portalLoading ? "Opening portal…" : "Manage Billing & Invoices"}
            </button>
          ) : (
            <button
              onClick={() => router.push("/checkout")}
              className="w-full bg-purple-600 text-white font-semibold py-3.5 rounded-lg hover:bg-purple-700 transition-colors mb-4"
            >
              Subscribe Now
            </button>
          )}

          {status === "past_due" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 font-medium">
                Your payment failed. Please update your payment method to restore access.
              </p>
              <button
                onClick={handleManageBilling}
                className="mt-2 text-sm font-semibold text-yellow-900 underline"
              >
                Update Payment Method
              </button>
            </div>
          )}

          {status === "canceled" && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">
                Your subscription has been canceled. Subscribe again to regain access to premium features.
              </p>
            </div>
          )}

          {/* Manual sync — fallback if auto-sync didn't pick it up */}
          {!isActive && (
            <button
              onClick={handleSyncSubscription}
              disabled={syncing}
              className="w-full border border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4 text-sm"
            >
              {syncing ? "Syncing with Stripe…" : "Refresh subscription status"}
            </button>
          )}

          {syncMessage && (
            <div className={`rounded-lg p-3 mb-4 text-sm ${
              syncMessage.startsWith("Synced") 
                ? "bg-green-50 border border-green-200 text-green-800" 
                : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              {syncMessage}
            </div>
          )}

          {/* Features */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Included Features</h2>
            <ul className="space-y-3">
              {[
                "Unlimited conversations",
                "AI-powered responses",
                "SMS lead delivery",
                "Custom training",
                "Analytics dashboard",
                "24/7 availability",
              ].map((feature, i) => (
                <li key={i} className="flex items-center text-gray-700 text-sm">
                  <svg className={`w-4 h-4 mr-3 flex-shrink-0 ${isActive ? "text-green-500" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <MenuBar />
    </div>
  );
}

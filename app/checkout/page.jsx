"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthProvider";
import { useSubscription } from "../hooks/useSubscription";

const PLANS = [
  {
    id: "monthly",
    name: "Monthly",
    price: "$99",
    period: "/mo",
    badge: null,
    features: [
      "Unlimited conversations",
      "AI-powered qualification",
      "SMS lead delivery",
      "Custom training",
      "7-day free trial",
    ],
  },
  {
    id: "yearly",
    name: "Yearly",
    price: "$712.80",
    period: "/yr",
    badge: "Save 40% ($475/yr)",
    savingsPerMonth: "$59.40/mo",
    features: [
      "Everything in Monthly",
      "Priority support",
      "Advanced analytics",
      "Custom integrations",
      "7-day free trial",
    ],
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { isActive, status, loading } = useSubscription();
  const [selected, setSelected] = useState("yearly");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState(null);

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  // ── Success state: user just came back from Stripe ──────────────────────
  if (success === "true") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.6)]"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">You&apos;re all set!</h2>
          <p className="text-gray-400 mb-6">
            Your trial is active. You&apos;ll get full access for 7 days.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-white text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Already subscribed ──────────────────────────────────────────────────
  if (!loading && isActive) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">You&apos;re already subscribed!</h2>
          <p className="text-gray-400 mb-6">
            Status: <span className="capitalize text-green-400">{status}</span>
          </p>
          <button
            onClick={() => router.push("/profile/billing")}
            className="bg-white text-gray-900 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Manage Billing
          </button>
        </motion.div>
      </div>
    );
  }

  const handleSubscribe = async () => {
    if (!user?.uid) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent("/checkout")}`);
      return;
    }

    setIsRedirecting(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          plan: selected,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe-hosted checkout
      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message);
      setIsRedirecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(147, 51, 234, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(147, 51, 234, 0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl w-full relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 tracking-tight">
            system<span className="text-purple-500">.init</span>(team)
          </h1>
          <p className="text-gray-400 text-sm tracking-wide uppercase">
            Start your 7-day free trial — cancel anytime
          </p>
        </div>

        {/* Canceled notice */}
        {canceled === "true" && (
          <div className="bg-yellow-900/30 border border-yellow-500/30 text-yellow-300 px-4 py-3 rounded-lg mb-6 text-sm text-center">
            Checkout was canceled. You can try again whenever you&apos;re ready.
          </div>
        )}

        {/* Error notice */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={`relative text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                selected === plan.id
                  ? plan.id === "yearly"
                    ? "border-purple-500 bg-purple-900/20 ring-2 ring-purple-400/30"
                    : "border-purple-500 bg-gray-800/80"
                  : plan.id === "yearly"
                  ? "border-purple-400/40 bg-gray-800/60 hover:border-purple-400/60"
                  : "border-gray-700 bg-gray-800/40 hover:border-gray-600"
              }`}
            >
              {plan.badge && (
                <span className={`absolute -top-3 right-4 text-xs font-bold px-3 py-1 rounded-full ${
                  plan.id === "yearly"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    : "bg-purple-600 text-white"
                }`}>
                  {plan.badge}
                </span>
              )}
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-gray-400 text-sm">{plan.period}</span>
              </div>
              {plan.savingsPerMonth && (
                <p className="text-purple-300 text-xs font-semibold mb-3">
                  Just {plan.savingsPerMonth} when broken down
                </p>
              )}
              <p className={`font-semibold mb-3 ${plan.id === "yearly" ? "text-purple-200" : "text-white"}`}>
                {plan.name}
              </p>
              <ul className="space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center text-gray-300 text-sm">
                    <svg className="w-4 h-4 mr-2 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              {/* Radio indicator */}
              <div className={`absolute top-5 right-5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selected === plan.id ? "border-purple-500" : "border-gray-600"
              }`}>
                {selected === plan.id && (
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleSubscribe}
          disabled={isRedirecting}
          className="w-full bg-white text-gray-900 font-bold py-4 px-6 rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-white/20 text-base relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="relative z-10">
            {isRedirecting
              ? "Redirecting to Stripe…"
              : `Start Free Trial — ${selected === "monthly" ? "$99/mo" : "$712.80/yr"} after 7 days`}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-0 group-hover:opacity-30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        </button>

        <p className="text-center text-gray-500 text-xs mt-4">
          Card required for trial. Cancel anytime from your billing portal.
        </p>

        {/* Skip / Go to Dashboard */}
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full text-center text-gray-500 hover:text-gray-300 text-sm mt-4 py-2 transition-colors"
        >
          Skip for now &rarr; Go to Dashboard
        </button>
      </motion.div>
    </div>
  );
}

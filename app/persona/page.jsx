"use client";
import { useState, useEffect } from "react";
import Header from "../components/Header";
import MenuBar from "../components/MenuBar";
import Tab1 from "./Tab1";
import Tab2 from "./Tab2";
import { useRouter } from "next/navigation";
import { useNewNotification } from "../contexts/NewNotificationProvider";
import { useAuth } from "../contexts/AuthProvider";
import { useSubscription } from "../hooks/useSubscription";

const PersonaPage = () => {
  const [activeTab, setActiveTab] = useState("tab1");
  const { loading, user } = useAuth();
  const router = useRouter();
  const { showNotification = () => {} } = useNewNotification() || {};
  const { isActive: hasActiveSubscription, loading: subLoading } = useSubscription();

  useEffect(() => {
    // Single user type — no guest restriction
  }, [user]);

  if (status === "unauthenticated") {
    showNotification("You are not signed in. Please sign in.", "error");
    router.push("/auth/signin");
    return null;
  }

  // ── Subscription gate ──────────────────────────────────────────────────
  if (!subLoading && !hasActiveSubscription) {
    return (
      <div className="flex flex-col h-dvh bg-white">
        <Header text="AI Persona" />
        <div className="flex-grow overflow-y-auto pt-[90px] pb-[80px] flex items-center justify-center">
          <div className="text-center px-6 max-w-md">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Subscription Required</h2>
            <p className="text-gray-600 mb-6">
              AI Persona is a premium feature. Subscribe to unlock custom AI personalities, training, and more.
            </p>
            <button
              onClick={() => router.push("/checkout")}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              View Plans
            </button>
          </div>
        </div>
        <MenuBar />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-white">
      <Header text="AI Persona" />

      <div className="flex-grow overflow-y-auto pt-[90px] pb-[80px]">
      <div className="w-full min-h-14 flex justify-between">
        <button
          className={`w-full ${
            activeTab === "tab1"
              ? "border-b-2 border-solid border-black"
              : "text-Grey-600"
          }`}
          onClick={() => setActiveTab("tab1")}
        >
          Settings
        </button>
        <button
          className={`w-full ml-1 ${
            activeTab === "tab2"
              ? "border-b-2 border-solid border-black"
              : "text-Grey-600"
          }`}
          onClick={() => setActiveTab("tab2")}
        >
          Test AI Persona
        </button>
      </div>
      <hr />
      {activeTab === "tab1" && <Tab1 />}
      {activeTab === "tab2" && <Tab2 />}
      </div>
      <MenuBar />
    </div>
  );
};

export default PersonaPage;

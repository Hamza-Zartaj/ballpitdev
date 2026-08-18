"use client";

import React from "react";
import dynamic from "next/dynamic";

const AuthProvider = dynamic(() => import("./contexts/AuthProvider").then((module) => module.AuthProvider), { ssr: false });
const ChatProvider = dynamic(() => import("./contexts/ChatProvider").then((module) => module.ChatProvider), { ssr: false });
const NotificationProvider = dynamic(() => import("./contexts/NotificationProvider").then((module) => module.NotificationProvider), { ssr: false });
const NotificationLayout = dynamic(() => import("./noticationlayout"), { ssr: false });
const NewNotificationProvider = dynamic(() => import("./contexts/NewNotificationProvider").then((module) => module.NewNotificationProvider), { ssr: false });

const portfolioMode =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_PORTFOLIO_MODE === "true";

export default function ClientLayout({ children }) {
  // Handle viewport height for mobile keyboard
  // const [viewportHeight, setViewportHeight] = useState(() => {
  //   if (typeof window !== "undefined") {
  //     return window.visualViewport
  //       ? window.visualViewport.height
  //       : window.innerHeight;
  //   }
  //   return 667; // iPhone SE height as fallback
  // });

  // useEffect(() => {
  //   const updateViewportHeight = () => {
  //     if (typeof window === "undefined") return;

  //     const height = window.visualViewport
  //       ? window.visualViewport.height
  //       : window.innerHeight;

  //     setViewportHeight(height);
  //   };

  //   // Set initial height
  //   updateViewportHeight();

  //   // Add event listeners
  //   if (window.visualViewport) {
  //     window.visualViewport.addEventListener("resize", updateViewportHeight);
  //   } else {
  //     window.addEventListener("resize", updateViewportHeight);
  //   }

  //   return () => {
  //     if (window.visualViewport) {
  //       window.visualViewport.removeEventListener(
  //         "resize",
  //         updateViewportHeight,
  //       );
  //     } else {
  //       window.removeEventListener("resize", updateViewportHeight);
  //     }
  //   };
  // }, []);

  const content = (
    <div className="w-full flex justify-center sm:min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="relative flex w-full max-w-[528px] flex-col bg-white sm:rounded-3xl sm:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),_0_2px_4px_-1px_rgba(0,0,0,0.06)] overflow-hidden">
        {portfolioMode ? (
          children
        ) : (
          <NotificationProvider>
            <NotificationLayout>
              <NewNotificationProvider>{children}</NewNotificationProvider>
            </NotificationLayout>
          </NotificationProvider>
        )}
      </div>
    </div>
  );

  return portfolioMode ? (
    <AuthProvider>{content}</AuthProvider>
  ) : (
    <AuthProvider>
      <ChatProvider>{content}</ChatProvider>
    </AuthProvider>
  );
}

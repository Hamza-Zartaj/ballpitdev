"use client";

import React, { useEffect, useState } from "react";
import { NotificationProvider } from "./contexts/NotificationProvider";
import { AuthProvider } from "./contexts/AuthProvider";
import { ChatProvider } from "./contexts/ChatProvider";
import NotificationLayout from "./noticationlayout";
import { NewNotificationProvider } from "./contexts/NewNotificationProvider";

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

  return (
    <AuthProvider>
      <ChatProvider>
        <div className="w-full flex justify-center sm:min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
          <div className="relative flex w-full max-w-[528px] flex-col bg-white sm:rounded-3xl sm:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),_0_2px_4px_-1px_rgba(0,0,0,0.06)] overflow-hidden">
            <NotificationProvider>
              <NotificationLayout>
                <NewNotificationProvider>{children}</NewNotificationProvider>
              </NotificationLayout>
            </NotificationProvider>
          </div>
        </div>
      </ChatProvider>
    </AuthProvider>
  );
}

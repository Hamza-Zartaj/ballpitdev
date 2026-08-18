"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const ClientLayout = dynamic(() => import("../clientlayout"), { ssr: false });

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const isBlogPage = pathname === "/blogs" || pathname.startsWith("/blogs/");
  const isInstantChat = pathname.startsWith("/instantChat/");

  // Landing page and blog pages get full-screen layout
  if (isLandingPage || isBlogPage) {
    return (
      <div className="w-full min-h-screen flex flex-col">
        {children}
      </div>
    );
  }

  // Instant chat pages are guest-facing — skip AuthProvider/ChatProvider
  // to avoid the unmount/remount flash caused by auth loading state
  if (isInstantChat) {
    return (
      <div className="w-full flex justify-center sm:min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="relative flex w-full max-w-[528px] flex-col bg-white sm:rounded-3xl sm:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),_0_2px_4px_-1px_rgba(0,0,0,0.06)] overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // All other pages use the centered mobile layout
  return <ClientLayout>{children}</ClientLayout>;
}

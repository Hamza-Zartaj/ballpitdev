// app/instantChat/[host]/page.jsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@/app/components/Spinner";

const generateGuestId = () =>
  Math.floor(10000 + Math.random() * 90000).toString();

export default function InstantChatEntry() {
  const { host } = useParams(); // the creator’s UID
  const router = useRouter();
  const [loading, setLoading] = useState(true);  const [ready, setReady] = useState(false);
  const hasRun = useRef(false);
  const [noSubscription, setNoSubscription] = useState(false);

  useEffect(() => {
    if (!host) return;
    if (!host || hasRun.current || host.startsWith("guest-")) return;

    hasRun.current = true;

    const setupDemo = async () => {
      try {
        // 1️⃣ Fetch user details
        const resUser = await fetch(
          `/api/users?id=${host}`
        );
        if (!resUser.ok) throw new Error("Could not fetch user");
        const user = await resUser.json();
        
        

        // 2️⃣ Check host has an active subscription before creating a demo chat
        const isSubscriptionActive = user.hasSubscription === true;

        

        if (!isSubscriptionActive) {
          setLoading(false);
          setNoSubscription(true);
          return;
        }

        // 2️⃣ Fetch avatar for that user
        const resAvatar = await fetch(
          `/api/avatar?id=${host}`
        );
        const { avatar } = await resAvatar.json();
        // avatar is a URL string (or null/undefined); do NOT access .downloadURL
        const avatarURL = typeof avatar === "string" ? avatar : undefined;

        // 3️⃣ Generate demoId
        const guestId = generateGuestId();
        const demoId = `guest-${guestId}`;

        // 4️⃣ Create the demo user, passing in fetched avatar
        await fetch(
          `/api/demo/users?id=${demoId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              name: user.name,
              demoId: `Guest ${guestId}`,
              ...(avatarURL && { avatar: avatarURL }),
              creatorId: host,
              personaSetting: user.personaSetting,
            }),
          }
        );

        // 5️⃣ Redirect into the new chat room
        router.replace(`/instantChat/${host}/${demoId}`);
      } catch (err) {
        console.error("Error setting up demo chat:", err);
        setLoading(false);
      }
    };

    setupDemo();
  }, [host, router]);

  if (noSubscription) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Chat Unavailable</h2>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
          This chat is currently unavailable. The host does not have an active subscription.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      {loading ? (
        <Spinner />
      ) : (
        <p className="text-red-600">Could not create demo chat.</p>
      )}
    </div>
  );
}

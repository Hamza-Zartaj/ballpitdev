// app/chat/[id]/page.jsx
"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";

const ChatMain = dynamic(() => import("./ChatMain"), { ssr: false });
const ChatProvider = dynamic(() => import("@/app/contexts/ChatProvider").then((module) => module.ChatProvider), { ssr: false });
const DemoChatProvider = dynamic(() => import("@/app/contexts/DemoChatProvider").then((module) => module.DemoChatProvider), { ssr: false });

const portfolioMode =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_PORTFOLIO_MODE === "true";

function PortfolioChat() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-dvh bg-white">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-4">
        <button onClick={() => router.back()} className="text-xl" aria-label="Go back">
          &larr;
        </button>
        <div>
          <h1 className="text-base font-medium">Sarah Mitchell</h1>
          <p className="text-xs text-green-600">Online</p>
        </div>
      </header>
      <main className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex justify-start">
          <p className="max-w-[80%] rounded-2xl rounded-bl-sm bg-zinc-100 px-4 py-3 text-sm text-zinc-800">
            Hi! I found your website and I am interested in learning more.
          </p>
        </div>
        <div className="flex justify-end">
          <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-indigo-600 px-4 py-3 text-sm text-white">
            Thanks for reaching out. I would be happy to help.
          </p>
        </div>
        <div className="flex justify-start">
          <p className="max-w-[80%] rounded-2xl rounded-bl-sm bg-zinc-100 px-4 py-3 text-sm text-zinc-800">
            Thanks, that sounds perfect.
          </p>
        </div>
      </main>
      <div className="border-t border-zinc-200 p-4">
        <div className="rounded-full bg-zinc-100 px-4 py-3 text-sm text-zinc-400">
          Type a message...
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const { id } = useParams();
  const isDemo = id.startsWith("guest-");

  if (portfolioMode) {
    return <PortfolioChat />;
  }

  return isDemo ? (
    <DemoChatProvider chatId={id} guest={false} host={true}>
      <ChatMain />
    </DemoChatProvider>
  ) : (
    <ChatProvider>
      <ChatMain />
    </ChatProvider>
  );
}

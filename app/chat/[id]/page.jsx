// app/chat/[id]/page.jsx
"use client";

import { useParams } from "next/navigation";
import ChatMain from "./ChatMain";
import { ChatProvider } from "@/app/contexts/ChatProvider";
import { DemoChatProvider } from "@/app/contexts/DemoChatProvider";

export default function Page() {
  const { id } = useParams();
  const isDemo = id.startsWith("guest-");

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

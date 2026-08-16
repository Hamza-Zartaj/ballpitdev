// app/instantChat/[demoId]/page.jsx

// app/demo/chat/[id]/page.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatHeader from "@/app/chat/common/ChatHeader";
import moment from "moment";
import { useDemoChat, DemoChatProvider } from "@/app/contexts/DemoChatProvider";
import { Spinner } from "@/app/components/Spinner";
import {
  ref as storageRef,
  getDownloadURL,
  uploadBytes,
} from "firebase/storage";
import { storage } from "@/app/config/firebase";

export const dynamic = "force-dynamic";

/**
 * Renders a single chat bubble. For demo, we want:
 *   •   If isMe === true → align LEFT and use Purple (bg-Primary-500).
 *   •   If isMe === false → align RIGHT and use Gray (bg-Grey-800).
 */

const urlRegex = /(https?:\/\/[^\s]+)/g;
const boldRegex = /\*\*([^*]+)\*\*/g;

const parseTextContent = (text) => {
  // Split by URLs first
  const urlParts = text.split(urlRegex);

  return urlParts.map((part, i) => {
    // If this part is a URL, render as link
    if (urlRegex.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-blue-500 hover:text-blue-600"
        >
          {part}
        </a>
      );
    }

    // Otherwise, parse for bold text
    const boldParts = part.split(boldRegex);
    return boldParts.map((boldPart, j) => {
      // Check if this is bold text (every odd index is bold)
      if (j % 2 === 1) {
        return (
          <strong key={`${i}-${j}`} className="font-bold">
            {boldPart}
          </strong>
        );
      }
      return <span key={`${i}-${j}`}>{boldPart}</span>;
    });
  });
};

const ChatBubble = ({ isMe, time, type, content, isAI }) => {
  switch (type) {
    case "text":
      return (
        <div className="w-full flex flex-col">
          {/* Sent (isMe) → justify-end (right); Received → justify-start (left) */}
          <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
            <div
              className={`p-4 rounded-t-3xl max-w-[80%] text-md break-words ${
                isMe
                  ? "rounded-bl-3xl bg-Primary-500 text-white"
                  : "rounded-br-3xl bg-[#F4F4F5] text-black"
              }`}
            >
              {parseTextContent(content)}
            </div>
          </div>
          <div
            className={`mt-2 flex items-center ${
              isMe ? "justify-end" : "justify-start"
            }`}
          >
            <p className="text-sm font-satoshi">
              {moment.duration(moment(time).diff(new Date())).humanize(true)}
            </p>
          </div>
        </div>
      );

    case "media":
      return (
        <div className="w-full flex flex-col">
          <div className={`flex ${isMe ? "justify-start" : "justify-end"}`}>
            <div
              className={`rounded-t-3xl max-w-[80%] text-md ${
                isMe
                  ? "rounded-bl-3xl bg-Primary-500 text-white" // purple + white (left)
                  : "rounded-br-3xl bg-[#F4F4F5] text-black" // light‐gray + black (right)
              }`}
            >
              {content.type === "image" ? (
                <img
                  src={content.url}
                  alt="Uploaded media"
                  className={`max-w-full h-auto rounded-t-3xl ${
                    isMe ? "rounded-bl-3xl" : "rounded-br-3xl"
                  }`}
                />
              ) : (
                <video
                  controls
                  className={`max-w-full h-auto rounded-t-3xl ${
                    isMe ? "rounded-bl-3xl" : "rounded-br-3xl"
                  }`}
                >
                  <source src={content.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>
          <p
            className={`text-[14px] mt-2 ${isMe ? "text-left" : "text-right"}`}
          >
            {moment.duration(moment(time).diff(new Date())).humanize(true)}
          </p>
        </div>
      );

    case "info":
      return (
        <>
          <hr />
          <div className="w-full flex p-4">
            <img src="/assets/svgs/info.svg" className="h-[18px]" />
            <p className="px-3 text-xs">{content}</p>
          </div>
          <hr className="mb-4" />
        </>
      );

    default:
      return null;
  }
};

/**
 * Floating action button (unchanged).
 */
const Fab = ({ color, className, onClick, children }) => {
  return (
    <button
      className={`rounded-full flex justify-center items-center h-12 w-12 bg-${
        color || "[#5B49EF]"
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

/**
 * ChatInput: same as before, but calls demo‐chat hooks.
 */
const ChatInput = ({ onEnter, sendMessage, recipientId }) => {
  const [message, setMessage] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const { setTyping } = useDemoChat();
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    if (message) {
      setTyping(true);
      const timeoutId = setTimeout(() => setTyping(false), 500);
      return () => clearTimeout(timeoutId);
    } else {
      setTyping(false);
    }
  }, [message, setTyping]);

  const handleFileUpload = async (event, type) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      const fileName = `${file.name}-${Math.round(Math.random() * 10000000)}`;
      const storageReference = storageRef(storage, `demoMedias/${fileName}`);
      const snapshot = await uploadBytes(storageReference, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      sendMessage({ url: downloadURL, type }, "media");
      setAttachOpen(false);
    } catch (e) {
      console.error(`Error uploading ${type}:`, e);
      alert(`Failed to upload ${type}. Please try again.`);
    }
  };

  const router = useRouter();
  const { id } = useParams();

  const handleSendMessage = (text) => {
    if (!text.trim()) return;
    onEnter(text);
    setMessage("");
  };

  return (
    <div className="w-full flex flex-col pt-4 pb-10 px-4 min-h-auto">
      <input
        type="file"
        accept="image/*"
        ref={imageInputRef}
        onChange={(e) => handleFileUpload(e, "image")}
        className="hidden"
      />
      <input
        type="file"
        accept="video/*"
        ref={videoInputRef}
        onChange={(e) => handleFileUpload(e, "video")}
        className="hidden"
      />
      <div className="w-full flex items-center max-h-14">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target.value.trim()) {
              handleSendMessage(e.target.value);
            }
          }}
          placeholder="Enter your message"
          className="flex flex-grow mx-4 h-full px-4 py-6 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-Primary-500"
        />
        {message.length > 0 ? (
          <Fab color="black" onClick={() => handleSendMessage(message)}>
            <img src="/assets/svgs/send.svg" />
          </Fab>
        ) : (
          <Fab color="black" onClick={() => setAttachOpen((o) => !o)}>
            <img
              className={`${
                attachOpen ? "rotate-45" : ""
              } transition-transform`}
              src="/assets/svgs/plus.svg"
            />
          </Fab>
        )}
      </div>
      <div
        className={`w-full flex items-center justify-between transition-all ease-in-out ${
          attachOpen && message.length === 0
            ? "h-24 mt-4 px-4"
            : "opacity-0 h-0 overflow-hidden mt-0 px-4"
        }`}
      >
        <button
          className="flex flex-col flex-grow w-full items-center"
          onClick={() => imageInputRef.current.click()}
        >
          <div className="p-4 rounded-full flex w-full justify-center items-center bg-Grey-800 mb-3">
            <img src="/assets/svgs/attach-image.svg" />
          </div>
          <p className="font-cabinet">Image</p>
        </button>
        <button
          className="flex flex-col flex-grow w-full items-center ml-4"
          onClick={() => videoInputRef.current.click()}
        >
          <div className="p-4 rounded-full flex w-full justify-center items-center bg-Grey-800 mb-3">
            <img src="/assets/svgs/attach-video.svg" />
          </div>
          <p className="font-cabinet">Video</p>
        </button>
      </div>
    </div>
  );
};

/**
 * Typing indicator for demo chat.
 */
const TypingIndicator = ({ name }) => (
  <div className="w-full mt-4">
    <i className="italic px-4 py-2.5 text-gray-500 border-[1px] rounded-tl-3xl rounded-tr-3xl rounded-br-3xl">
      {name} is typing...
    </i>
  </div>
);

/**
 * DemoChatMain: Renders the chat UI using demo context.
 */
const DemoChatMain = () => {
  const { demoId } = useParams();
  const router = useRouter();
  const {
    sendMessage,
    messages,
    typingUsers,
    recipientName,
    recipientId,
    loading,
  } = useDemoChat();

  const chatContainerRef = useRef(null);

  // Scroll to bottom whenever messages update (with proper guard)
  useEffect(() => {
    const scrollToBottom = () => {
      const el = chatContainerRef.current;
      if (!el) return; // bail if ref is null

      const { scrollHeight, clientHeight } = el;
      el.scrollTop =
        scrollHeight - clientHeight > 0 ? scrollHeight - clientHeight : 0;
    };

    scrollToBottom();
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  if (!demoId || !demoId.startsWith("guest-")) {
    return <p className="text-red-600 p-4">Invalid demo chat ID.</p>;
  }

  if (loading) {
    // ← Return Spinner as JSX, not just the component reference
    return <Spinner />;
  }

  return (
    <>
      <ChatHeader
        name={recipientName}
        status="online"
        avatar="/assets/svgs/backbutton.svg"
        url={recipientId}
      />
      <hr className="mb-4" />
      <div
        className="flex flex-col flex-grow overflow-auto p-6 scroll-smooth"
        ref={chatContainerRef}
      >
        {messages.map((item) => (
          <ChatBubble
            key={`${item.time}_${item.id}`}
            isMe={item.isMe}
            type={item.type}
            content={item.content}
            time={item.time}
            isAI={item.isAI}
          />
        ))}

        {typingUsers.length > 0 && <TypingIndicator name={recipientName} />}
      </div>
      <hr />
      <ChatInput
        sendMessage={sendMessage}
        onEnter={(msg) => sendMessage(msg, "text")}
        recipientId={recipientId}
      />
    </>
  );
};

/**
 * Page component for /demo/chat/[id].
 * Wraps DemoChatMain in DemoChatProvider, which provides context.
 */
export default function Page() {
  const { demoId } = useParams();

  return (
    <DemoChatProvider chatId={demoId} guest={true}>
      <DemoChatMain />
    </DemoChatProvider>
  );
}

// app/instantChat/[host]/[demoId]/page.jsx
// app/instantChat/[host]/[demoId]/page.jsx
// export const dynamic = 'force-dynamic';

// export default async function ChatRoom({ params }) {
//     const { host, demoId } = params;

//     // You can re-validate “host” against your DB here if you want.
//     return (
//         <main className="p-4">
//             <h1>Chat Room for {host}</h1>
//             <p>Your guest ID is {demoId}</p>
//             {/* …your real InstantChat UI… */}
//         </main>
//     );
// }

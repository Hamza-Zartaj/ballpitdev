// app/instantChat/[demoId]/page.jsx

// app/demo/chat/[id]/page.jsx
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import ConsentModal from "@/app/chat/[id]/ConsentModal";
import { useParams } from "next/navigation";
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
import { ref, push } from "firebase/database";
import { database } from "@/app/config/firebase";
import { updateOne } from "@/app/utils/firebase/firestore";

/**
 * Renders a single chat bubble:
 *   •   If isMe === true  → align RIGHT, Purple  (bg-Primary-500)  — sent by me
 *   •   If isMe === false → align LEFT,  Gray    (bg-[#F4F4F5])    — received from AI
 */

const urlRegex = /(https?:\/\/[^\s]+)/g;
const boldRegex = /\*\*([^*]+)\*\*/g;

const parseTextContent = (text) => {
  // Split by URLs first
  const urlParts = text.split(urlRegex);

  return urlParts.map((part, i) => {
    // If this part is a URL, render as link
    const isUrl = part.startsWith("http://") || part.startsWith("https://");
    if (isUrl) {
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
  const timeAgo = useMemo(() => moment(time).fromNow(), [time]);

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
            <p className="text-sm font-satoshi">{timeAgo}</p>
          </div>
        </div>
      );

    case "media":
      return (
        <div className="w-full flex flex-col">
          <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
            <div
              className={`rounded-t-3xl max-w-[80%] text-md ${
                isMe
                  ? "rounded-bl-3xl bg-Primary-500 text-white" // purple + white (right)
                  : "rounded-br-3xl bg-[#F4F4F5] text-black" // light-gray + black (left)
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
            className={`text-[14px] mt-2 ${isMe ? "text-right" : "text-left"}`}
          >
            {timeAgo}
          </p>
        </div>
      );

    case "info":
      return (
        <>
          <hr />
          <div className="w-full flex p-4">
            <img src="/assets/svgs/info.svg" alt="Info" className="h-[18px]" />
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
const ChatInput = ({ onEnter, sendMessage, recipientId, isMobile = false }) => {
  const [message, setMessage] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const { setTyping } = useDemoChat();
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    clearTimeout(typingTimeout.current);
    if (message) {
      setTyping(true);
      typingTimeout.current = setTimeout(() => setTyping(false), 500);
    } else {
      setTyping(false);
    }
    return () => clearTimeout(typingTimeout.current);
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

  const handleSendMessage = (text) => {
    if (!text.trim()) return;
    onEnter(text);
    setMessage("");
  };

  return (
    <div className="w-full flex flex-col py-5 px-4 min-h-auto">
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
          className="flex flex-grow mx-4 h-full px-4 py-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-Primary-500"
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
          onClick={() => imageInputRef.current?.click()}
        >
          <div className="p-4 rounded-full flex w-full justify-center items-center bg-Grey-800 mb-3">
            <img src="/assets/svgs/attach-image.svg" />
          </div>
          <p className="font-cabinet">Image</p>
        </button>
        <button
          className="flex flex-col flex-grow w-full items-center ml-4"
          onClick={() => videoInputRef.current?.click()}
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
  const {
    sendMessage,
    messages,
    typingUsers,
    recipientName,
    recipientId,
    loading,
    chatEnded,
    host,
    hostName,
    hostAvatar,
    aiPersonaName,
  } = useDemoChat();

  // ✅ Hooks must come first
  const chatContainerRef = useRef(null);
  const containerRef = useRef(null);

  const [isMobile, setIsMobile] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [viewportHeight, setViewportHeight] = useState("100dvh");
  const greetingSentRef = useRef(false);

  // Detect if device is mobile
  useEffect(() => {
    const detectMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent,
        );
      const isSmallScreen = window.innerWidth <= 768; // Consider screens <= 768px as mobile
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    detectMobile();
    window.addEventListener("resize", detectMobile);

    return () => {
      window.removeEventListener("resize", detectMobile);
    };
  }, []);

  // Lock html/body and block all page-level scrolling (including iOS Safari)
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    // Save original values
    const saved = {
      htmlOverflow: html.style.overflow,
      htmlHeight: html.style.height,
      htmlPosition: html.style.position,
      htmlWidth: html.style.width,
      htmlTouchAction: html.style.touchAction,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
      bodyPosition: body.style.position,
      bodyWidth: body.style.width,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyTouchAction: body.style.touchAction,
      bodyOverscroll: body.style.overscrollBehavior,
    };

    // Pin html + body to the viewport
    html.style.overflow = "hidden";
    html.style.height = "100%";
    html.style.position = "fixed";
    html.style.width = "100%";
    html.style.touchAction = "none";
    html.style.overscrollBehavior = "none";

    body.style.overflow = "hidden";
    body.style.height = "100%";
    body.style.position = "fixed";
    body.style.width = "100%";
    body.style.top = "0";
    body.style.left = "0";
    body.style.touchAction = "none";
    body.style.overscrollBehavior = "none";

    // iOS Safari ignores overflow:hidden on body — intercept touchmove
    // Allow scrolling only inside the chat messages container
    const blockTouchMove = (e) => {
      const chatEl = chatContainerRef.current;
      if (chatEl && chatEl.contains(e.target)) return; // allow chat scroll
      e.preventDefault();
    };
    document.addEventListener("touchmove", blockTouchMove, { passive: false });

    return () => {
      html.style.overflow = saved.htmlOverflow;
      html.style.height = saved.htmlHeight;
      html.style.position = saved.htmlPosition;
      html.style.width = saved.htmlWidth;
      html.style.touchAction = saved.htmlTouchAction;
      html.style.overscrollBehavior = saved.htmlOverscroll;
      body.style.overflow = saved.bodyOverflow;
      body.style.height = saved.bodyHeight;
      body.style.position = saved.bodyPosition;
      body.style.width = saved.bodyWidth;
      body.style.top = saved.bodyTop;
      body.style.left = saved.bodyLeft;
      body.style.touchAction = saved.bodyTouchAction;
      body.style.overscrollBehavior = saved.bodyOverscroll;
      document.removeEventListener("touchmove", blockTouchMove);
    };
  }, []);

  // Track visual viewport height to handle mobile keyboard
  useEffect(() => {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      // Use visualViewport.height which shrinks when the keyboard opens
      setViewportHeight(`${vv.height}px`);
      if (containerRef.current) {
        containerRef.current.style.height = `${vv.height}px`;
      }
      // Prevent the page from scrolling behind the keyboard
      window.scrollTo(0, 0);
    };

    const handleScroll = () => window.scrollTo(0, 0);

    handleResize();
    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleScroll);

    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Show consent modal if not previously accepted (both must be accepted)
  useEffect(() => {
    const consent = localStorage.getItem("chat_consent");
    const instantConsent = localStorage.getItem("instant_chat_consent");
    if (consent !== "true" || instantConsent !== "true") {
      setShowConsentModal(true);
    }
  }, []);

  // Mark instant chat consent when modal is accepted
  const handleConsentAccepted = () => {
    localStorage.setItem("instant_chat_consent", "true");
    setShowConsentModal(false);
  };

  // scroll to bottom on new messages
  useEffect(() => {
    const scrollToBottom = () => {
      const el = chatContainerRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    };

    const rafId = requestAnimationFrame(scrollToBottom);
    return () => cancelAnimationFrame(rafId);
  }, [messages]);

  // Send greeting message immediately when chat loads (AI-generated)
  useEffect(() => {
    if (!recipientId || greetingSentRef.current) return;
    if (messages.length > 0) return;

    greetingSentRef.current = true;

    const sendGreeting = async () => {
      try {
        // Generate AI greeting using Persona API
        // The API uses chatHistory, so we need to include a user message asking for a greeting
        const personaUserId = host || recipientId;
        const res = await fetch(`/api/users/persona/test?id=${personaUserId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message:
              "Start the conversation with a friendly greeting that introduces what products or services you offer",
            chatHistory: [
              {
                role: "user",
                content:
                  "Start the conversation with a friendly greeting that introduces what products or services you offer",
              },
            ],
          }),
        });

        // 402 = host has no active subscription — skip AI greeting silently
        if (res.status === 402) {
          console.warn("Host subscription inactive — skipping AI greeting");
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to generate greeting");
        }

        const { message: aiMessage } = await res.json();
        const greetingText =
          typeof aiMessage === "string"
            ? aiMessage
            : aiMessage?.content || "Hello! How can I help you today?";

        const messagesRef = ref(database, `demoMessages/${recipientId}/`);
        await push(messagesRef, {
          content: greetingText,
          type: "text",
          author: `demo-${recipientId}`,
          created_at: new Date().toISOString(),
          isAI: true,
          status: 0, // MSG_SENT
        });

        // Update chat document
        await updateOne("demochats", recipientId, {
          lastMessage: greetingText,
          lastMessageAuthor: `demo-${recipientId}`,
          lastMessageTime: new Date(),
          unread: 1,
        });
      } catch (error) {
        console.error("Error generating/sending greeting message:", error);
        // Fallback to default greeting if AI generation fails
        try {
          const messagesRef = ref(database, `demoMessages/${recipientId}/`);
          await push(messagesRef, {
            content:
              "Hi there! I'm here to help you learn about what we offer and answer any questions you might have. What brings you in today?",
            type: "text",
            author: `demo-${recipientId}`,
            created_at: new Date().toISOString(),
            isAI: true,
            status: 0,
          });
          await updateOne("demochats", recipientId, {
            lastMessage:
              "Hi there! I'm here to help you learn about what we offer and answer any questions you might have. What brings you in today?",
            lastMessageAuthor: `demo-${recipientId}`,
            lastMessageTime: new Date(),
            unread: 1,
          });
        } catch (fallbackError) {
          console.error("Error sending fallback greeting:", fallbackError);
        }
      }
    };

    // Send greeting immediately
    sendGreeting();
  }, [recipientId, host]);

  // ✅ Conditional rendering after all hooks
  if (!recipientId || !recipientId.startsWith("guest-")) {
    return <p className="text-red-600 p-4">Invalid demo chat ID.</p>;
  }

  if (loading) {
    return <Spinner />;
  }

  return (
    <div
      ref={containerRef}
      style={{
        height: "100dvh",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#fff",
          zIndex: 10,
          flexShrink: 0,
          width: "100%",
        }}
      >
        <ChatHeader
          name={hostName || recipientName}
          status="online"
          avatar="/assets/svgs/backbutton.svg"
          url={hostAvatar || recipientId}
          showBackButton={false}
        />
        <hr />
      </div>

      {/* Chat area */}
      <div
        ref={chatContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1.5rem",
          background: "#fafafa",
          WebkitOverflowScrolling: "touch",
          minHeight: 0,
        }}
      >
        {messages.length > 0 && (
          <>
            {messages.map((item, idx) => (
              <ChatBubble
                key={item.id || `${item.time}-${item.author}-${idx}`}
                isMe={item.isMe ?? !item.isAI}
                type={item.type}
                content={item.content}
                time={item.time}
                isAI={item.isAI}
              />
            ))}
            {typingUsers.length > 0 && <TypingIndicator name={aiPersonaName || recipientName} />}
          </>
        )}
      </div>

      {/* Input — disabled when chat has timed out */}
      <div
        style={{
          background: "#fff",
          zIndex: 10,
          flexShrink: 0,
          width: "100%",
        }}
      >
        <hr />
        {chatEnded ? (
          <div className="w-full flex items-center justify-center py-5 px-4">
            <div className="flex items-center gap-2 px-6 py-3 bg-zinc-100 rounded-full">
              <svg
                className="w-5 h-5 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="text-sm font-medium text-zinc-500">
                Chat closed
              </span>
            </div>
          </div>
        ) : (
          <ChatInput
            sendMessage={sendMessage}
            onEnter={(msg) => sendMessage(msg, "text")}
            recipientId={recipientId}
            isDemo={true}
            isMobile={isMobile}
          />
        )}
      </div>
      {showConsentModal && <ConsentModal onClose={handleConsentAccepted} />}
    </div>
  );
};

/**
 * Page component for /demo/chat/[id].
 * Wraps DemoChatMain in DemoChatProvider, which provides context.
 */
export default function Page() {
  const { demoId, host } = useParams();

  return (
    <DemoChatProvider chatId={demoId} host={host} guest={true}>
      <DemoChatMain />
    </DemoChatProvider>
  );
}

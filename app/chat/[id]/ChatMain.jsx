"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatHeader from "../common/ChatHeader";
import moment from "moment";
import { useChat } from "@/app/contexts/ChatProvider";
import { useDemoChat } from "@/app/contexts/DemoChatProvider";
import { useAuth } from "@/app/contexts/AuthProvider";
import { storage } from "@/app/config/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Spinner } from "@/app/components/Spinner";

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
          className="underline text-blue-400 hover:text-blue-300"
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

const ChatBubble = (props) => {
  const { isMe, time, type, content, isAI } = props;
  switch (type) {
    case "text":
      return (
        <div className={`w-full flex flex-col`}>
          <div className={`flex ${isMe ? "justify-end" : ""}`}>
            <div
              className={`p-4 rounded-t-3xl max-w-[80%] text-md break-words ${
                !isMe
                  ? "rounded-br-3xl bg-Grey-800"
                  : "rounded-bl-3xl bg-Primary-500 text-white"
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
            {isAI ? (
              <img
                className="h-6 w-6 mr-2.5"
                src="/assets/svgs/ai-persona.svg"
              />
            ) : (
              <></>
            )}
            <p className={`text-sm font-satoshi`}>
              {moment.duration(moment(time).diff(new Date())).humanize(true)}
            </p>
          </div>
          {/* <p className={`text-[14px] mt-2 ${isMe ? "text-right" : ""}`}>
            {moment.duration(moment(time).diff(Date.now())).humanize(true)}
          </p> */}
        </div>
      );
    case "media":
      return (
        <div className={`w-full flex flex-col`}>
          <div className={`flex ${isMe ? "justify-end" : ""}`}>
            <div
              className={`rounded-t-3xl max-w-[80%] text-md ${
                !isMe
                  ? "rounded-br-3xl bg-[#F4F4F5]"
                  : "rounded-bl-3xl bg-Primary-500 text-white"
              }`}
            >
              {content.type === "image" ? (
                <img
                  src={content.url}
                  alt="Uploaded media"
                  className={`max-w-full h-auto rounded-t-3xl ${
                    !isMe ? "rounded-br-3xl" : "rounded-bl-3xl"
                  }`}
                />
              ) : (
                <video
                  controls
                  className={`max-w-full h-auto rounded-t-3xl ${
                    !isMe ? "rounded-br-3xl" : "rounded-bl-3xl"
                  }`}
                >
                  {/* <source src={content.url} type={content.type} /> */}
                  <source src={content.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>
          <p className={`text-[14px] mt-2 ${isMe ? "text-right" : ""}`}>
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
      return <></>;
  }
};

const Fab = (props) => {
  const { color, className, onClick } = props;
  return (
    <button
      className={`rounded-full flex justify-center items-center h-12 w-12 bg-${
        color || "[#5B49EF]"
      } ${className}`}
      onClick={onClick}
    >
      {props.children}
    </button>
  );
};

export const ChatInput = (props) => {
  const { onEnter, sendMessage, recipientId, setTyping, isMobile } = props;
  const [message, setMessage] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);

  // Touch handling for mobile keyboard dismissal
  const [touchStart, setTouchStart] = useState(null);

  const handleTouchStart = (e) => {
    if (!isMobile) return;
    
    // Don't prevent default - allow normal input behavior
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isMobile || touchStart === null) return;

    const currentTouch = e.touches[0].clientY;
    const touchDiff = touchStart - currentTouch;

    

    // If upward swipe (touchDiff > 0) and significant movement
    if (touchDiff > 50) {
      
      // Prevent default scrolling behavior during keyboard dismissal
      e.preventDefault();

      // Close keyboard by blurring inputs
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA")
      ) {
        
        const inputs = document.querySelectorAll("input, textarea");
        inputs.forEach((input) => {
          if (input === activeElement) {
            input.blur();
          }
        });
      }

      // Reset touch start after dismissing keyboard
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    
    setTouchStart(null);
  };
  // const { setTyping } = useChat();
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    if (message) {
      
      setTyping(true);
      const timeoutId = setTimeout(() => {
        
        setTyping(false);
      }, 500);
      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      
      setTyping(false);
    }
  }, [message, setTyping]);

  const handleFileUpload = async (event, type) => {
    try {
      const file = event.target.files[0];
      if (file) {
        
        const downloadUrl = await uploadToFirebase(file);
        
        sendMessage(
          {
            url: downloadUrl,
            type,
          },
          "media"
        );
        setAttachOpen(false);
      }
    } catch (e) {
      console.error(`Error uploading ${type} file:`, e);
      alert(`Failed to upload ${type}. Please try again.`);
      throw e;
    }
  };

  const uploadToFirebase = async (file) => {
    try {
      
      const fileName = `${file.name}-${Math.round(Math.random() * 10000000)}`;
      
      const storageRef = ref(storage, `medias/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (e) {
      console.error("Error in uploadToFirebase:", e);
      throw e;
    }
  };

  const router = useRouter();
  const { id } = useParams();

  const handleSendMessage = (text) => {
    if (!text.trim()) {
      
      return;
    }

    
    onEnter(text);
    setMessage("");
  };

  return (
    <div
      className="w-full flex flex-col py-5 px-4 min-h-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
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
            if (e.key === "Enter") {
              if (e.target.value.trim().length > 0) {
                const value = e.target.value;
                handleSendMessage(value);
              }
            }
          }}
          placeholder="Enter your message"
          className="flex flex-grow mx-4 h-full
        px-4 py-4 border border-gray-300 rounded-full 
        focus:outline-none focus:ring-2 focus:ring-Primary-500"
        ></input>
        {message.length > 0 ? (
          <Fab color="black" onClick={() => handleSendMessage(message)}>
            <img src="/assets/svgs/send.svg" />
          </Fab>
        ) : (
          <Fab color="black" onClick={() => setAttachOpen(!attachOpen)}>
            <img
              className={`${
                attachOpen ? "rotate-45" : ""
              } transition-all ease-in-out`}
              src="/assets/svgs/plus.svg"
            />
          </Fab>
        )}
      </div>
      <div
        className={`w-full flex items-center justify-between transition-all ease-in-out ${
          attachOpen === true && message.length === 0
            ? "h-24 mt-4 px-4 "
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

const Typing = (props) => {
  const { name } = props;
  return (
    <div className="w-full mt-4">
      <i className="italic px-4 py-2.5 text-gray-500 border-[1px] rounded-tl-3xl rounded-tr-3xl rounded-br-3xl">
        {name} is typing...
      </i>
    </div>
  );
};

const ChatMain = () => {
  const { id } = useParams();

  const isDemo = id.startsWith("guest-");
  const chatContext = isDemo ? useDemoChat() : useChat();

  const {
    sendMessage,
    messages,
    typingUsers,
    setChatId,
    recipientName,
    recipientId,
    loading,
    writeTyping,
    url,
    setTyping,
    chatEnded,
  } = chatContext;
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const chatContainerRef = useRef(null);
  const headerRef = useRef(null);

  const [viewportHeight, setViewportHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect if device is mobile
  useEffect(() => {
    const detectMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          userAgent
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



  useEffect(() => {
    if (!isDemo) {
      setChatId(id);
    }
  }, [id, setChatId, isDemo]);
  // Log messages when they change
  useEffect(() => {
  }, [messages]);

  // Log typing users when they change
  useEffect(() => {
    
  }, [typingUsers]);

  // Improved scroll behavior for chat
  useEffect(() => {
    const scrollToBottom = () => {
      
      if (chatContainerRef.current) {
        const scrollHeight = chatContainerRef.current.scrollHeight;
        const height = chatContainerRef.current.clientHeight;
        const maxScrollTop = scrollHeight - height;

        chatContainerRef.current.scrollTop =
          maxScrollTop > 0 ? maxScrollTop : 0;
      }
    };

    scrollToBottom();
    // Add small delay to ensure messages are rendered
    const timeoutId = setTimeout(scrollToBottom, 100);

    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Auto-scroll when keyboard appears and handle viewport layout (mobile only)
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer || !isMobile) return; // Only apply on mobile devices

    const scrollToBottom = () => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    };

    // Handle keyboard open/close and viewport adjustments
    const handleViewportChange = () => {
      const visualViewport = window.visualViewport;
      if (!visualViewport) return;

      const currentHeight = visualViewport.height;
      const windowHeight = window.innerHeight;
      const isKeyboardOpen = currentHeight < windowHeight * 0.75;

      // Force exact height to eliminate gaps
      setViewportHeight(currentHeight);

      // Adjust body and html to exact viewport height
      document.body.style.height = currentHeight + "px";
      document.documentElement.style.height = currentHeight + "px";

      if (isKeyboardOpen) {
        // Auto-scroll to bottom when keyboard opens
        setTimeout(() => {
          scrollToBottom();
        }, 50);
      }
    };

    // Initial setup
    handleViewportChange();

    // Listen for visual viewport changes (keyboard open/close)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener(
          "resize",
          handleViewportChange
        );
      }
    };
  }, [isMobile]);

  // Set viewport height after hydration
  useEffect(() => {
    const updateViewportHeight = () => {
      if (typeof window !== "undefined") {
        setViewportHeight(
          window.visualViewport
            ? window.visualViewport.height
            : window.innerHeight
        );
      }
    };

    updateViewportHeight();

    if (typeof window !== "undefined" && window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateViewportHeight);
      return () => {
        window.visualViewport.removeEventListener(
          "resize",
          updateViewportHeight
        );
      };
    }
  }, []);

  // scroll to bottom on new messages
  useEffect(() => {
    const scrollToBottom = () => {
      const el = chatContainerRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    };

    scrollToBottom();
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // viewport resize
  useEffect(() => {
    const setHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
    };

    setHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", setHeight);
    } else {
      window.addEventListener("resize", setHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", setHeight);
      } else {
        window.removeEventListener("resize", setHeight);
      }
    };
  }, []);

  // lock body scroll and handle keyboard layout (mobile only)
  useEffect(() => {
    if (!isMobile) return; // Only apply on mobile devices

    const setBodyHeight = () => {
      const height = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.height = height + "px";
      document.documentElement.style.height = height + "px";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = "0";
      document.body.style.left = "0";
      document.body.style.margin = "0";
      document.body.style.padding = "0";
      document.documentElement.style.margin = "0";
      document.documentElement.style.padding = "0";
    };

    setBodyHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", setBodyHeight);
    } else {
      window.addEventListener("resize", setBodyHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", setBodyHeight);
      } else {
        window.removeEventListener("resize", setBodyHeight);
      }
      // Restore normal body styles when component unmounts or switches to desktop
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.height = "";
      document.documentElement.style.height = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.margin = "";
      document.body.style.padding = "";
      document.documentElement.style.margin = "";
      document.documentElement.style.padding = "";
    };
  }, [isMobile]);

  if (status === "unauthenticated") {
    
    router.push("/auth/signin");
    return null;
  }

  if (loading) {
    
    return <Spinner />;
  }

  

  if (!viewportHeight) return null;

  return (
    <div
      style={
        isMobile
          ? {
              // Mobile: Full screen with fixed positioning
              height: viewportHeight,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
            }
          : {
              // Desktop/Large devices: Normal layout
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              position: "relative",
              maxWidth: "100%",
            }
      }
    >
      {/* Header */}
      <div
        ref={headerRef}
        onTouchStart={(e) => {
          if (isMobile) headerRef.current.touchStartY = e.touches[0].clientY;
        }}
        onTouchMove={(e) => {
          if (!isMobile) return; // Only handle touch on mobile

          const touchStartY = headerRef.current.touchStartY || 0;
          const touchY = e.touches[0].clientY;
          const deltaY = touchStartY - touchY;

          // Only close keyboard on upward touch movement (deltaY > 0 means moving up)
          if (deltaY > 0) {
            const activeElement = document.activeElement;
            if (
              activeElement &&
              (activeElement.tagName === "INPUT" ||
                activeElement.tagName === "TEXTAREA")
            ) {
              activeElement.blur();
            }

            // Also blur any focused elements
            const inputs = document.querySelectorAll("input, textarea");
            inputs.forEach((input) => {
              if (input === activeElement) {
                input.blur();
              }
            });
          }
        }}
        onTouchEnd={() => {
          if (isMobile && headerRef.current) {
            headerRef.current.touchStartY = 0;
          }
        }}
        style={{
          flexShrink: 0,
          background: "#fff",
          zIndex: 10,
          position: isMobile ? "sticky" : "relative",
          top: isMobile ? 0 : "auto",
        }}
      >
        <ChatHeader
          name={isDemo ? id : recipientName || "Anonymous"}
          status="online"
          avatar="/assets/svgs/backbutton.svg"
        />
        <hr />
      </div>
      {/* Chat area */}
      <div
        ref={chatContainerRef}
        onTouchStart={(e) => {
          if (isMobile)
            chatContainerRef.current.touchStartY = e.touches[0].clientY;
        }}
        onTouchMove={(e) => {
          if (!isMobile) return; // Only handle touch on mobile

          // Only handle touch move if we're at the bottom of chat
          const chatContainer = chatContainerRef.current;
          const threshold = 10; // 10px threshold for "at bottom"
          const isAtBottom =
            chatContainer.scrollTop >=
            chatContainer.scrollHeight - chatContainer.clientHeight - threshold;

          if (isAtBottom) {
            const touchStartY = chatContainerRef.current.touchStartY || 0;
            const touchY = e.touches[0].clientY;
            const deltaY = touchStartY - touchY;

            // Only close keyboard on upward touch movement (deltaY > 0 means moving up)
            if (deltaY > 0) {
              const activeElement = document.activeElement;
              if (
                activeElement &&
                (activeElement.tagName === "INPUT" ||
                  activeElement.tagName === "TEXTAREA")
              ) {
                activeElement.blur();
              }

              // Also blur any focused elements
              const inputs = document.querySelectorAll("input, textarea");
              inputs.forEach((input) => {
                if (input === activeElement) {
                  input.blur();
                }
              });
            }
          }
        }}
        onTouchEnd={() => {
          if (isMobile && chatContainerRef.current) {
            chatContainerRef.current.touchStartY = 0;
          }
        }}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1.5rem",
          background: "#fafafa",
          position: "relative",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {messages.length > 0 ? (
          <>
            {messages.map((item) => (
              <ChatBubble
                key={item.time + item.id}
                isMe={item.isMe}
                type={item.type}
                content={item.content}
                time={item.time}
                isAI={false}
              />
            ))}
            {typingUsers.length === 2 ? (
              <Typing name={recipientName} />
            ) : typingUsers.length === 1 &&
              typingUsers[0] !== session.user.id ? (
              <Typing name={recipientName} />
            ) : (
              <></>
            )}
          </> // ✅ Neon Logo Centered (Glass Morphism Card)
        ) : (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "80%",
              maxWidth: "400px",
              borderRadius: "1rem",
              overflow: "hidden", // ensures blur doesn't overflow corners
              boxShadow: "0 4px 8px #b2adceff",
              textAlign: "center",
              userSelect: "none",
            }}
          >
            {/* Background image with blur */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "linear-gradient(rgba(130, 127, 127, 0.4), rgba(168, 163, 163, 0.4)))",
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(1px)", // only background blurred
                zIndex: 0,
              }}
            />

            {/* Foreground content */}
            <div
              style={{
                position: "relative",
                padding: "2rem",
                color: "white",
                zIndex: 1,
                backdropFilter: "blur(0px)", // text stays clear
              }}
            >
              <style>{`
                                .logo b {
                                    font: 800 2.5vh "CabinetGrotesk", Arial, sans-serif;
                                    color: rgba(234, 227, 227, 1);
                                    text-shadow: 0 -40px 100px,
                                    0 0 2px,
                                    0 0 1em rgba(91, 73, 239, 1),
                                    0 0 0.5em rgba(91, 73, 239, 1),
                                    0 0 0.1em rgba(91, 73, 239, 1),
                                    0 6px 3px #000;
                                }
                                .logo b span {
                                    animation: blink linear infinite 2s;
                                }
                                .logo b span:nth-of-type(2) {
                                    animation: blink linear infinite 3s;
                                }
                                @keyframes blink {
                                    78% { color: inherit; text-shadow: inherit; }
                                    79% { color: #333; text-shadow: none; }
                                    80% { color: inherit; text-shadow: inherit; }
                                    81% { color: #333; text-shadow: none; }
                                    83% { color: inherit; text-shadow: inherit; }
                                    92% { color: #333; text-shadow: none; }
                                    92.5% { color: inherit; text-shadow: inherit; }
                                }
                                `}</style>

              <div className="logo">
                <b>
                  TEXT <span>"HELLO" </span>TO <span>TALK </span>👇🏻
                </b>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Input — disabled when chat has timed out */}
      <div
        style={
          isMobile
            ? {
                // Mobile: Sticky positioning for keyboard handling
                flexShrink: 0,
                background: "#fff",
                zIndex: 10,
                position: "sticky",
                bottom: 0,
                marginTop: "auto",
              }
            : {
                // Desktop: Normal flow
                flexShrink: 0,
                background: "#fff",
                zIndex: 10,
                position: "relative",
              }
        }
      >
        <hr />
        {isDemo && chatEnded ? (
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
            setTyping={setTyping}
            isMobile={isMobile}
          />
        )}
      </div>

    </div>
  );
};

export default ChatMain;

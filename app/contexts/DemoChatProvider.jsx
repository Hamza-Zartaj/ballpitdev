// app/contexts/DemoChatProvider.js
"use client";

import {
  ref,
  onValue,
  push,
  set as rtdbSet,
  onDisconnect,
  limitToLast,
  query,
  get,
  onChildAdded,
  off,
} from "firebase/database";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
import { auth, database, firestore } from "@/app/config/firebase";
import { collection, getDocs, where } from "firebase/firestore";
import { getById, updateOne } from "../utils/firebase/firestore";
import fetchAllMessages from "../utils/fetchAllMessages";

const DemoChatContext = createContext();

export const MSG_SENT = 0;
export const MSG_READ = 1;

// Inactivity timeout duration (75 seconds)
const INACTIVITY_TIMEOUT_MS = 75 * 1000;

export const DemoChatProvider = ({ children, chatId, guest, host }) => {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [recipientName, setRecipientName] = useState(`Guest Room: ${chatId}`);
  const [recipientId, setRecipientId] = useState(chatId);
  const [loading, setLoading] = useState(true);
  const [hostName, setHostName] = useState("");
  const [hostAvatar, setHostAvatar] = useState("");
  const [aiPersonaName, setAiPersonaName] = useState("");
  const processedKeys = useRef(new Set());
  const [recipientHasPersonaEnabled, setRecipientHasPersonaEnabled] =
    useState(true);
  const recipientHasPersonaEnabledRef = useRef(true); // Keep ref in sync to avoid effect re-runs

  // ── Chat inactivity timeout state ──
  const [chatEnded, setChatEnded] = useState(false);
  const chatEndedRef = useRef(false);
  const inactivityTimerRef = useRef(null);
  const wasAlreadyEndedRef = useRef(false); // Track if chat was already ended on load

  // Keep ref in sync with state
  useEffect(() => {
    chatEndedRef.current = chatEnded;
  }, [chatEnded]);

  // Keep messagesRef in sync with messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Keep recipientHasPersonaEnabledRef in sync with state
  useEffect(() => {
    recipientHasPersonaEnabledRef.current = recipientHasPersonaEnabled;
  }, [recipientHasPersonaEnabled]);

  const mountTimeRef = useRef(Date.now());
  const transcriptSavedRef = useRef(false); // Track if transcript has been saved
  const sessionEndQueuedRef = useRef(false); // Track if end-of-session handlers have been queued (prevent duplicates)
  const saveTranscriptRef = useRef(null); // Ref to bridge ordering between endChat and saveTranscript
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const messagesRef = useRef([]); // Always-current messages for use in unload handlers
  const demoUserRef = useRef(null); // Cached demoUser metadata for unload handlers

  /**
   * End the chat session:
   *  1. Save the transcript to Firestore and spreadsheet
   *  2. Send SMS notification to the host
   *  3. Mark chat as ended (blocks further messages)
   *  4. Clear the inactivity timer
   */
  const endChat = useCallback(async () => {
    if (chatEndedRef.current) return; // already ended
    chatEndedRef.current = true;
    setChatEnded(true);

    // Clear any pending timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    

    // 1. Save transcript first (so it's available for SMS and spreadsheet)
    if (saveTranscriptRef.current) {
      try {
        await saveTranscriptRef.current();
        
      } catch (err) {
        console.error(`Error saving transcript for chatId ${chatId}:`, err);
      }
    }

    // 2. Send SMS/WhatsApp notification to host
    try {
      const smsRes = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
      });
      const smsData = await smsRes.json();
      
    } catch (err) {
      console.error(`Error sending SMS for chatId ${chatId}:`, err);
    }

    // 3. Mark chat as ended LAST (after transcript and SMS are done)
    if (chatId) {
      try {
        await updateOne("demochats", chatId, { ended: true, endedAt: new Date() });
        
      } catch (err) {
        console.error(`Error marking chat as ended in database:`, err);
      }
    }
  }, [chatId]);

  /**
   * Reset (or start) the 75-second inactivity timer.
   * Called on every new message.
   */
  const resetInactivityTimer = useCallback(() => {
    if (chatEndedRef.current) return;

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      endChat();
    }, INACTIVITY_TIMEOUT_MS);
  }, [endChat]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  /**
   * Save transcript when chat ends
   * - Fetches all messages
   * - Gets chat metadata
   * - Calls API to save transcript
   * - Handles errors gracefully
   * - Skips if chat was already ended (already saved previously)
   */
  const saveTranscript = useCallback(async () => {
    // Skip if chat was already ended when we loaded it (already saved)
    if (wasAlreadyEndedRef.current) {
      
      return;
    }
    
    // Skip if no chat ID
    if (!chatId) {
      return;
    }

    try {
      

      // Double-check: Get current chat status from database
      // This prevents saving if chat was already ended (e.g., when viewing closed chat in dashboard)
      const currentChatStatus = await getById("demochats", chatId).catch(() => null);
      if (currentChatStatus?.ended === true) {
        
        wasAlreadyEndedRef.current = true; // Mark it so we don't check again
        return;
      }

      // Fetch all messages
      const allMessages = await fetchAllMessages(chatId, "instant");

      // Don't save if no messages
      if (!allMessages || allMessages.length === 0) {
        
        return;
      }

      // Get chat metadata from demoChats collection
      const chatMetadata = await getById("demochats", chatId).catch(() => null);

      // Get demo user data for host/guest info (now merged into demochats collection)
      const demoUser = await getById("demochats", chatId).catch(() => null);

      

      let baseUrl = "";
      if (typeof window !== "undefined" && window.location?.origin) {
        baseUrl = window.location.origin;
      } else if (process.env.NEXT_PUBLIC_SITE_URL) {
        baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
      } else if (process.env.NEXT_PUBLIC_API_URL) {
        try {
          const url = new URL(process.env.NEXT_PUBLIC_API_URL);
          baseUrl = url.origin;
        } catch (err) {
          baseUrl = "";
        }
      }
      const normalizedBaseUrl = baseUrl?.replace(/\/$/, "");
      let instantChatLink = null;
      if (demoUser?.creatorId) {
        const relativeLink = `/instantChat/${demoUser.creatorId}/${chatId}`;
        instantChatLink =
          normalizedBaseUrl && normalizedBaseUrl !== ""
            ? `${normalizedBaseUrl}${relativeLink}`
            : relativeLink;
      }

      // Fetch host user data to get name and email
      let hostName = null;
      let hostEmail = null;
      if (demoUser?.creatorId) {
        try {
          const hostRes = await fetch(`/api/users?id=${demoUser.creatorId}`);
          if (hostRes.ok) {
            const hostData = await hostRes.json();
            hostName = hostData.name || null;
            hostEmail = hostData.email || null;
            
          } else {
            console.error(`[DemoChatProvider] ❌ Host API returned status ${hostRes.status}`);
          }
        } catch (err) {
          console.error(`[DemoChatProvider] ❌ Error fetching host data for ${demoUser.creatorId}:`, err);
        }
      }
      
      if (hostName) {
        
      } else {
        console.warn(`[DemoChatProvider] ⚠️ No hostName found, will rely on server-side enrichment`);
      }

      // Prepare metadata for transcript
      const metadata = {
        createdAt:
          chatMetadata?.createdAt || chatMetadata?.created_at || new Date(),
        endedAt: new Date(),
        hostId: demoUser?.creatorId || null,
        hostName: hostName,
        hostEmail: hostEmail,
        guestId: chatId,
        host: `demo-${chatId}`,
        guest: `guest-${chatId}`,
        instantChatLink,
      };

      

      // Call API to save transcript
      const response = await fetch("/api/transcripts/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: chatId,
          chatType: "instant",
          messages: allMessages,
          metadata: metadata,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to save transcript: ${response.status}`
        );
      }

      const result = await response.json();
      
    } catch (error) {
      // Log error but don't block user
      console.error(`Error saving transcript for chatId ${chatId}:`, error);
    }
  }, [chatId]);

  // Keep saveTranscriptRef in sync so endChat can call it
  useEffect(() => {
    saveTranscriptRef.current = saveTranscript;
  }, [saveTranscript]);
  // Fetch host information (name and avatar) when host is available
  useEffect(() => {
    if (!host) return;

    (async () => {
      try {
        // Fetch host's user data
        const resUser = await fetch(`/api/users?id=${host}`);
        if (resUser.ok) {
          const userData = await resUser.json();
          if (userData?.name) {
            setHostName(userData.name);
          }
          // Extract AI persona name from personaSetting
          if (userData?.personaSetting?.name) {
            setAiPersonaName(userData.personaSetting.name);
          }
        }

        // Fetch host's avatar
        const resAvatar = await fetch(`/api/avatar?id=${host}`);
        if (resAvatar.ok) {
          const avatarData = await resAvatar.json();
          if (avatarData?.avatar?.downloadURL) {
            setHostAvatar(avatarData.avatar.downloadURL);
          }
        }
      } catch (e) {
        console.warn("Could not load host information:", e);
      }
    })();
  }, [host]);
  useEffect(() => {
    if (!chatId) return;

    // ── Fetch the demo-user’s record so we can show its real name ──
    (async () => {
      try {
        const demoUser = await getById("demoUsers", chatId);
        if (demoUser?.name) {
          setRecipientName(demoUser.name);
        }
        demoUserRef.current = demoUser || null; // Cache for unload handlers
      } catch (e) {
        console.warn("Could not load demoUser for name:", e);
      }
    })();

    
    const messagesRef = ref(database, `demoMessages/${chatId}`);

    const fetchInitialMessages = async () => {
      // Check if chat is already ended in database
      try {
        const chatMetadata = await getById("demochats", chatId).catch(() => null);
        if (chatMetadata?.ended === true) {
          
          chatEndedRef.current = true;
          setChatEnded(true);
          wasAlreadyEndedRef.current = true; // Mark as already ended so we don't save transcript again
        }
      } catch (err) {
        console.error(`Error checking chat ended status:`, err);
      }
      setLoading(true);
      try {
        const snap = await get(query(messagesRef, limitToLast(30)));
        const data = snap.val() || {};

        // turn into an array
        const list = Object.entries(data).map(([key, msg]) => {
          const isFromGuest = msg.author === `guest-${chatId}`;
          const isFromHost = msg.author === `demo-${chatId}`;
          const isAI = !!msg.isAI;

          // who “am I”?
          const isMe = guest ? isFromGuest : isFromHost;

          return {
            id: key,
            isMe,
            type: msg.type || "text",
            time: msg.created_at,
            content: msg.content,
            isAI,
          };
        });

        processedKeys.current = new Set(Object.keys(data));
        setMessages(list);

        // zero out unread…
        const meta = await getById("demochats", chatId).catch(() => null);
        if (meta?.unread) await updateOne("demochats", chatId, { unread: 0 });
      } catch (e) {
        console.error("Error fetching initial messages:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialMessages();

    // Start the inactivity timer once we've loaded messages
    // (will be reset on each new message via onChildAdded)
    resetInactivityTimer();

    // Listen for child_added under `demoMessages/{chatId}`
    const handleNewMessage = async (snapshot) => {
      const key = snapshot.key;
      if (processedKeys.current.has(key)) return;
      processedKeys.current.add(key);

      const msg = snapshot.val();
      const ts = new Date(msg.created_at).getTime();
      if (ts <= mountTimeRef.current) return;

      const isFromGuest = msg.author === `guest-${chatId}`;
      const isFromHost = msg.author === `demo-${chatId}`;
      const isAI = !!msg.isAI;

      // Reset inactivity timer on every new message
      resetInactivityTimer();

      // 1) Show the message in **every** tab
      setMessages((prev) => [
        ...prev,
        {
          id: key,
          isMe: guest ? isFromGuest : isFromHost,
          type: msg.type || "text",
          time: msg.created_at,
          content: msg.content,
          isAI,
        },
      ]);

      // 2) If **I’m** the guest tab, and **this** message is a **guest**-authored, non-AI text…
      if (
        guest &&
        isFromGuest &&
        !isAI &&
        msg.type === "text" &&
        recipientHasPersonaEnabledRef.current
      ) {
        
        await new Promise((r) => setTimeout(r, 5000)); // wait
        setTyping(true, `demo-${chatId}`);
        await new Promise((r) => setTimeout(r, 7000)); // wait

        // build context and call your API…
        const lastSnap = await get(query(messagesRef, limitToLast(10)));
        const history = Object.values(lastSnap.val() || {})
          .filter((m) => m.type === "text")
          .map((m) => ({ role: m.isAI ? "assistant" : "user", content: m.content }));

        const personaUserId = host || chatId;
        const res = await fetch(`/api/users/persona/test?id=${personaUserId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: msg.content, chatHistory: history }),
        });

        // 402 = host has no subscription, silently skip AI reply
        if (res.status === 402) {
          setTyping(false, `demo-${chatId}`);
          return;
        }

        const { message: aiMessage, images: imagesToShare } = await res.json();

        if (aiMessage) {
          // Remove image sharing tags from the message text
          const cleanText = (typeof aiMessage === "string" ? aiMessage : aiMessage.content)
            .replace(/\[SHARE_IMAGE:\d+\]/g, "")
            .trim();

          // Send the text message
          await push(messagesRef, {
            content: cleanText,
            type: "text",
            author: `demo-${chatId}`,
            created_at: new Date().toISOString(),
            isAI: true,
            status: MSG_SENT,
          });

          // Send image messages if any
          if (imagesToShare && imagesToShare.length > 0) {
            for (const image of imagesToShare) {
              await new Promise((r) => setTimeout(r, 1000)); // Small delay between images
              await push(messagesRef, {
                content: {
                  url: image.url,
                  type: "image",
                },
                type: "media",
                author: `demo-${chatId}`,
                created_at: new Date().toISOString(),
                isAI: true,
                status: MSG_SENT,
              });
            }
          }

          await updateOne("demochats", chatId, {
            lastMessage: cleanText || "Shared an image",
            lastMessageAuthor: `demo-${chatId}`,
            lastMessageTime: new Date(),
            unread: 1,
          });
        }
        setTyping(false, `guest-${chatId}`);
      }

      // 3) finally reset unread
      await updateOne("demochats", chatId, { unread: 0 }).catch(() => {});
    };

    const childAddedListener = onChildAdded(messagesRef, handleNewMessage);
    return () => off(messagesRef, "child_added", childAddedListener);
  }, [chatId]);

  /**
   * Typing indicator (optional)
   */
  useEffect(() => {
    if (!chatId) return;

    const typingRef = ref(database, `demoTyping/${chatId}`);
    const onlineRef = ref(database, "demoOnline");

    const typingListener = onValue(typingRef, (snapshot) => {
      const data = snapshot.val() || {};
      const ids = Object.entries(data)
        .filter(([, v]) => v === true)
        .map(([uid]) => uid);
      setTypingUsers(ids);
    });

    const onlineListener = onValue(onlineRef, (snapshot) => {
      const data = snapshot.val() || {};
      setOnlineUsers(Object.keys(data));
    });

    return () => {
      off(typingRef, "value", typingListener);
      off(onlineRef, "value", onlineListener);
    };
  }, [chatId]);

  /**
   * sendMessage() → writes to `demoMessages/{chatId}`
   */
  const sendMessage = useCallback(
    async (text, type = "text") => {
      if (chatEndedRef.current) {
        
        return;
      }
      if (!chatId) {
        console.error("Demo Chat ID not set!");
        return;
      }
      
      const messagesRef = ref(database, `demoMessages/${chatId}/`);
      try {
        let author;
        if (guest) {
          author = `guest-${chatId}`;
        } else {
          author = `demo-${chatId}`;
        }
        const newMsgRef = await push(messagesRef, {
          content: text,
          type,
          author: author,
          created_at: new Date().toISOString(),
          isAI: false,
          status: MSG_SENT,
        });
        

        let lastMessageAuthor;
        if (guest) {
          lastMessageAuthor = `demo-${chatId}`;
        } else {
          lastMessageAuthor = `guest-${chatId}`;
        }

        await updateOne("demochats", chatId, {
          lastMessage: type === "text" ? text : `Sent a ${type}`,
          lastMessageAuthor: lastMessageAuthor,
          lastMessageTime: new Date(),
          unread: 1,
        });

        // Reset inactivity timer after sending
        resetInactivityTimer();
      } catch (err) {
        console.error("  → Error pushing demo message:", err);
      }
    },
    [chatId, resetInactivityTimer]
  );

  /**
   * setTyping() writes under `demoTyping/{chatId}/{guestId}`
   */
  const setTyping = useCallback(
    (isTyping, guestId) => {
      if (!chatId || !guestId) return;
      
      const typingRef = ref(database, `demoTyping/${chatId}/${guestId}`);
      rtdbSet(typingRef, isTyping);
      if (isTyping) {
        setTimeout(() => {
          rtdbSet(typingRef, false);
        }, 10000);
      }
    },
    [chatId]
  );

  /**
   * The demo bot always responds — enablePersona is a flag for regular
   * peer-to-peer chats only, not for instant demo chats.
   */
  useEffect(() => {
    setRecipientHasPersonaEnabled(true);
  }, [chatId]);

  /**
   * Build payload synchronously from currently held refs for use in unload handlers.
   * Returns null if there is nothing worth saving.
   */
  const buildTranscriptPayload = useCallback(() => {
    if (wasAlreadyEndedRef.current) return null;
    if (!chatId) return null;

    const currentMessages = messagesRef.current;
    // Don't save if there are no messages yet — chat hasn't actually started
    if (!currentMessages || currentMessages.length === 0) return null;

    const demoUser = demoUserRef.current;

    let baseUrl = "";
    if (typeof window !== "undefined" && window.location?.origin) {
      baseUrl = window.location.origin;
    } else if (process.env.NEXT_PUBLIC_SITE_URL) {
      baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    }
    const normalizedBaseUrl = baseUrl?.replace(/\/$/, "");
    let instantChatLink = null;
    if (demoUser?.creatorId) {
      const relativeLink = `/instantChat/${demoUser.creatorId}/${chatId}`;
      instantChatLink =
        normalizedBaseUrl && normalizedBaseUrl !== ""
          ? `${normalizedBaseUrl}${relativeLink}`
          : relativeLink;
    }

    const metadata = {
      createdAt: new Date(),
      endedAt: new Date(),
      hostId: demoUser?.creatorId || null,
      guestId: chatId,
      host: `demo-${chatId}`,
      guest: `guest-${chatId}`,
      instantChatLink,
    };

    return {
      chatId,
      chatType: "instant",
      messages: currentMessages,
      metadata,
    };
  }, [chatId]);

  /**
   * Attempt to save transcript using fetch with keepalive:true.
   * keepalive requests are honoured by the browser even after the page is torn down.
   * Note: We don't use sendBeacon fallback here as it doesn't handle large JSON payloads properly.
   */
  const saveTranscriptKeepalive = useCallback(() => {
    if (wasAlreadyEndedRef.current) {
      
      return;
    }
    const payload = buildTranscriptPayload();
    if (!payload) {
      
      return;
    }

    
    fetch("/api/transcripts/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true, // ← survives page close / navigation
    }).catch((err) =>
      console.error("[saveTranscriptKeepalive] keepalive fetch failed:", err)
    );
  }, [buildTranscriptPayload]);

  /**
   * Send SMS notification using keepalive fetch.
   * This is called when the chat ends (either via normal flow or page close).
   * Only sends if the chat has actually started (has messages).
   */
  const sendSmsKeepalive = useCallback(() => {
    // Don't send SMS if chat hasn't started yet or was already ended
    if (wasAlreadyEndedRef.current || !chatId) {
      
      return;
    }
    if (!messagesRef.current || messagesRef.current.length === 0) {
      
      return;
    }

    
    try {
      fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
        keepalive: true, // ← survives page close / navigation
      }).catch((err) =>
        console.error("keepalive SMS send failed:", err)
      );
    } catch (err) {
      console.error("[sendSmsKeepalive] Exception:", err);
      // sendBeacon fallback for environments that don't support keepalive
      if (navigator?.sendBeacon) {
        
        navigator.sendBeacon(`/api/sms/send?chatId=${encodeURIComponent(chatId)}`);
      }
    }
  }, [chatId]);

  /* Only marks as closed if the chat has actually started (has messages).
   */
  const markChatClosedKeepalive = useCallback(() => {
    // Don't mark as closed if chat hasn't started yet or was already ended
    if (wasAlreadyEndedRef.current || !chatId) return;
    if (!messagesRef.current || messagesRef.current.length === 0) return;

    try {
      fetch("/api/demo/chat-end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
        keepalive: true, // ← survives page close / navigation
      }).catch((err) =>
        console.error("keepalive chat-end failed:", err)
      );
    } catch (err) {
      // sendBeacon fallback for environments that don't support keepalive
      if (navigator?.sendBeacon) {
        navigator.sendBeacon(`/api/demo/chat-end?chatId=${encodeURIComponent(chatId)}`);
      }
    }
  }, [chatId]);

  // Handle route changes (Next.js client-side navigation)
  useEffect(() => {
    // If pathname changed, it means user navigated away
    if (
      previousPathnameRef.current &&
      previousPathnameRef.current !== pathname &&
      !wasAlreadyEndedRef.current // Don't save if already ended
    ) {
      
      saveTranscript();
    }
    previousPathnameRef.current = pathname;
  }, [pathname, saveTranscript]);

  const contextValue = useMemo(
    () => ({
      messages,
      sendMessage,
      typingUsers,
      setTyping,
      onlineUsers,
      recipientId,
      recipientName,
      loading,
      recipientHasPersonaEnabled,
      chatEnded, // exposed for UI to disable input
      host, // expose host for API calls (e.g., persona greeting)
      hostName, // expose host name for display
      hostAvatar, // expose host avatar URL
      aiPersonaName, // expose AI persona name for typing indicator
    }),
    [
      messages,
      sendMessage,
      typingUsers,
      setTyping,
      onlineUsers,
      recipientId,
      recipientName,
      loading,
      recipientHasPersonaEnabled,
      chatEnded,
      host,
      hostName,
      hostAvatar,
      aiPersonaName,
    ]
  );

  return (
    <DemoChatContext.Provider value={contextValue}>
      {children}
    </DemoChatContext.Provider>
  );
};

export const useDemoChat = () => useContext(DemoChatContext);

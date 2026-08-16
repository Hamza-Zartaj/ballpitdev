"use client";

import {
  ref,
  onValue,
  push,
  set,
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
import { database, firestore, auth } from "@/app/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useAuth } from "./AuthProvider";
import { collection, getDocs, where } from "firebase/firestore";
import { getById, updateOne } from "../utils/firebase/firestore";
import { usePathname } from "next/navigation";
import { ref as rtdbRef, set as rtdbSet } from "firebase/database";
import fetchAllMessages from "../utils/fetchAllMessages";

const ChatContext = createContext();

export const MSG_SENT = 0;
export const MSG_READ = 1;

export const ChatProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [chatId, setChatId] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [loading, setLoading] = useState(false);
  const processedKeys = useRef(new Set()); // Track processed message keys
  const [url, setUrl] = useState("");
  const [blur, setBlur] = useState(false);
  const [recipientHasPersonaEnabled, setRecipientHasPersonaEnabled] =
    useState(false);

  const recipientIdRef = useRef();
  useEffect(() => {
    recipientIdRef.current = recipientId;
  }, [recipientId]);

  const transcriptSavedRef = useRef(false); // Track if transcript has been saved
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    const handleFocus = () => {
      
      setBlur(false);
    };

    const handleBlur = () => {
      
      setBlur(true);
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  const writeTyping = useCallback(
    (whoId, isTyping) => {
      if (!chatId) return;
      const typingRef = rtdbRef(database, `typing/${chatId}/${whoId}`);
      rtdbSet(typingRef, isTyping);
    },
    [chatId]
  );

  /**
   * Fetch Initial Messages & Listen for New Messages
   */

  useEffect(() => {
    if (!user || !chatId) return;

    
    const messagesRef = ref(database, `messages/${chatId}`);

    const fetchInitialMessages = async () => {
      
      setLoading(true);
      const snapshot = await get(query(messagesRef, limitToLast(30)));
      const data = snapshot.val() || {};
      
      const messageList = Object.entries(data).map(([key, value]) => {
        processedKeys.current.add(key); // Mark as processed
        return {
          id: key,
          isMe: value.author === user.uid,
          type: value.type || "text",
          time: value.created_at,
          content: value.content,
          isAI: value.isAI || false,
        };
      });
      setMessages(messageList);
      setLoading(false);

      const chatMetaData = await getById("chats", chatId);
      
      if (
        chatMetaData.unread > 0 &&
        chatMetaData.lastMessageAuthor !== user.uid
      ) {
        
        await updateOne("chats", chatId, {
          unread: 0,
        });
      }
    };

    fetchInitialMessages();

    const fetchChatData = async () => {
      let avatar = "";
      try {
        setLoading(true);
        
        const response = await fetch(`/api/chat?id=${chatId}`);
        const data = await response.json();
        
        const usersRef = collection(firestore, "users");
        const recipientId = data?.users?.filter((item) => item !== user.uid)[0];
        
        const q = query(usersRef, where("uid", "==", recipientId));
        const querySnapshot = await getDocs(q);
        querySnapshot.docs.map((doc) => {
          const data = doc.data();
          
          setRecipientId(data.uid);
          setRecipientName(data.name);
          setUrl(data.uid);
        });
      } catch (e) {
        console.error("Error fetching chat data:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
    // Listen for new messages
    const handleNewMessage = async (snapshot) => {
      if (processedKeys.current.has(snapshot.key)) return; // Ignore already processed messages
      

      processedKeys.current.add(snapshot.key); // Mark as processed
      const data = snapshot.val();
      

      if (blur && data.author !== user.uid) {
        
        if (Notification.permission === "granted") {
          switch (data.type) {
            case "text":
              new Notification("New Message", {
                body: data.content,
              });
              break;
            case "media":
              if (data.content.type === "image") {
                new Notification("New Image", {
                  body: "Received a New Image",
                });
              } else {
                new Notification("New Video", {
                  body: "Received a New Video",
                });
              }
              break;
            default:
              break;
          }
        } else if (Notification.permission !== "denied") {
          
          Notification.requestPermission();
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: snapshot.key,
          isMe: data.author === user.uid,
          type: data.type || "text",
          time: data.created_at,
          content: data.content,
          isAI: data.isAI || false,
        },
      ]);

      // Check: if message is not from me AND it's a text message

      if (
        data.author !== user.uid &&
        data.type === "text" &&
        recipientHasPersonaEnabled
      ) {
        

        
        writeTyping(recipientId, true);

        try {
          // Load recent chat history
          const chatHistorySnapshot = await get(
            query(messagesRef, limitToLast(10))
          );
          const chatHistoryData = chatHistorySnapshot.val() || {};

          const chatHistory = Object.values(chatHistoryData)
            .filter((msg) => msg.type === "text")
            .map((msg) => ({
              role: msg.author === user.uid ? "user" : "assistant",
              content: msg.content,
            }));

          // Add current message
          chatHistory.push({ role: "user", content: data.content });

          // 🧠 Call your Go-based AI API
          
          const response = await fetch(
            `/api/users/persona/test?id=${recipientId}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: data.content,
                chatHistory,
                recipientId,
              }),
            }
          );

          
          const aiData = await response.json();
          

          if (aiData && aiData.message) {
            // Log for debugging
            

            // Extract content correctly based on message structure
            let messageContent;
            if (typeof aiData.message === "string") {
              messageContent = aiData.message;
            } else if (aiData.message.content) {
              messageContent = aiData.message.content;
            } else {
              console.error("Unexpected message format:", aiData.message);
              return; // Don't process invalid message formats
            }

            

            // delay before sending
            const BOT_DELAY_MS = 5000; // 2 seconds
            setTimeout(async () => {
              await push(messagesRef, {
                content: messageContent,
                type: "text",
                author: recipientId,
                created_at: new Date().toISOString(),
                isAI: true,
                status: MSG_SENT,
              });
              // update Firestore lastMessage…
              await updateOne("chats", chatId, {
                lastMessage: messageContent,
                lastMessageAuthor: recipientId,
                lastMessageTime: new Date(),
                unread: 1,
              });
              
              writeTyping(recipientId, false);

              writeTyping(recipientId, false);
            }, BOT_DELAY_MS);

            
          } else {
            // AI unavailable (e.g. no subscription on recipient's account)
            writeTyping(recipientIdRef.current, false);
          }
        } catch (error) {
          console.error("❌ Error sending AI response:", error);
          writeTyping(recipientIdRef.current, false);
        }
      }

      
      const botId = recipientIdRef.current;
      if (!botId) return;
      

      // Always enable typing indicator (single user type)
      writeTyping(botId, true);
      if (data.author !== user.uid) {
        await updateOne("chats", chatId, {
          unread: 0,
        });
      }
    };

    const childAddedListener = onChildAdded(messagesRef, handleNewMessage);

    return () => {
      off(messagesRef, "child_added", childAddedListener);
    };
  }, [user, chatId, recipientHasPersonaEnabled, recipientId]);

  /**
   * Manage Typing Status
   */
  useEffect(() => {
    if (status !== "authenticated") return;

    // Wait for Firebase client auth before writing online status to RTDB.
    // next-auth session may be ready before Firebase client auth is restored,
    // which would cause a permission_denied error.
    const unsubFirebaseAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userStatusRef = ref(database, `online/${session.user.id}`);
        set(userStatusRef, true);
        onDisconnect(userStatusRef).set(false);
      }
    });

    if (!user || !chatId) {
      return () => unsubFirebaseAuth();
    }

    const typingRef = ref(database, `typing/${chatId}`);
    const onlineRef = ref(database, "online");

    // Listen for typing indicators
    const typingListener = onValue(typingRef, (snapshot) => {
      const data = snapshot.val() || {};
      

      // Filter out any null/undefined values and ensure we only get user IDs
      const typingUserIds = Object.entries(data)
        .filter(([_, value]) => value === true)
        .map(([userId]) => userId);
      

      setTypingUsers(typingUserIds);
    });

    const onlineListener = onValue(onlineRef, (snapshot) => {
      const data = snapshot.val() || {};
      setOnlineUsers(Object.keys(data));
    });

    return () => {
      unsubFirebaseAuth();
      off(typingRef, "value", typingListener);
      off(onlineRef, "value", onlineListener);
    };
  }, [user, chatId, status]);

  /**
   * Memoized sendMessage Function
   */
  const sendMessage = useCallback(
    async (text, type) => {
      if (!user) return;

      let chatid = chatId || localStorage.getItem("chatId"); // ✅ Get chatId from localStorage if needed

      if (!chatid) {
        console.error("Error: chatId is not set!");
        return;
      }

      
      const messagesRef = ref(database, `messages/${chatid}/`);

      try {
        const newMessageRef = await push(messagesRef, {
          content: text,
          type: type || "text",
          author: user.uid,
          created_at: new Date().toISOString(),
          updated_at: null,
          is_edited: false,
          status: MSG_SENT,
        });

        

        // ✅ Ensure chatId exists before updating chat document
        try {
          
          await updateOne("chats", chatid, {
            lastMessage: type === "text" ? text : `Sent a ${type}`,
            lastMessageAuthor: user.uid,
            lastMessageTime: new Date(),
            unread: 1,
          });

          // Check if recipient is offline and has persona enabled
          const isRecipientOnline = onlineUsers.includes(recipientId);
          if (recipientHasPersonaEnabled && type === "text") {
            
            try {
              // Create chat history array for context
              const chatHistorySnapshot = await get(
                query(messagesRef, limitToLast(10))
              );
              const chatHistoryData = chatHistorySnapshot.val() || {};

              const chatHistory = Object.values(chatHistoryData)
                .filter((msg) => msg.type === "text")
                .map((msg) => ({
                  role: msg.author === user.uid ? "user" : "assistant",
                  content: msg.content,
                }));

              // Add the current message
              chatHistory.push({
                role: "user",
                content: text,
              });

              // Call the AI endpoint to get a response
              
              const response = await fetch(
                `/api/users/persona/test?id=${recipientId}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    message: text,
                    chatHistory: chatHistory,
                  }),
                }
              );

              const data = await response.json();

              // Send the AI response
              if (data && data.message) {
                // Log for debugging
                

                // Extract content correctly based on message structure
                let messageContent;
                if (typeof data.message === "string") {
                  messageContent = data.message;
                } else if (data.message.content) {
                  messageContent = data.message.content;
                } else {
                  console.error("Unexpected message format:", data.message);
                  return; // Don't process invalid message formats
                }

                const BOT_DELAY_MS = 5000;
                
                setTimeout(async () => {
                  
                  await push(messagesRef, {
                    content: messageContent,
                    type: "text",
                    author: recipientId,
                    created_at: new Date().toISOString(),
                    updated_at: null,
                    is_edited: false,
                    status: MSG_SENT,
                    isAI: true,
                  });
                  await updateOne("chats", chatid, {
                    lastMessage: messageContent,
                    lastMessageAuthor: recipientId,
                    lastMessageTime: new Date(),
                    unread: 1,
                  });
                  // clear the bot typing flag
                  
                  writeTyping(recipientIdRef.current, false);
                }, BOT_DELAY_MS);

                

                
              }
            } catch (error) {
              console.error("Error generating AI response:", error);
            }
          }
        } catch (error) {
          console.error("Error updating chat document:", error);
        }

        return newMessageRef.key;
      } catch (error) {
        console.error("Error sending message:", error);
        throw error;
      }
    },
    [
      chatId,
      user,
      recipientId,
      onlineUsers,
      recipientHasPersonaEnabled,
      writeTyping,
    ]
  );

  /**
   * Typing Indicator Function
   */
  const setTyping = useCallback(
    (isTyping) => {
      if (!user || !chatId) return;

      
      try {
        const typingRef = ref(database, `typing/${chatId}/${user.uid}`);
        set(typingRef, isTyping);

        // Auto-reset typing status after 10 seconds
        if (isTyping) {
          setTimeout(() => {
            const typingRef = ref(database, `typing/${chatId}/${user.uid}`);
            set(typingRef, false);
          }, 10000);
        }
      } catch (error) {
        console.error("Error setting typing status:", error);
      }
    },
    [chatId, user]
  );

  // Fetch recipient persona settings
  useEffect(() => {
    const fetchRecipientPersonaSettings = async () => {
      if (!recipientId) return;

      try {
        
        const response = await fetch(`/api/users/persona?id=${recipientId}`);
        const data = await response.json();

        

        setRecipientHasPersonaEnabled(data.enablePersona === true);
      } catch (error) {
        console.error("Error fetching recipient persona settings:", error);
        setRecipientHasPersonaEnabled(false);
      }
    };

    fetchRecipientPersonaSettings();
  }, [recipientId]);

  /**
   * Save transcript when chat ends
   * - Fetches all messages from messages/{chatId}
   * - Gets chat metadata from chats collection
   * - Calls API to save transcript
   * - Handles errors gracefully
   */
  const saveTranscript = useCallback(async () => {
    // Allow saves on every navigation - transcriptController will handle updates
    if (!chatId || !user) {
      return;
    }

    try {
      

      // Fetch all messages from messages/{chatId}
      const allMessages = await fetchAllMessages(chatId, "regular");

      // Don't save if no messages
      if (!allMessages || allMessages.length === 0) {
        
        return;
      }

      // Get chat metadata from chats collection
      const chatMetadata = await getById("chats", chatId).catch(() => null);

      // Prepare metadata for transcript
      const metadata = {
        createdAt:
          chatMetadata?.createdAt || chatMetadata?.created_at || new Date(),
        endedAt: new Date(),
        hostId:
          chatMetadata?.users?.find((uid) => uid !== user.uid) ||
          recipientId ||
          null,
        guestId: user.uid,
        host:
          chatMetadata?.users?.find((uid) => uid !== user.uid) ||
          recipientId ||
          null,
        guest: user.uid,
      };

      // Call API to save transcript
      const response = await fetch("/api/transcripts/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: chatId,
          chatType: "regular",
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
  }, [chatId, user, recipientId]);

  /**
   * Chat End Detection - Save transcript when chat ends
   * - Component unmount (cleanup function)
   * - Browser close (beforeunload and visibilitychange events)
   */
  useEffect(() => {
    if (!chatId || !user) return;

    // Handle page visibility change (more reliable than beforeunload)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        // Page is being hidden (user switching tabs, closing tab, etc.)
        saveTranscript();
      }
    };

    // Handle browser close/tab close (less reliable for async, but we try)
    const handleBeforeUnload = () => {
      // Try to save (beforeunload doesn't support async well, but we try)
      // The actual save will happen in cleanup or visibilitychange
      saveTranscript();
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup function runs on component unmount
    return () => {
      // Remove event listeners
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Save transcript on unmount (most reliable)
      saveTranscript();
    };
  }, [chatId, user, saveTranscript]);

  // Handle route changes (Next.js client-side navigation)
  useEffect(() => {
    // If pathname changed, it means user navigated away
    if (
      previousPathnameRef.current &&
      previousPathnameRef.current !== pathname
    ) {
      
      saveTranscript();
    }
    previousPathnameRef.current = pathname;
  }, [pathname, saveTranscript]);

  /**
   * Memoized Context Value
   */
  const contextValue = useMemo(
    () => ({
      messages,
      sendMessage,
      typingUsers,
      setTyping,
      writeTyping,
      onlineUsers,
      setChatId,
      recipientId,
      recipientName,
      setRecipientName,
      setUrl,
      loading,
      url,
      recipientHasPersonaEnabled,
    }),
    [
      messages,
      sendMessage,
      typingUsers,
      setTyping,
      onlineUsers,
      recipientId,
      recipientName,
      url,
      recipientHasPersonaEnabled,
    ]
  );

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);

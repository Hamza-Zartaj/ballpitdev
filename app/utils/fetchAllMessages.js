// app/utils/fetchAllMessages.js

import { database } from "@/app/config/firebase";
import { ref, get } from "firebase/database";

/**
 * fetchAllMessages: Fetches ALL messages from Firebase Realtime Database
 *   - Handles both regular chats (messages/{chatId}) and instant chats (demoMessages/{chatId})
 *   - Returns array of all messages sorted by timestamp
 *   - Returns empty array if no messages found
 *
 * @param {string} chatId - The chat ID
 * @param {string} chatType - Either "instant" or "regular"
 * @returns {Promise<Array>} Array of all messages sorted by created_at timestamp
 */
export const fetchAllMessages = async (chatId, chatType) => {
  try {
    if (!chatId) {
      throw new Error("chatId is required");
    }

    if (!chatType || !["instant", "regular"].includes(chatType)) {
      throw new Error('chatType must be "instant" or "regular"');
    }

    // Determine the correct path based on chat type
    const messagesPath =
      chatType === "instant" ? `demoMessages/${chatId}` : `messages/${chatId}`;

    const messagesRef = ref(database, messagesPath);

    // Fetch all messages (no limit - get entire snapshot)
    const snapshot = await get(messagesRef);

    if (!snapshot.exists()) {
      
      return [];
    }

    // Convert snapshot to array of messages
    const messages = [];
    snapshot.forEach((childSnapshot) => {
      const messageData = childSnapshot.val();
      messages.push({
        id: childSnapshot.key,
        key: childSnapshot.key, // Include both id and key for compatibility
        author: messageData.author || null,
        content: messageData.content || null,
        type: messageData.type || "text",
        created_at: messageData.created_at || messageData.timestamp || null,
        timestamp: messageData.timestamp || messageData.created_at || null, // Include both for compatibility
        isAI: messageData.isAI || false,
        status: messageData.status !== undefined ? messageData.status : 0,
        updated_at: messageData.updated_at || null,
        is_edited: messageData.is_edited || false,
      });
    });

    // Sort by created_at timestamp (ascending order - oldest first)
    // If created_at is a string, convert to Date for comparison
    messages.sort((a, b) => {
      const timeA = a.created_at
        ? new Date(a.created_at).getTime()
        : a.timestamp || 0;
      const timeB = b.created_at
        ? new Date(b.created_at).getTime()
        : b.timestamp || 0;
      return timeA - timeB;
    });

    

    return messages;
  } catch (error) {
    console.error(
      `Error fetching all messages for chatId ${chatId}, chatType ${chatType}:`,
      error
    );
    throw new Error(`Error fetching all messages: ${error.message}`);
  }
};

export default fetchAllMessages;

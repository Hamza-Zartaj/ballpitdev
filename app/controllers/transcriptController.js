import db from "../models/db";
import { sendToGoogleSheets } from "../services/spreadsheetService";
import enrichTranscriptWithContacts from "../utils/contactEnrichment";

const transcriptController = {
  /**
   * saveTranscript: Saves a complete chat transcript to Firestore
   *   - Upserts transcript in "chatTranscripts" collection
   *   - Fires off Google Sheets sync in background
   *   - Returns the document ID
   */
  saveTranscript: async (chatId, chatType, messages, metadata) => {
    try {
      if (!chatId) throw new Error("chatId is required");
      if (!chatType || !["instant", "regular"].includes(chatType))
        throw new Error("chatType must be 'instant' or 'regular'");
      if (!Array.isArray(messages)) throw new Error("messages must be an array");
      if (!metadata || typeof metadata !== "object")
        throw new Error("metadata is required and must be an object");

      const instantChatLink =
        chatType === "instant"
          ? metadata.instantChatLink || metadata.instant_chat_link || null
          : null;

      const transcriptData = {
        chatId,
        chatType,
        messages: messages.map((msg) => {
          // Normalize content: convert objects to strings
          let content = msg.content || null;
          if (typeof content === "object" && content !== null) {
            // For media messages with {url, type}, store the URL
            if (content.url) {
              content = content.url;
            } else {
              // Fallback: stringify the object
              content = JSON.stringify(content);
            }
          }
          
          return {
            id: msg.id || msg.key || null,
            author: msg.author || null,
            content: content,
            type: msg.type || "text",
            created_at: msg.created_at || msg.timestamp || new Date().toISOString(),
            isAI: msg.isAI || false,
            status: msg.status !== undefined ? msg.status : 0,
          };
        }),
        participants: {
          guest: metadata.guestId || metadata.guest || null,
          host: metadata.hostId || null,  // Only use actual hostId, not display name
        },
        metadata: {
          createdAt: metadata.createdAt || metadata.created_at || new Date(),
          endedAt: metadata.endedAt || metadata.ended_at || new Date(),
          messageCount: messages.length,
          hostId: metadata.hostId || null,  // Only use actual hostId, not display name
          hostName: metadata.hostName || null,
          hostEmail: metadata.hostEmail || null,
          guestId: metadata.guestId || metadata.guest || null,
          instantChatLink,
        },
        instantChatLink,
      };

      

      // db.transcripts.save handles upsert logic (find by chatId, overwrite or create)
      const docId = await db.transcripts.save(transcriptData);

      // Send to Google Sheets (fire-and-forget, don't block transcript save)
      
      setImmediate(async () => {
        try {
          
          const enrichedData = await enrichTranscriptWithContacts(transcriptData);
          
          await sendToGoogleSheets(enrichedData);
          
        } catch (error) {
          console.error(
            `[transcriptController] ❌ Error sending to Google Sheets for chatId ${chatId.slice(-8)}:`,
            error
          );
        }
      });

      return docId;
    } catch (error) {
      console.error(`Error saving transcript for chatId ${chatId}:`, error);
      throw new Error(`Error saving transcript: ${error.message}`);
    }
  },

  getTranscript: async (chatId) => {
    try {
      return await db.transcripts.getByChatId(chatId);
    } catch (error) {
      console.error(`Error getting transcript for chatId ${chatId}:`, error);
      throw new Error(`Error getting transcript: ${error.message}`);
    }
  },

  checkTranscriptExists: async (chatId) => {
    try {
      return await db.transcripts.exists(chatId);
    } catch (error) {
      console.error(
        `Error checking transcript existence for chatId ${chatId}:`,
        error
      );
      return false;
    }
  },
};

export default transcriptController;
// controllers/demoChatController.js
// LEGACY: This now delegates to demochats (merged collection)

import db from "../models/db";

const demoChatController = {
  createChat: async (chatData) => {
    try {
      // Now creates in merged demochats collection
      // If no chatId specified, Firestore will generate one
      return await db.demochats.create(chatData);
    } catch (error) {
      throw new Error(`Error creating demo chat: ${error.message}`);
    }
  },

  getChat: async (chatId) => {
    try {
      return await db.demochats.get(chatId);
    } catch (e) {
      console.error(e);
      throw new Error("Cannot get demo chat data.");
    }
  },

  updateLastMessage: async (chatId, message, author = "") => {
    try {
      await db.demochats.updateLastMessage(chatId, message, author);
    } catch (error) {
      throw new Error(`Error updating last demo message: ${error.message}`);
    }
  },

  resetUnreadCount: async (chatId) => {
    try {
      await db.demochats.resetUnread(chatId);
    } catch (error) {
      throw new Error(`Error resetting demo unread count: ${error.message}`);
    }
  },
};

export default demoChatController;

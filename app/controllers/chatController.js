import db from "../models/db";

const chatController = {
  createchat: async (chatData) => {
    try {
      return await db.chats.create(chatData.creator, chatData.receiver);
    } catch (error) {
      throw new Error(`Error creating chat: ${error.message}`);
    }
  },

  getChat: async (chatId) => {
    try {
      return await db.chats.get(chatId);
    } catch (e) {
      console.error(e);
      throw new Error("Cannot get chat data.");
    }
  },

  updateLastMessage: async (chatId, message, user) => {
    try {
      await db.chats.updateLastMessage(chatId, message, user.uid);
    } catch (error) {
      throw new Error(`Error updating last message: ${error.message}`);
    }
  },

  resetUnreadCount: async (chatId) => {
    try {
      await db.chats.resetUnread(chatId);
    } catch (error) {
      throw new Error(`Error resetting unread count: ${error.message}`);
    }
  },
};

export default chatController;

// app/controllers/demoUserController.js
// LEGACY: This now delegates to demochats (merged collection)

import db from "../models/db";

const demoUserController = {
  createDemoUser: async (userData, providedId) => {
    try {
      // Now creates in merged demochats collection
      return await db.demochats.create(userData, providedId);
    } catch (error) {
      throw new Error(`Error creating demo user: ${error.message}`);
    }
  },

  getDemoUser: async (userId) => {
    try {
      const user = await db.demochats.get(userId);
      if (!user) throw new Error("Demo user not found");
      return user;
    } catch (error) {
      throw new Error(`Error retrieving demo user: ${error.message}`);
    }
  },

  getAllDemoUsers: async () => {
    try {
      return await db.demochats.getAll();
    } catch (error) {
      throw new Error(`Error retrieving all demo users: ${error.message}`);
    }
  },

  updateDemoUser: async (userId, updateData) => {
    try {
      return await db.demochats.update(userId, updateData);
    } catch (error) {
      throw new Error(`Error updating demo user: ${error.message}`);
    }
  },

  deleteDemoUser: async (userId) => {
    try {
      await db.demochats.delete(userId);
      return { message: "Demo user deleted successfully" };
    } catch (error) {
      throw new Error(`Error deleting demo user: ${error.message}`);
    }
  },
};

export default demoUserController;
import { firestore } from "../config/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import db from "../models/db";
import { adminAuth, adminDb } from "../config/firebase-admin";

const userController = {
  // Create a new user
  createUser: async (userData, userId) => {
    try {
      return await db.users.create(userData, userId);
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  },

  // Get a user by UID
  getUser: async (userId) => {
    try {
      // Check if this is a guest user (guest-XXXXX)
      if (userId && userId.startsWith("guest-")) {
        // Fetch guest data from demochats collection
        const guestSnap = await getDocs(
          query(
            collection(firestore, "demochats"),
            where("uid", "==", userId)
          )
        );

        if (guestSnap.empty) {
          throw new Error("Guest user not found");
        }

        const guestData = guestSnap.docs[0].data();
        const response = {
          ...guestData,
          id: guestSnap.docs[0].id,
          isGuest: true,
        };

        // If guest has a creatorId, fetch host information
        if (guestData.creatorId) {
          try {
            const hostData = await db.users.getByUid(guestData.creatorId);
            if (hostData) {
              response.host = hostData;
            }
          } catch (error) {
            console.warn(`Could not fetch host data for guest ${userId}:`, error.message);
          }
        }

        return response;
      }

      // Regular user lookup
      const userData = await db.users.getByUid(userId);
      if (!userData) throw new Error("User not found");

      return { ...userData };
    } catch (error) {
      throw new Error(`Error retrieving user: ${error.message}`);
    }
  },

  // Get all users
  getAllUsers: async () => {
    try {
      return await db.users.getAll();
    } catch (error) {
      throw new Error(`Error retrieving users: ${error.message}`);
    }
  },

  // Update a user
  updateUser: async (userId, updateData) => {
    try {
      return await db.users.update(userId, updateData);
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  },

  // Delete a user - comprehensive deletion with auth and all related data
  deleteUser: async (userId) => {
    try {
      const user = await db.users.getByUid(userId);
      if (!user) throw new Error("User not found");

      const user_id_db = user.id;

      // ─────────────────────────────────────────────────────────────────────
      // Step 0: Cancel Stripe subscription if exists
      // ─────────────────────────────────────────────────────────────────────
      if (user.subscriptionId) {
        try {
          const { stripe } = await import("@/app/lib/stripe");
          await stripe.subscriptions.cancel(user.subscriptionId);
          
        } catch (stripeErr) {
          // Subscription may already be canceled — continue deletion
          console.warn(`[DELETE] Stripe cancel warning: ${stripeErr.message}`);
        }
      }

      // ─────────────────────────────────────────────────────────────────────
      // Step 1: Delete from Firebase Authentication using Admin SDK
      // ─────────────────────────────────────────────────────────────────────
      try {
        await adminAuth.deleteUser(userId);
        
      } catch (authError) {
        // Only log warning if user not found in auth, else throw
        if (authError.code !== "auth/user-not-found") {
          throw authError;
        }
        console.warn(`[DELETE] User not found in Firebase Auth: ${userId}`);
      }

      // ─────────────────────────────────────────────────────────────────────
      // Step 2: Prepare batch for Firestore deletions
      // ─────────────────────────────────────────────────────────────────────
      const batch = adminDb.batch();

      // Delete all demochats (merged: guest profile + chat metadata) created by this user
      // Since demoUsers and demoChats are now merged into "demochats" collection
      const demochatSnapshot = await adminDb
        .collection("demochats")
        .where("creatorId", "==", userId)
        .get();
      
      
      demochatSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete all chatTranscripts created by this user
      const transcriptsSnapshot = await adminDb
        .collection("chatTranscripts")
        .where("userId", "==", userId)
        .get();
      
      
      transcriptsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Also delete by hostId for transcripts (if applicable)
      const transcriptsByHostSnapshot = await adminDb
        .collection("chatTranscripts")
        .where("hostId", "==", userId)
        .get();
      
      
      transcriptsByHostSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Also delete by metadata.hostId for transcripts
      const transcriptsByMetadataHostSnapshot = await adminDb
        .collection("chatTranscripts")
        .where("metadata.hostId", "==", userId)
        .get();
      
      
      transcriptsByMetadataHostSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Also delete by metadata.guestId for transcripts
      const transcriptsByMetadataGuestSnapshot = await adminDb
        .collection("chatTranscripts")
        .where("metadata.guestId", "==", userId)
        .get();
      
      
      transcriptsByMetadataGuestSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete chats where this user is involved (users array contains userId)
      const chatsSnapshot = await adminDb
        .collection("chats")
        .where("users", "array-contains", userId)
        .get();
      
      
      chatsSnapshot.docs.forEach((chat) => {
        batch.delete(chat.ref);
      });

      // ─────────────────────────────────────────────────────────────────────
      // Step 3: Delete the main user document
      // ─────────────────────────────────────────────────────────────────────
      batch.delete(adminDb.collection("users").doc(user_id_db));

      // ─────────────────────────────────────────────────────────────────────
      // Step 4: Commit batch
      // ─────────────────────────────────────────────────────────────────────
      await batch.commit();
      
      return { 
        message: "User and all related documents deleted successfully",
        deletedUserId: userId 
      };
    } catch (error) {
      console.error("Delete user error:", error);
      throw new Error(`Error deleting user: ${error.message}`);
    }
  },
};

export default userController;
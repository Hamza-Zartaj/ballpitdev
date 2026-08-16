/**
 * ============================================================================
 * BallPit — Validated Database Helpers (Sales AI Chatbot)
 * ============================================================================
 *
 * Single write-path per collection. Every function validates data through
 * Zod schemas before touching Firestore / RTDB.
 *
 * Usage:
 *   import db from "@/app/models/db";
 *   const docId = await db.users.create(rawData, uid);
 *   await db.users.update(uid, { smsPhone: "+1234567890" });
 *
 * These helpers are NON-BREAKING — existing controllers still work.
 * Migrate controllers one at a time by swapping inline setDoc calls
 * for these helpers.
 * ============================================================================
 */

import { firestore, database } from "../config/firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  increment,
} from "firebase/firestore";
import { ref, push, set } from "firebase/database";

import {
  COLLECTIONS,
  RTDB_PATHS,
  UserCreateSchema,
  UserUpdateSchema,
  ChatCreateSchema,
  ChatUpdateSchema,
  DemoChatCreateSchema,
  DemoChatUpdateSchema,
  DemoUserCreateSchema,
  DemoUserUpdateSchema,
  NotificationCreateSchema,
  NotificationUpdateSchema,
  ChatTranscriptCreateSchema,
  RealtimeMessageSchema,
  RealtimeDemoMessageSchema,
  DeletedAccountSchema,
} from "./schema";

// ─────────────────────────────────────────────────────────────────────────────
// Internal helper: validate + stamp timestamps
// ─────────────────────────────────────────────────────────────────────────────

function validateAndStamp(schema, data, isUpdate = false) {
  // Parse through Zod — throws ZodError with detailed messages on failure
  const parsed = schema.parse(data);

  // Auto-add timestamps
  const now = new Date();
  if (!isUpdate) {
    parsed.createdAt = parsed.createdAt || now;
  }
  if (isUpdate || parsed.updatedAt !== undefined) {
    parsed.updatedAt = now;
  }

  return parsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Exported DB helpers — one object per collection
// ─────────────────────────────────────────────────────────────────────────────

const db = {

  // ═══════════════════════════════════════════════════════════════════════════
  // USERS
  // ═══════════════════════════════════════════════════════════════════════════
  users: {
    /** Create a new user. Returns Firestore doc ID. */
    create: async (rawData, uid) => {
      const data = validateAndStamp(UserCreateSchema, { ...rawData, uid });
      const docRef = doc(collection(firestore, COLLECTIONS.USERS));
      await setDoc(docRef, data);
      return docRef.id;
    },

    /** Get user by Firebase Auth UID. Returns { id, ...data } or null. */
    getByUid: async (uid) => {
      const q = query(
        collection(firestore, COLLECTIONS.USERS),
        where("uid", "==", uid)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...d.data() };
    },

    /** Get user by Firestore doc ID. */
    getById: async (docId) => {
      const snap = await getDoc(doc(firestore, COLLECTIONS.USERS, docId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() };
    },

    /** Update user by UID. Validates partial data. Returns updated fields. */
    update: async (uid, rawUpdate) => {
      const user = await db.users.getByUid(uid);
      if (!user) throw new Error("User not found");
      
      const data = validateAndStamp(UserUpdateSchema, rawUpdate, true);
      
      await updateDoc(doc(firestore, COLLECTIONS.USERS, user.id), data);
      
      return { id: user.id, ...data };
    },

    /** Get ALL users. Returns array of { id, ...data }. */
    getAll: async () => {
      const snap = await getDocs(collection(firestore, COLLECTIONS.USERS));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHATS
  // ═══════════════════════════════════════════════════════════════════════════
  chats: {
    /** Create a chat between two users. Returns existing chat ID if one exists. */
    create: async (creatorUid, receiverUid) => {
      // Check for existing chat
      const q = query(
        collection(firestore, COLLECTIONS.CHATS),
        where("users", "array-contains", creatorUid)
      );
      const snap = await getDocs(q);
      let existing = null;
      snap.forEach((d) => {
        if (d.data().users.includes(receiverUid)) existing = d.id;
      });
      if (existing) return existing;

      const data = validateAndStamp(ChatCreateSchema, {
        users: [creatorUid, receiverUid],
        unread: 0,
        lastMessage: "",
        lastMessageAuthor: "",
        lastMessageTime: new Date(),
      });
      const docRef = doc(collection(firestore, COLLECTIONS.CHATS));
      await setDoc(docRef, data);
      return docRef.id;
    },

    /** Get chat metadata by doc ID. */
    get: async (chatId) => {
      const snap = await getDoc(doc(firestore, COLLECTIONS.CHATS, chatId));
      return snap.exists() ? snap.data() : null;
    },

    /** Update last message + increment unread. */
    updateLastMessage: async (chatId, message, authorUid) => {
      const chatRef = doc(firestore, COLLECTIONS.CHATS, chatId);
      await setDoc(
        chatRef,
        {
          lastMessage: message,
          lastMessageAuthor: authorUid,
          lastMessageTime: new Date(),
          unread: increment(1),
        },
        { merge: true }
      );
    },

    /** Reset unread counter to 0. */
    resetUnread: async (chatId) => {
      await setDoc(
        doc(firestore, COLLECTIONS.CHATS, chatId),
        { unread: 0 },
        { merge: true }
      );
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DEMO CHATS (merged: guest profile + chat metadata in one doc)
  // ═══════════════════════════════════════════════════════════════════════════
  demochats: {
    /** Create a new demochat. demoId = guest-12345 */
    create: async (rawData, providedId = null) => {
      let docRef;
      let finalId;
      if (providedId) {
        finalId = providedId;
        docRef = doc(firestore, COLLECTIONS.DEMO_CHATS, finalId);
      } else {
        docRef = doc(collection(firestore, COLLECTIONS.DEMO_CHATS));
        finalId = docRef.id;
      }
      const data = validateAndStamp(DemoChatCreateSchema, {
        ...rawData,
        uid: finalId,
      });
      await setDoc(docRef, data);
      return finalId;
    },

    get: async (demoId) => {
      const snap = await getDoc(doc(firestore, COLLECTIONS.DEMO_CHATS, demoId));
      return snap.exists() ? snap.data() : null;
    },

    getAll: async () => {
      const snap = await getDocs(collection(firestore, COLLECTIONS.DEMO_CHATS));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },

    update: async (demoId, rawUpdate) => {
      const data = validateAndStamp(DemoChatUpdateSchema, rawUpdate, true);
      await updateDoc(doc(firestore, COLLECTIONS.DEMO_CHATS, demoId), data);
      return { demoId, ...data };
    },

    updateLastMessage: async (demoId, message, author = "") => {
      await setDoc(
        doc(firestore, COLLECTIONS.DEMO_CHATS, demoId),
        {
          lastMessage: message,
          lastMessageAuthor: author,
          lastMessageTime: new Date(),
          unread: increment(1),
        },
        { merge: true }
      );
    },

    resetUnread: async (demoId) => {
      await setDoc(
        doc(firestore, COLLECTIONS.DEMO_CHATS, demoId),
        { unread: 0 },
        { merge: true }
      );
    },

    delete: async (demoId) => {
      await deleteDoc(doc(firestore, COLLECTIONS.DEMO_CHATS, demoId));
    },
  },

  // Legacy aliases for backwards compatibility (all point to demochats now)
  demoChats: null, // Initialized below
  demoUsers: null, // Initialized below

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  notifications: {
    create: async (rawData) => {
      const data = validateAndStamp(NotificationCreateSchema, rawData);
      const docRef = doc(collection(firestore, COLLECTIONS.NOTIFICATIONS));
      await setDoc(docRef, data);
      return docRef.id;
    },

    getByReceiver: async (userId) => {
      const q = query(
        collection(firestore, COLLECTIONS.NOTIFICATIONS),
        where("receiver", "==", userId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },

    markAllRead: async (userId) => {
      const q = query(
        collection(firestore, COLLECTIONS.NOTIFICATIONS),
        where("receiver", "==", userId)
      );
      const snap = await getDocs(q);
      const promises = snap.docs.map((d) =>
        updateDoc(d.ref, { isRead: true, updatedAt: new Date() })
      );
      await Promise.all(promises);
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHAT TRANSCRIPTS
  // ═══════════════════════════════════════════════════════════════════════════
  transcripts: {
    save: async (rawData) => {
      const data = validateAndStamp(ChatTranscriptCreateSchema, rawData);
      data.savedAt = new Date();

      // Upsert: if transcript exists for chatId, overwrite it
      const q = query(
        collection(firestore, COLLECTIONS.CHAT_TRANSCRIPTS),
        where("chatId", "==", data.chatId)
      );
      const existing = await getDocs(q);
      const docRef = existing.empty
        ? doc(collection(firestore, COLLECTIONS.CHAT_TRANSCRIPTS))
        : doc(firestore, COLLECTIONS.CHAT_TRANSCRIPTS, existing.docs[0].id);

      await setDoc(docRef, data, { merge: false });
      return docRef.id;
    },

    getByChatId: async (chatId) => {
      const q = query(
        collection(firestore, COLLECTIONS.CHAT_TRANSCRIPTS),
        where("chatId", "==", chatId)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    },

    exists: async (chatId) => {
      const q = query(
        collection(firestore, COLLECTIONS.CHAT_TRANSCRIPTS),
        where("chatId", "==", chatId)
      );
      const snap = await getDocs(q);
      return !snap.empty;
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REALTIME DB — Messages
  // ═══════════════════════════════════════════════════════════════════════════
  messages: {
    /** Push a validated message to messages/{chatId}. Returns push key. */
    send: async (chatId, rawMsg) => {
      const msg = RealtimeMessageSchema.parse(rawMsg);
      const msgRef = push(ref(database, `${RTDB_PATHS.MESSAGES}/${chatId}`));
      await set(msgRef, msg);
      return msgRef.key;
    },
  },

  demoMessages: {
    /** Push a validated message to demoMessages/{chatId}. Returns push key. */
    send: async (chatId, rawMsg) => {
      const msg = RealtimeDemoMessageSchema.parse(rawMsg);
      const msgRef = push(
        ref(database, `${RTDB_PATHS.DEMO_MESSAGES}/${chatId}`)
      );
      await set(msgRef, msg);
      return msgRef.key;
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DELETED ACCOUNTS (anti-abuse trial tracking)
  // ═══════════════════════════════════════════════════════════════════════════
  deletedAccounts: {
    /**
     * Archive a user's identity + subscription snapshot before deletion.
     * Email is normalised to lowercase so lookups are reliable.
     * Returns the new Firestore doc ID.
     */
    archive: async (rawData) => {
      const normalised = {
        ...rawData,
        email: rawData.email ? rawData.email.toLowerCase() : null,
        deletedAt: new Date(),
      };
      const data = DeletedAccountSchema.parse(normalised);
      const docRef = doc(collection(firestore, COLLECTIONS.DELETED_ACCOUNTS));
      await setDoc(docRef, data);
      return docRef.id;
    },

    /**
     * Returns true when this email OR phone number has previously used a free
     * trial (i.e., hadTrial === true in a deleted-account record).
     */
    hasUsedTrial: async (email, phoneNumber = null) => {
      if (email) {
        const q = query(
          collection(firestore, COLLECTIONS.DELETED_ACCOUNTS),
          where("email", "==", email.toLowerCase()),
          where("hadTrial", "==", true)
        );
        const snap = await getDocs(q);
        if (!snap.empty) return true;
      }

      if (phoneNumber) {
        const q = query(
          collection(firestore, COLLECTIONS.DELETED_ACCOUNTS),
          where("phoneNumber", "==", phoneNumber),
          where("hadTrial", "==", true)
        );
        const snap = await getDocs(q);
        if (!snap.empty) return true;
      }

      return false;
    },

    /**
     * Returns the first matching deleted-account record for this email or phone,
     * or null if none found.
     */
    find: async (email, phoneNumber = null) => {
      if (email) {
        const q = query(
          collection(firestore, COLLECTIONS.DELETED_ACCOUNTS),
          where("email", "==", email.toLowerCase())
        );
        const snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
      }

      if (phoneNumber) {
        const q = query(
          collection(firestore, COLLECTIONS.DELETED_ACCOUNTS),
          where("phoneNumber", "==", phoneNumber)
        );
        const snap = await getDocs(q);
        if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
      }

      return null;
    },
  },
};

// Legacy aliases for backwards compatibility - both point to the merged demochats
db.demoChats = db.demochats;
db.demoUsers = db.demochats;

export default db;

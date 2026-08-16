/**
 * ============================================================================
 * BallPit — Zod Database Schemas (Sales AI Chatbot)
 * ============================================================================
 *
 * Every Firestore collection and Realtime Database path used in the app.
 * These are REAL Zod schemas — import them to validate data before writes.
 *
 * Database: Firebase (Firestore named instance "ballpitt" + Realtime Database)
 *
 * Usage:
 *   import { UserCreateSchema } from "@/app/models/schema";
 *   const parsed = UserCreateSchema.parse(rawData); // throws on invalid
 *   const safe   = UserCreateSchema.safeParse(rawData); // { success, data?, error? }
 *
 * ============================================================================
 */

import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Shared / reusable pieces
// ─────────────────────────────────────────────────────────────────────────────

/** Coerces Date | Firestore Timestamp | ISO string → Date for validation */
const dateish = z.union([z.date(), z.string().datetime(), z.any()]).optional();

/** AI persona settings — shared by users & demoUsers */
export const PersonaSettingSchema = z.object({
  name:           z.string().optional().default(""),
  personality:    z.enum(["friendly", "professional", "casual", "energetic"]).optional().default("friendly"),
  extraPrompt:    z.string().optional().default(""),
  shareImage:     z.boolean().optional().default(false),
  images:         z.array(z.string().url()).optional().default([]),
}).passthrough();  // allow extra keys so we don't break legacy reads


// ─────────────────────────────────────────────────────────────────────────────
// 1. FIRESTORE — "users" collection
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Collection : users
 * Doc ID     : Auto-generated Firestore ID (NOT the uid field)
 * Queried by : where("uid", "==", userId)
 */

/** Schema for CREATING a new user (writes) */
export const UserCreateSchema = z.object({
  // Identity
  uid:                   z.string().min(1),
  name:                  z.string().min(1),
  email:                 z.string().email().nullable().optional().default(null),

  // Business profile (collected during signup)
  businessUrl:           z.string().optional().default(""),
  qualificationCriteria: z.string().optional().default(""),

  // Verification (email-only)
  emailVerified:         z.boolean().optional().default(false),
  emailVerificationDate: z.any().nullable().optional().default(null),

  // Notifications
  notificationstate:     z.boolean().optional().default(false),

  // AI Persona
  personaSetting:        PersonaSettingSchema.optional().default({}),

  // Stripe Subscription
  subscriptionStatus:    z.enum(["trialing", "active", "canceled", "past_due", "none"]).optional().default("none"),
  stripeCustomerId:      z.string().nullable().optional().default(null),
  subscriptionId:        z.string().nullable().optional().default(null),
  priceId:               z.string().nullable().optional().default(null),
  subscriptionEndDate:   z.any().nullable().optional().default(null),

  // Legacy — kept for backward compat
  hasSubscription:       z.boolean().optional().default(false),

  // Account Status
  isDeleted:             z.boolean().optional().default(false),
  deletedAt:             z.any().nullable().optional().default(null),
}).passthrough();  // allow legacy fields on existing docs without failing

/** Schema for UPDATING a user (partial, no uid required) */
export const UserUpdateSchema = UserCreateSchema
  .omit({ uid: true })
  .partial()
  .extend({ updatedAt: z.any().optional() })
  .passthrough();  // allow setting any legacy field during migration


// ─────────────────────────────────────────────────────────────────────────────
// 2. FIRESTORE — "chats" collection
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Collection : chats
 * Doc ID     : Auto-generated Firestore ID
 * Purpose    : 1-to-1 chat metadata. Messages live at RTDB messages/{chatDocId}.
 */
export const ChatCreateSchema = z.object({
  users:              z.array(z.string().min(1)).length(2),  // exactly 2 UIDs
  unread:             z.number().int().optional().default(0),
  lastMessage:        z.string().optional().default(""),
  lastMessageAuthor:  z.string().optional().default(""),
  lastMessageTime:    z.any().optional(),                     // Date
  createdAt:          z.any().optional(),                     // Date
});

export const ChatUpdateSchema = ChatCreateSchema.partial();


// ─────────────────────────────────────────────────────────────────────────────
// 3. FIRESTORE — "demochats" collection (merged demoUsers + demoChats)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Collection : demochats (singular, lowercase to match RTDB naming)
 * Doc ID     : The demo ID (e.g. "guest-12345")
 * Purpose    : Complete demo/instant chat document with guest profile + metadata.
 *              One guest = one chat. Messages at RTDB demoMessages/{id}.
 *              Merges old demoUsers (profile) + demoChats (metadata).
 */
export const DemoChatCreateSchema = z.object({
  // Guest identity (formerly demoUsers fields)
  uid:                z.string().min(1),                        // e.g. "guest-12345" (doc ID)
  name:               z.string().optional().default("Demo User"),
  avatar:             z.string().url().optional().default("https://example.com/default-avatar.png"),
  
  // Creator info
  creatorId:          z.string().min(1),                        // → users.uid
  personaSetting:     PersonaSettingSchema.optional().default({}),
  
  // Chat metadata (formerly demoChats fields)
  unread:             z.number().int().optional().default(0),
  lastMessage:        z.string().optional().default(""),
  lastMessageAuthor:  z.string().optional().default(""),
  lastMessageTime:    z.any().optional(),
  
  // Timestamps
  createdAt:          z.any().optional(),
  ending:             z.boolean().optional().default(false),   // moved from old field
  endedAt:            z.any().nullable().optional().default(null),
});

export const DemoChatUpdateSchema = DemoChatCreateSchema
  .omit({ uid: true })
  .partial()
  .extend({ updatedAt: z.any().optional() });

// Legacy: these still exist for backwards compat, but should not be used for new code
export const DemoUserCreateSchema = DemoChatCreateSchema;
export const DemoUserUpdateSchema = DemoChatUpdateSchema;


// ─────────────────────────────────────────────────────────────────────────────
// 5. FIRESTORE — "notifications" collection
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Collection : notifications    Doc ID : Auto-generated
 */
export const NotificationCreateSchema = z.object({
  sender:    z.string().optional().default(""),                 // "" = system
  receiver:  z.string().min(1),                                 // → users.uid
  type:      z.boolean().optional().default(false),             // true=user, false=system
  isRead:    z.boolean().optional().default(false),
  message:   z.string().optional().default(""),                 // notification content
  createdAt: z.any().optional(),
});

export const NotificationUpdateSchema = NotificationCreateSchema
  .partial()
  .extend({ updatedAt: z.any().optional() });


// ─────────────────────────────────────────────────────────────────────────────
// 6. FIRESTORE — "chatTranscripts" collection
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Collection : chatTranscripts    Doc ID : Auto-generated
 * Queried by : where("chatId", "==", chatId)
 */
const TranscriptMessageSchema = z.object({
  id:         z.string().nullable().optional().default(null),
  author:     z.string().nullable().optional().default(null),
  content:    z.string().nullable().optional().default(null),
  type:       z.enum(["text", "media"]).optional().default("text"),
  created_at: z.string().optional().default(() => new Date().toISOString()),
  isAI:       z.boolean().optional().default(false),
  status:     z.number().int().optional().default(0),           // 0=Sent, 1=Read
});

export const ChatTranscriptCreateSchema = z.object({
  chatId:     z.string().min(1),
  chatType:   z.enum(["instant", "regular"]),

  messages:   z.array(TranscriptMessageSchema).optional().default([]),

  participants: z.object({
    guest:    z.string().nullable().optional().default(null),
    host:     z.string().nullable().optional().default(null),
  }).optional(),

  metadata: z.object({
    createdAt:        z.any().optional(),
    endedAt:          z.any().optional(),
    messageCount:     z.number().int().optional().default(0),
    hostId:           z.string().nullable().optional().default(null),
    guestId:          z.string().nullable().optional().default(null),
    instantChatLink:  z.string().nullable().optional().default(null),
  }).optional(),

  instantChatLink:    z.string().nullable().optional().default(null),
  savedAt:            z.any().optional(),
});


// ─────────────────────────────────────────────────────────────────────────────
// 7. REALTIME DATABASE — messages/{chatId}/{messageId}
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Path : messages/{chatId}/{auto-push-id}
 */
export const RealtimeMessageSchema = z.object({
  content:    z.string(),
  type:       z.enum(["text", "media"]).optional().default("text"),
  author:     z.string().min(1),                                // → users.uid
  created_at: z.string().optional().default(() => new Date().toISOString()),
  updated_at: z.string().nullable().optional().default(null),
  is_edited:  z.boolean().optional().default(false),
  status:     z.number().int().optional().default(0),           // 0=Sent, 1=Read
  isAI:       z.boolean().optional().default(false),
});


// ─────────────────────────────────────────────────────────────────────────────
// 8. REALTIME DATABASE — demoMessages/{chatId}/{messageId}
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Path : demoMessages/{chatId}/{auto-push-id}
 */
export const RealtimeDemoMessageSchema = z.object({
  content:    z.string(),
  type:       z.enum(["text", "media"]).optional().default("text"),
  author:     z.string().min(1),                                // "guest-{id}" or "demo-{id}"
  created_at: z.string().optional().default(() => new Date().toISOString()),
  isAI:       z.boolean().optional().default(false),
  status:     z.number().int().optional().default(0),
});


// ─────────────────────────────────────────────────────────────────────────────
// 9. REALTIME DATABASE — Presence & Typing (documentation only, no schema)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * typing/{chatId}/{userId}        → boolean
 * demoTyping/{chatId}/{guestId}   → boolean
 * online/{userId}                 → boolean (removed via onDisconnect)
 * demoOnline                      → { [userId]: boolean }
 */


// ─────────────────────────────────────────────────────────────────────────────
// 10. REALTIME DATABASE — Legacy cron message format (DEPRECATED)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * KNOWN INCONSISTENCY: cron writes { text, sender, timestamp }
 * while the main app writes { content, author, created_at }.
 * This schema exists for documentation — new code should use
 * RealtimeMessageSchema instead.
 */
export const LegacyCronMessageSchema = z.object({
  text:       z.string(),
  sender:     z.string().min(1),
  timestamp:  z.any(),                                          // ServerTimestamp
  isAI:       z.boolean().optional().default(true),
});


// ─────────────────────────────────────────────────────────────────────────────
// 11. FIRESTORE — "deletedAccounts" collection
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Collection : deletedAccounts
 * Doc ID     : Auto-generated Firestore ID
 * Purpose    : Immutable audit trail created when a user deletes their account.
 *              Stores enough info to detect free-trial abuse on re-signup.
 * Queried by : where("email", "==", email)
 */
export const DeletedAccountSchema = z.object({
  // Identity (normalised to lowercase for reliable lookups)
  email:              z.string().email().nullable().optional().default(null),
  originalUid:        z.string().min(1),

  deletedAt:          z.any().optional(),
}).passthrough();


// ═════════════════════════════════════════════════════════════════════════════
// COLLECTION NAME CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════
/** Use these instead of raw strings to avoid typos in collection names */
export const COLLECTIONS = Object.freeze({
  USERS:             "users",
  CHATS:             "chats",
  DEMO_CHATS:        "demochats",              // MERGED: now includes guest profile + chat metadata
  DEMO_USERS:        "demochats",              // LEGACY alias (use DEMO_CHATS instead)
  NOTIFICATIONS:     "notifications",
  CHAT_TRANSCRIPTS:  "chatTranscripts",
  DELETED_ACCOUNTS:  "deletedAccounts",
});

/** Realtime Database root paths */
export const RTDB_PATHS = Object.freeze({
  MESSAGES:      "messages",
  DEMO_MESSAGES: "demoMessages",
  TYPING:        "typing",
  DEMO_TYPING:   "demoTyping",
  ONLINE:        "online",
  DEMO_ONLINE:   "demoOnline",
});


// ═════════════════════════════════════════════════════════════════════════════
// CROSS-COLLECTION RELATIONSHIPS (documentation)
// ═════════════════════════════════════════════════════════════════════════════
/**
 *  users.uid ─────────────┬──→ chats.users[]
 *                         ├──→ chats.lastMessageAuthor
 *                         ├──→ notifications.sender / .receiver
 *                         ├──→ demoUsers.creatorId
 *                         ├──→ chatTranscripts.participants.host
 *                         └──→ RTDB: messages/[chatId]/[msg].author
 *
 *  chats (doc ID) ────────→ RTDB messages/{chatId}, chatTranscripts.chatId
 *  demoChats (doc ID) ────→ RTDB demoMessages/{chatId}, chatTranscripts.chatId
 */


// ═════════════════════════════════════════════════════════════════════════════
// NOTES
// ═════════════════════════════════════════════════════════════════════════════
/**
 * 1. Persona flags: personaSetting.enablePersona (primary) vs
 *    personaConfig.enablePersona (legacy cron). Consolidate to personaSetting.
 *
 * 2. Cron messages use { text, sender, timestamp } — see LegacyCronMessageSchema.
 */
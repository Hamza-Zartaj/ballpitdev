// app/services/verificationService.js
// Email-based verification service (migrated from phone-based)

import { database } from "../config/firebase";
import { ref, set, get, update, remove } from "firebase/database";

/**
 * Sanitize email for Firebase Realtime Database paths
 * Firebase paths cannot contain: . # $ [ ]
 * Replace these characters with underscores
 * @param {string} email - User's email address
 * @returns {string} Sanitized email safe for Firebase paths
 */
function sanitizeEmailForFirebase(email) {
  return email.replace(/[.@#$\[\]]/g, "_");
}

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store verification code in Realtime Database
 * Code expires after 10 minutes
 * @param {string} email - User's email address
 * @param {string} code - 6-digit verification code
 */
export async function storeVerificationCode(email, code) {
  if (!email || !code) {
    throw new Error("Email and code are required");
  }

  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now
  
  const sanitizedEmail = sanitizeEmailForFirebase(email);
  const verificationRef = ref(
    database,
    `verificationCodes/${sanitizedEmail}`
  );
  
  await set(verificationRef, {
    code,
    createdAt: Date.now(),
    expiresAt,
  });
}

/**
 * Verify the code entered by user
 * Returns { valid: boolean, error?: string }
 * @param {string} email - User's email address
 * @param {string} enteredCode - Code user entered
 */
export async function verifyCode(email, enteredCode) {
  if (!email || !enteredCode) {
    return { valid: false, error: "Email and code are required" };
  }

  const sanitizedEmail = sanitizeEmailForFirebase(email);
  const verificationRef = ref(
    database,
    `verificationCodes/${sanitizedEmail}`
  );
  
  const snapshot = await get(verificationRef);
  
  if (!snapshot.exists()) {
    return { valid: false, error: "No verification code sent to this email address" };
  }
  
  const data = snapshot.val();
  
  // Check if code has expired
  if (Date.now() > data.expiresAt) {
    await remove(verificationRef);
    return { valid: false, error: "Verification code has expired. Please request a new one." };
  }
  
  // Check if code matches
  if (data.code !== enteredCode) {
    return { valid: false, error: "Incorrect verification code" };
  }
  
  // Code is valid, delete it so it can't be reused
  await remove(verificationRef);
  return { valid: true };
}

/**
 * Clear verification code from database
 * (used for cleanup or retrying)
 * @param {string} email - User's email address
 */
export async function clearVerificationCode(email) {
  if (!email) {
    throw new Error("Email is required");
  }

  const sanitizedEmail = sanitizeEmailForFirebase(email);
  const verificationRef = ref(
    database,
    `verificationCodes/${sanitizedEmail}`
  );
  await remove(verificationRef);
}

import { initializeApp, getApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Initialize app once (singleton)
const getFirebaseApp = () =>
  !getApps().length ? initializeApp(firebaseConfig) : getApp();

// --- Lazy getters ---
// Each service module is only imported when first requested,
// so pages that don't need e.g. Firestore won't pay the download cost.

let _auth = null;
export const getAuthInstance = async () => {
  if (!_auth) {
    const { getAuth } = await import("firebase/auth");
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
};

let _firestore = null;
export const getFirestoreInstance = async () => {
  if (!_firestore) {
    const { getFirestore } = await import("firebase/firestore");
    _firestore = getFirestore(getFirebaseApp(), "ballpitt");
  }
  return _firestore;
};

let _database = null;
export const getDatabaseInstance = async () => {
  if (!_database) {
    const { getDatabase } = await import("firebase/database");
    _database = getDatabase(getFirebaseApp());
  }
  return _database;
};

let _storage = null;
export const getStorageInstance = async () => {
  if (!_storage) {
    const { getStorage } = await import("firebase/storage");
    _storage = getStorage(getFirebaseApp());
  }
  return _storage;
};

// --- Synchronous fallbacks for code that already calls getAuth(app) pattern ---
// These are kept for backward compatibility but you should migrate callers to
// the async getters above over time.
export const getAuthSync = () => {
  const { getAuth } = require("firebase/auth");
  return getAuth(getFirebaseApp());
};

export const getFirestoreSync = () => {
  const { getFirestore } = require("firebase/firestore");
  return getFirestore(getFirebaseApp(), "ballpitt");
};

export const getDatabaseSync = () => {
  const { getDatabase } = require("firebase/database");
  return getDatabase(getFirebaseApp());
};

export const getStorageSync = () => {
  const { getStorage } = require("firebase/storage");
  return getStorage(getFirebaseApp());
};

// Legacy named exports — these still eagerly initialise on import.
// Migrate to the async getters above for best performance.
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const app = getFirebaseApp();
export const auth = getAuth(app);
export const firestore = getFirestore(app, "ballpitt");
export const database = getDatabase(app);
export const storage = getStorage(app);

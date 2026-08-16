/**
 * Firebase Admin SDK - Enabled for backend operations
 * 
 * Used for:
 * - Deleting users from Firebase Authentication
 * - Server-side Firestore operations with full permissions
 * - Cleanup operations on account deletion
 */

import * as admin from "firebase-admin";
import { getFirestore } from 'firebase-admin/firestore';

let adminApp;
if (!admin.apps.length) {
  let serviceAccount;
  
  try {
    if (process.env.FIREBASE_ADMIN_SDK_KEY) {
      serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
    } else {
      serviceAccount = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      };
    }

    // Validate that we have the minimum required fields
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error(
        `Missing required Firebase Admin credentials. Have: projectId=${!!serviceAccount.projectId}, clientEmail=${!!serviceAccount.clientEmail}, privateKey=${!!serviceAccount.privateKey}`
      );
    }

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error("[Firebase Admin] Initialization failed:", error.message);
    throw error;
  }
} else {
  adminApp = admin.app();
}

// Access Firestore with the named database "ballpitt" where data is stored
export const adminDb = getFirestore(adminApp, 'ballpitt');
export const adminAuth = admin.auth();


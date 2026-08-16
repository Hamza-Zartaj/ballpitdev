"use server";

import { firestore } from "@/app/config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const getUserContactInfo = async (userId) => {
  try {
    if (!userId) {
      return { email: null, phoneNumber: null, name: null };
    }

    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("uid", "==", userId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`[getUserContactInfo] ⚠️ No user found for uid: ${userId}`);
      return { email: null, phoneNumber: null, name: null };
    }

    const userData = querySnapshot.docs[0].data();
    
    
    return {
      email: userData.email || null,
      phoneNumber: userData.phoneNumber || null,
      name: userData.name || null,
    };
  } catch (error) {
    console.error(`[getUserContactInfo] ❌ Error getting user contact info for ${userId}:`, error);
    return { email: null, phoneNumber: null, name: null };
  }
};

const enrichTranscriptWithContacts = async (transcriptData = {}) => {
  const metadata = transcriptData.metadata || {};
  const chatType = transcriptData.chatType || metadata.chatType || "regular";
  const isInstantChat = chatType === "instant";

  const hostId = transcriptData.participants?.host || metadata.hostId;
  const guestId = transcriptData.participants?.guest || metadata.guestId;

  let hostEmail = null;
  let hostName = null;
  let guestEmail = null;

  

  if (hostId) {
    const hostContact = await getUserContactInfo(hostId);
    hostEmail = hostContact.email;
    hostName = hostContact.name;
    
  }

  if (!isInstantChat && guestId) {
    const guestContact = await getUserContactInfo(guestId);
    guestEmail = guestContact.email;
    
  }

  const enrichedData = {
    ...transcriptData,
    chatType,
    hostEmail,
    hostName,
    guestEmail,
    metadata: {
      ...metadata,
      chatType,
      hostEmail,
      hostName,
      guestEmail,
    },
  };
  
  

  return enrichedData;
};

export default enrichTranscriptWithContacts;


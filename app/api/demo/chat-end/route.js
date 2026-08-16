// app/api/demo/chat-end/route.js

import db from "@/app/models/db";
import { doc, collection, setDoc } from "firebase/firestore";
import { firestore } from "@/app/config/firebase";

/**
 * POST /api/demo/chat-end
 *
 * Marks a demo chat as ended (called when browser closes or chat is terminated).
 *
 * Body: { chatId: string }
 *
 * Returns: { success: true } or { error: "..." }
 */
export async function POST(req) {
  try {
    let chatId;

    // Try to parse JSON body first
    try {
      const body = await req.json();
      chatId = body?.chatId;
    } catch (jsonErr) {
      // If JSON parsing fails (empty body or text/plain content-type from sendBeacon),
      // try to get chatId from URL parameters
      const url = new URL(req.url);
      chatId = url.searchParams.get("chatId");
    }

    if (!chatId) {
      return new Response(
        JSON.stringify({ error: "chatId is required" }),
        { status: 400 }
      );
    }

    

    // Mark chat as ended in Firestore using setDoc with merge
    const chatRef = doc(collection(firestore, "demochats"), chatId);
    await setDoc(
      chatRef,
      {
        ended: true,
        endedAt: new Date(),
      },
      { merge: true }
    );

    

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/demo/chat-end:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to mark chat as ended",
      }),
      { status: 500 }
    );
  }
}

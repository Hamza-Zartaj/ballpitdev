// app/api/sms/send/route.js

import { sendTranscriptEmail } from "@/app/services/emailService";
import db from "@/app/models/db";
import { doc, collection, setDoc } from "firebase/firestore";
import { firestore } from "@/app/config/firebase";

/**
 * POST /api/sms/send
 *
 * Sends the chat transcript summary via email to the host's email address.
 *
 * Body: { chatId: string }
 *
 * Flow:
 *   1. Look up demoUser → get creatorId (host)
 *   2. Look up host user → get email
 *   3. Fetch transcript from Firestore
 *   4. Format & send via Resend email service
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

    

    // 1. Get demoUser to find the host (creator)
    let hostId;
    try {
      const demoUser = await db.demoUsers.get(chatId);
      hostId = demoUser?.creatorId;
      
    } catch (err) {
      console.error(`Error fetching demoUser for chatId ${chatId}:`, err);
    }

    if (!hostId) {
      console.error(`POST /api/sms/send: Could not determine host for chatId ${chatId}`);
      return new Response(
        JSON.stringify({ error: "Could not determine host for this chat" }),
        { status: 404 }
      );
    }

    // 2. Get host user → check email
    let hostUser;
    try {
      hostUser = await db.users.getByUid(hostId);
      
    } catch (err) {
      console.error(`Error fetching host user ${hostId}:`, err);
    }

    if (!hostUser?.email) {
      
      return new Response(
        JSON.stringify({
          success: false,
          skipped: true,
          reason: "No email address configured for host",
        }),
        { status: 200 }
      );
    }

    // 3. Fetch transcript
    let transcript;
    try {
      transcript = await db.transcripts.getByChatId(chatId);
      
    } catch (err) {
      console.error(`Error fetching transcript for chatId ${chatId}:`, err);
    }

    if (!transcript) {
      console.error(`POST /api/sms/send: Transcript not found for chatId ${chatId}`);
      return new Response(
        JSON.stringify({ error: "Transcript not found for this chat" }),
        { status: 404 }
      );
    }

    // 4. Format transcript for email - map fields to match email template expectations
    const formattedTranscript = {
      ...transcript,
      messageCount: transcript.metadata?.messageCount || transcript.messages?.length || 0,
      // Filter out AI messages and format for email
      messages: (transcript.messages || [])
        .filter((msg) => !msg.isAI) // Remove AI messages
        .map((msg) => ({
          ...msg,
          // Map 'content' field to 'text' for email template
          text: msg.content || msg.text || '',
          // Map 'author' to 'sender' for email template  
          sender: 'guest',
          // Use author as senderName for email template
          senderName: msg.author || 'Visitor',
        })),
    };

    

    // 5. Send via Resend email service
    const result = await sendTranscriptEmail(hostUser.email, formattedTranscript);

    

    // 6. Mark chat as ended now that email has been sent
    try {
      const chatRef = doc(collection(firestore, "demochats"), chatId);
      await setDoc(
        chatRef,
        {
          ended: true,
          endedAt: new Date(),
        },
        { merge: true }
      );
      
    } catch (err) {
      console.error(`Error marking chat as ended after email for chatId ${chatId}:`, err);
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.messageId,
        to: hostUser.email,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/sms/send:", error);

    // Don't fail hard — email is a nice-to-have, not critical
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send transcript email",
      }),
      { status: 500 }
    );
  }
}

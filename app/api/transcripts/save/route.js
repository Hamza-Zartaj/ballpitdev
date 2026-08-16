// app/api/transcripts/save/route.js

import transcriptController from "@/app/controllers/transcriptController";

/**
 * POST /api/transcripts/save
 *   - Body should be JSON: { chatId, chatType, messages, metadata }
 *   - Saves a complete chat transcript to Firestore
 *   - Returns: { success: true, transcriptId: "<doc-id>" } or { error: "<message>" }
 */
export const POST = async (req) => {
  try {
    let body;
    try {
      const text = await req.text();
      
      
      if (!text || text.trim() === '') {
        console.error("Failed to parse JSON in transcript save: Empty body received");
        return new Response(
          JSON.stringify({
            error: "Empty request body",
          }),
          { status: 400 }
        );
      }
      
      try {
        body = JSON.parse(text);
      } catch (parseErr) {
        console.error("Failed to parse JSON in transcript save:", parseErr);
        
        return new Response(
          JSON.stringify({
            error: "Invalid JSON in request body",
          }),
          { status: 400 }
        );
      }
    } catch (readErr) {
      console.error("Failed to read request body:", readErr);
      return new Response(
        JSON.stringify({
          error: "Failed to read request body",
        }),
        { status: 400 }
      );
    }

    const { chatId, chatType, messages, metadata } = body;

    

    // Validate required fields
    if (!chatId) {
      return new Response(JSON.stringify({ error: "chatId is required" }), {
        status: 400,
      });
    }

    if (!chatType) {
      return new Response(JSON.stringify({ error: "chatType is required" }), {
        status: 400,
      });
    }

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "messages is required and must be an array" }),
        { status: 400 }
      );
    }

    if (!metadata || typeof metadata !== "object") {
      return new Response(
        JSON.stringify({ error: "metadata is required and must be an object" }),
        { status: 400 }
      );
    }

    

    // Save transcript using controller
    const transcriptId = await transcriptController.saveTranscript(
      chatId,
      chatType,
      messages,
      metadata
    );

    

    return new Response(
      JSON.stringify({
        success: true,
        transcriptId: transcriptId,
        message: "Transcript saved successfully",
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error(`Error in POST /api/transcripts/save:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to save transcript",
      }),
      { status: error.message?.includes("required") ? 400 : 500 }
    );
  }
};

// app/api/spreadsheet/send/route.js

import { sendToGoogleSheets } from "@/app/services/spreadsheetService";
import enrichTranscriptWithContacts from "@/app/utils/contactEnrichment";

/**
 * POST /api/spreadsheet/send
 * Sends transcript data to Google Sheets
 * Body: { transcriptData } - The transcript data object
 * Returns: { success: true/false, message: "..." }
 */
export const POST = async (req) => {
  try {
    const body = await req.json();
    const { transcriptData } = body;

    if (!transcriptData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "transcriptData is required",
        }),
        { status: 400 }
      );
    }

    

    // Enrich transcript data with contact info + verification
    const enrichedTranscriptData = await enrichTranscriptWithContacts(
      transcriptData
    );

    // Send to Google Sheets
    const result = await sendToGoogleSheets(enrichedTranscriptData);

    

    return new Response(
      JSON.stringify({
        success: true,
        message: "Data sent to Google Sheets successfully",
        result: result,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error in POST /api/spreadsheet/send:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to send data to Google Sheets",
      }),
      { status: 500 }
    );
  }
};

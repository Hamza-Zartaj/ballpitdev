// app/services/spreadsheetService.js

import { google } from "googleapis";

/**
 * Formats a date to readable string (YYYY-MM-DD HH:MM:SS)
 */
const formatDate = (date) => {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Calculates duration in minutes between two dates
 */
const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return "";
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "";

  const diffMs = end.getTime() - start.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  return diffMinutes;
};

/**
 * Truncates content to max length
 */
const truncateContent = (content, maxLength = 500) => {
  if (!content) return "";
  const str = typeof content === "string" ? content : JSON.stringify(content);
  return str.length > maxLength ? str.substring(0, maxLength) + "..." : str;
};

/**
 * Converts boolean to Yes/No
 */
const boolToYesNo = (value) => {
  return value ? "Yes" : "No";
};

/**
 * Converts status number to readable text
 */
const formatStatus = (status) => {
  if (status === 0) return "Sent";
  if (status === 1) return "Read";
  return status?.toString() || "";
};

/**
 * Extracts the instant chat link from transcript data (instant chats only)
 */
const getInstantChatLinkFromTranscript = (transcriptData) => {
  if (!transcriptData || transcriptData.chatType !== "instant") {
    return "";
  }

  return (
    transcriptData.instantChatLink ||
    transcriptData.metadata?.instantChatLink ||
    transcriptData.metadata?.instant_chat_link ||
    ""
  );
};

/**
 * Authenticates with Google Sheets API using service account
 */
const getAuthClient = () => {
  const serviceAccountEmail = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!serviceAccountEmail || !privateKey) {
    throw new Error("Google Sheets service account credentials not configured");
  }

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return auth;
};

/**
 * Sanitizes a string to be used as a Google Sheets sheet name
 * Google Sheets restrictions: max 100 chars, no /, \, ?, *, [, ]
 */
const sanitizeSheetName = (name) => {
  if (!name || typeof name !== "string") {
    return "chat-unknown";
  }

  // Replace invalid characters with dash
  let sanitized = name.replace(/[\/\\\?\*\[\]]/g, "-");

  // Truncate to 100 characters (Google Sheets limit)
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }

  // If empty after sanitization, use fallback
  if (sanitized.trim().length === 0) {
    // Generate a hash-like name from the original
    const hash = name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0)
      .toString(36);
    sanitized = `chat-${hash}`;
  }

  return sanitized.trim();
};

/**
 * Creates a new sheet in the spreadsheet if it doesn't exist
 * Returns the sheet ID if created, or existing sheet ID if already exists
 */
const ensureSheetExists = async (sheets, spreadsheetId, sheetName) => {
  try {
    // First, get all existing sheets
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    // Check if sheet already exists
    const existingSheet = spreadsheet.data.sheets?.find(
      (sheet) => sheet.properties.title === sheetName
    );

    if (existingSheet) {
      
      return existingSheet.properties.sheetId;
    }

    // Sheet doesn't exist, create it
    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    });

    const newSheetId = response.data.replies[0].addSheet.properties.sheetId;
    
    return newSheetId;
  } catch (error) {
    // Handle race condition: if sheet already exists, fetch and return its ID
    if (error.message.includes("already exists")) {
      
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId,
      });
      const existingSheet = spreadsheet.data.sheets?.find(
        (sheet) => sheet.properties.title === sheetName
      );
      if (existingSheet) {
        return existingSheet.properties.sheetId;
      }
    }
    console.error(`Error creating sheet "${sheetName}":`, error.message);
    throw error;
  }
};

/**
 * Ensures a sheet exists and has headers
 * Creates the sheet if it doesn't exist, then ensures headers are present
 */
const ensureHeaders = async (sheets, spreadsheetId, sheetName, headers) => {
  try {
    // First, ensure the sheet exists
    await ensureSheetExists(sheets, spreadsheetId, sheetName);

    // Check if sheet has headers
    const sheetInfo = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z1`,
    });

    // If sheet is empty or doesn't have headers, add them
    if (
      !sheetInfo.data.values ||
      sheetInfo.data.values.length === 0 ||
      sheetInfo.data.values[0][0] !== headers[0]
    ) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: "RAW",
        resource: {
          values: [headers],
        },
      });
      

      // Clear any leftover columns beyond the new header length
      const extraColumnStartIndex = headers.length + 1; // 1-based index
      if (sheetName === "Chat Summary") {
        const extraColumnLetter = String.fromCharCode(
          64 + extraColumnStartIndex
        );
        try {
          await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: `${sheetName}!${extraColumnLetter}:Z`,
          });
          
        } catch (clearError) {
          console.warn(
            `Warning: Could not clear extra columns for ${sheetName}:`,
            clearError.message
          );
        }
      }
    }
  } catch (error) {
    console.error(`Error ensuring headers for ${sheetName}:`, error.message);
    throw error;
  }
};

/**
 * Formats transcript data for Chat Summary sheet
 */
const formatChatSummary = (transcriptData) => {
  const { chatId, chatType, participants, metadata, savedAt } = transcriptData;
  const instantChatLink = getInstantChatLinkFromTranscript(transcriptData);

  // Extract contact info from transcript data
  // Primary source: metadata.hostName (enriched with actual name from database)
  // Fallback: metadata.hostId (actual user ID)
  const hostName = metadata?.hostName || metadata?.hostId || "";
  const hostEmail = metadata?.hostEmail || "";
  const guestEmail = metadata?.guestEmail || "";

  

  return [
    formatDate(savedAt), // Timestamp
    chatId || "",
    chatType || "",
    hostName, // Show host name if available, otherwise host ID
    participants?.guest || metadata?.guestId || "",
    hostEmail || "",
    guestEmail || "",
    metadata?.messageCount || 0,
    instantChatLink,
  ];
};

/**
 * Formats transcript data for chat-specific sheet (one row per message)
 * Note: Chat ID is not included since each sheet is for a specific chat
 * For instant chats, replaces "demo-{chatId}" with actual host name
 */
const formatMessageDetails = (transcriptData) => {
  const { messages, chatType, participants, chatId, metadata } = transcriptData;
  const rows = [];

  if (!messages || !Array.isArray(messages)) {
    return rows;
  }

  

  messages.forEach((msg, idx) => {
    let author = msg.author || "";

    // For instant chats, replace demo/guest IDs with actual host name/ID and guest ID
    if (chatType === "instant" && chatId) {
      const demoAuthor = `demo-${chatId}`;
      const guestAuthor = `guest-${chatId}`;

      if (author === demoAuthor) {
        const originalAuthor = author;
        // Use host name from metadata if available, otherwise use host ID
        author = metadata?.hostName || metadata?.hostId || "Host";
        if (idx < 2) { // Log only first 2 messages to avoid spam
          
        }
      } else if (author === guestAuthor) {
        // Keep guest ID as-is or use guest name if available
        author = metadata?.guestName || participants?.guest || author;
      }
    }

    rows.push([
      msg.id || msg.key || "", // Message ID
      author, // Author (with host name replacement for instant chats)
      truncateContent(msg.content, 500), // Content (truncated)
      msg.type || "text", // Type
      formatDate(msg.created_at || msg.timestamp), // Timestamp
      boolToYesNo(msg.isAI || false), // Is AI
      formatStatus(msg.status), // Status
    ]);
  });

  return rows;
};

/**
 * Sends transcript data to Google Sheets
 * Creates/updates "Chat Summary" sheet and creates/updates per-chat sheets
 */
export const sendToGoogleSheets = async (transcriptData) => {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!spreadsheetId) {
      throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID not configured");
    }

    // Authenticate
    const auth = getAuthClient();
    const sheets = google.sheets({ version: "v4", auth });

    // Chat Summary sheet headers
    const chatSummaryHeaders = [
      "Timestamp",
      "Chat ID",
      "Chat Type",
      "Host ID",
      "Guest ID",
      "Host Email",
      "Guest Email",
      "Message Count",
      "Instant Chat Link",
    ];

    // Chat-specific sheet headers (no Chat ID column since sheet name identifies the chat)
    const chatSheetHeaders = [
      "Message ID",
      "Author",
      "Content",
      "Type",
      "Timestamp",
      "Is AI",
      "Status",
    ];

    // Ensure Chat Summary sheet exists and has headers
    await ensureHeaders(
      sheets,
      spreadsheetId,
      "Chat Summary",
      chatSummaryHeaders
    );

    // Format data
    const chatSummaryRow = formatChatSummary(transcriptData);
    const messageDetailRows = formatMessageDetails(transcriptData);

    // Check if chatId already exists in Chat Summary sheet
    // If exists, update that row; if not, append new row
    const chatId = transcriptData.chatId;
    let rowIndex = -1;

    try {
      const summaryData = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Chat Summary!A:I",
      });

      if (summaryData.data.values && summaryData.data.values.length > 1) {
        // Skip header row (index 0), search from row 1
        for (let i = 1; i < summaryData.data.values.length; i++) {
          // Chat ID is in column B (index 1)
          if (summaryData.data.values[i][1] === chatId) {
            rowIndex = i + 1; // Google Sheets uses 1-based indexing
            break;
          }
        }
      }
    } catch (error) {
      // If reading fails, fall back to append behavior
      console.warn(
        `Error reading Chat Summary sheet to check for existing chatId ${chatId}, will append new row:`,
        error.message
      );
    }

    if (rowIndex > 0) {
      // Update existing row
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Chat Summary!A${rowIndex}:I${rowIndex}`,
        valueInputOption: "RAW",
        resource: {
          values: [chatSummaryRow],
        },
      });
      
    } else {
      // Append new row
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Chat Summary!A:I",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: {
          values: [chatSummaryRow],
        },
      });
      
    }

    // Create/update per-chat sheet for this specific chat
    const sanitizedChatSheetName = sanitizeSheetName(chatId);

    // Ensure chat-specific sheet exists and has headers
    await ensureHeaders(
      sheets,
      spreadsheetId,
      sanitizedChatSheetName,
      chatSheetHeaders
    );

    // Clear existing data rows and write all messages fresh (if any)
    if (messageDetailRows.length > 0) {
      try {
        // Clear all data rows (from row 2 onwards, keeping header row 1)
        await sheets.spreadsheets.values.clear({
          spreadsheetId,
          range: `${sanitizedChatSheetName}!A2:G`,
        });
        
      } catch (clearError) {
        // If clear fails, log warning but continue (sheet might be empty)
        console.warn(
          `Warning: Could not clear data rows from sheet ${sanitizedChatSheetName}:`,
          clearError.message
        );
      }

      // Write all messages fresh starting from row 2
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sanitizedChatSheetName}!A2`,
        valueInputOption: "RAW",
        resource: {
          values: messageDetailRows,
        },
      });

      
    }

    return {
      success: true,
      chatSummaryRows: 1,
      chatSheetName: sanitizedChatSheetName,
      messageRows: messageDetailRows.length,
    };
  } catch (error) {
    console.error("Error sending data to Google Sheets:", error);
    throw error;
  }
};

export default { sendToGoogleSheets };

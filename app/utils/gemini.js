import { GoogleGenAI } from "@google/genai";
import { generateSystemPrompt } from "./personaHelper";

const GEMINI_MODEL = "gemini-2.5-flash";
const geminiKey = process.env.GEMINI_API_KEY;
const geminiClient = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

const formatChatInput = (chats) => {
  if (Array.isArray(chats)) {
    return chats
      .map((chat) =>
        typeof chat === "string"
          ? chat
          : typeof chat === "object"
          ? JSON.stringify(chat)
          : String(chat ?? "")
      )
      .join("\n");
  }

  if (typeof chats === "string") {
    return chats;
  }

  if (typeof chats === "object" && chats !== null) {
    return JSON.stringify(chats);
  }

  return String(chats ?? "");
};

const extractGeminiText = (result) => {
  if (typeof result?.text === "string" && result.text.trim().length) {
    return result.text.trim();
  }

  const candidates = result?.response?.candidates;
  if (Array.isArray(candidates) && candidates.length) {
    return candidates
      .flatMap((candidate) => candidate.content?.parts || [])
      .map((part) => part.text || "")
      .join("")
      .trim();
  }

  return "";
};

export const generateAIResponse = async (chats, userId) => {
  if (!geminiClient) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  try {
    const systemPrompt = await generateSystemPrompt(userId);
    const chatInput = formatChatInput(chats);

    const response = await geminiClient.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "user",
          parts: [{ text: chatInput }],
        },
      ],
    });

    const content = extractGeminiText(response);
    if (!content) {
      throw new Error("Gemini response did not include text");
    }

    return JSON.parse(content);
  } catch (e) {
    
    throw e;
  }
};

import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import userController from "@/app/controllers/userController";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/app/config/firebase";

const GEMINI_MODEL = "gemini-2.5-flash";
const geminiKey = process.env.GEMINI_API_KEY;

if (!geminiKey) {
  throw new Error("GEMINI_API_KEY is not configured. This is required for persona features.");
}

const gemini = new GoogleGenAI({ apiKey: geminiKey });

const mapMessagesToGeminiContents = (messages = []) =>
  messages
    .filter((msg) => msg && msg.content)
    .map((message) => {
      const rawContent = message.content;
      const text =
        typeof rawContent === "string"
          ? rawContent
          : Array.isArray(rawContent)
          ? rawContent
              .map((item) =>
                typeof item === "string" ? item : JSON.stringify(item)
              )
              .join("\n")
          : JSON.stringify(rawContent);

      return {
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text }],
      };
    });

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

const runGeminiCompletion = async (messages) => {
  if (!gemini) {
    throw new Error("Gemini client is not configured");
  }

  const contents = mapMessagesToGeminiContents(messages);
  const response = await gemini.models.generateContent({
    model: GEMINI_MODEL,
    contents,
  });

  const text = extractGeminiText(response);
  if (!text) {
    throw new Error("Gemini response did not include text");
  }

  return { role: "assistant", content: text };
};

export const GET = async (req) => {
  const urlObj = new URL(req.url);
  const id = urlObj.searchParams.get("id");

  // 1) If this is a demo user, immediately return enablePersona:true:
  if (id?.startsWith("demo-guest-")) {
    return new Response(
      JSON.stringify({
        enablePersona: true,
        personality: "friendly",
        extraPrompt: "",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2) Otherwise, fall back to your “real user” logic (Firestore lookups, etc.)
  if (!id) {
    return new Response(JSON.stringify({ error: "ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Attempt to fetch from main users collection:
    const mainUser = await userController.getUser(id);
    return new Response(JSON.stringify(mainUser?.personaSetting || {}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // If not found in main users, try demoUsers/{stripped}
    const stripped = id.replace(/^demo-/, "");
    const demoRef = doc(firestore, "demoUsers", stripped);
    const demoSnap = await getDoc(demoRef);
    if (!demoSnap.exists()) {
      return new Response(JSON.stringify({}), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(demoSnap.data().personaSetting || {}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export async function POST(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id"); // e.g. "demo-guest-12345"
  

  // ─────────────────────────────────────────────────────────────────────
  // 1) SHORT‐CIRCUIT FOR DEMO USER
  //    If `id` starts with "demo‐guest-", skip Firestore entirely and
  //    immediately build a friendly system prompt + call AI.
  // ─────────────────────────────────────────────────────────────────────
  if (id?.startsWith("demo-guest-")) {
    // Check host subscription for this demo path
    try {
      const strippedId = id.replace(/^demo-/, ""); // "guest-XXXXX"
      const demoRef = doc(firestore, "demoUsers", strippedId);
      const demoSnap = await getDoc(demoRef);
      if (demoSnap.exists()) {
        const demoData = demoSnap.data();
        const creatorId = demoData.creatorId;
        if (creatorId) {
          try {
            const creator = await userController.getUser(creatorId);
            const creatorSubscribed = creator?.hasSubscription === true;
            if (!creatorSubscribed) {
              console.warn(`AI blocked — host ${creatorId} has no active subscription`);
              return new Response(
                JSON.stringify({ error: "Host subscription required." }),
                { status: 402, headers: { "Content-Type": "application/json" } }
              );
            }
          } catch (e) {
            console.warn("Could not verify host subscription:", e.message);
          }
        }
      }
    } catch (e) {
      console.warn("Error checking demo-guest creator subscription:", e.message);
    }

    // Parse the incoming JSON body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("Failed to parse JSON for demo user:", e);
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { chatHistory } = body;
    if (!chatHistory || !Array.isArray(chatHistory)) {
      console.error("Demo user: chatHistory invalid or not an array");
      return new Response(
        JSON.stringify({ error: "Invalid chatHistory format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build a "friendly" sales assistant persona template for the demo guest
    const guestNumericId = id.replace(/^demo-guest-/, "") || "unknown";
    const name = `Sales Team ${guestNumericId}`;
    const personaPrompt = `
You are a focused sales representative helping visitors learn about products/services and guiding them toward a decision.
WHEN GREETING: Start with a warm welcome and CLEARLY INTRODUCE what products or services you offer. Be specific about what your business does (e.g., "We help with X" or "We specialize in Y").
Ask short, targeted questions — ONE at a time — to understand their needs. Be warm but purposeful.
Speak casually, using short and simple sentences. Avoid sending images unless the customer explicitly asks or says yes when offered.
When the visitor shows buying intent (asks about price, next steps, availability, or says they're interested), ask for their contact details (name, email, phone) so the team can follow up.
If you don't know something, admit it and offer to connect them with the right person.
IMPORTANT TRAITS: Friendly, sales-focused, consultative, customer-first
`.trim();

    // Build messages array for the AI call: [system, ...userHistory]
    const messagesForAI = [
      { role: "system", content: personaPrompt },
      ...chatHistory,
    ];

    try {
      const aiResponse = await runGeminiCompletion(messagesForAI);

      // Return the AI’s assistant message
      return new Response(JSON.stringify({ message: aiResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (aiErr) {
      console.error("Error generating AI reply for demo user:", aiErr);
      // Fallback friendly response if the API call fails
      return new Response(
        JSON.stringify({
          message: {
            role: "assistant",
            content: "Sorry, I’m having trouble right now.",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  }
  // ─────────────────────────────────────────────────────────────────────
  // End of “demo-guest-” shortcut. Everything below is your original logic.
  // ─────────────────────────────────────────────────────────────────────

  // 2) Parse the real request body and validate chatHistory
  let body;
  try {
    body = await req.json();
  } catch (e) {
    console.error("Failed to parse JSON body:", e);
    return new Response(
      JSON.stringify({ error: "Invalid JSON in request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { chatHistory } = body;
  

  if (!chatHistory || !Array.isArray(chatHistory)) {
    console.error("Invalid chat history format");
    return new Response(
      JSON.stringify({ error: "Invalid chat history format" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3) Fetch the user (or fall back to demoUsers if not found)
  let user;
  let isRealUser = false;
  try {
    user = await userController.getUser(id);
    if (!user) {
      throw new Error("User not found in main collection");
    }
    isRealUser = true;
  } catch (e) {
    console.warn(`Main-users lookup failed (${id}):`, e.message);
    // Try demoUsers collection
    const stripped = id.replace(/^demo-/, "");
    const demoRef = doc(firestore, "demoUsers", stripped);
    const demoSnap = await getDoc(demoRef);
    if (!demoSnap.exists()) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    user = demoSnap.data();
  }

  

  // 4) Fetch persona images if available
  const personaImages = user.personaSetting?.images || [];
  

  // 4.5) Build the system prompt based on that user's personaSetting
  const personaData = user.personaSetting || {};
  const name = personaData.name || user.name || "User";
  const birthYear = user.birthday?.year || 2000;
  const personality = personaData.personality || "friendly";
  const extraPrompt = personaData.extraPrompt || "";

  // Build image availability message for the AI, including filenames so it knows which index maps to which product
  let imageContext = "";
  if (personaImages.length > 0) {
    const imageList = personaImages.map((url, i) => {
      // Extract a human-readable name from the URL filename
      try {
        const decoded = decodeURIComponent(url);
        const filenameMatch = decoded.match(/\/([^/?]+)\?/) || decoded.match(/\/([^/]+)$/);
        const raw = filenameMatch ? filenameMatch[1] : `Image ${i}`;
        // Strip the random suffix added during upload (e.g. "-8892171") and the extension
        const cleaned = raw.replace(/-\d{4,}$/, "").replace(/\.[^.]+$/, "").replace(/%20/g, " ");
        return `  [SHARE_IMAGE:${i}] = ${cleaned}`;
      } catch {
        return `  [SHARE_IMAGE:${i}] = Image ${i}`;
      }
    }).join("\n");

    imageContext = `\n\nIMAGES AVAILABLE (STRICT RULES):\nYou have ${personaImages.length} image(s) in the product gallery with these labels:\n${imageList}\nONLY write the matching [SHARE_IMAGE:N] tag in your response when: (a) the customer explicitly asks to see an image, photo, or picture of a specific product, OR (b) you asked in your previous message if they would like to see an image and they said yes. ALWAYS choose the image whose label best matches what the customer asked for. Do NOT send images on your own initiative or just because they seem relevant.`;
  }

  let systemPrompt = "";
  switch (personality) {
    case "friendly":
      systemPrompt = `
You are a friendly sales representative for ${name}'s business.
Your goal is to understand what the customer needs and guide them toward the right product/service.
WHEN GREETING THE CUSTOMER: Start with a warm welcome and CLEARLY INTRODUCE what products or services you offer from the description below.
Ask ONE short, focused question at a time to understand their needs. Keep your responses concise and warm.
When relevant, share specific details about the products/services from the business description below.
When the customer shows clear buying intent (asks about price, availability, "how do I order", "I want this", etc.), ask for their contact details (name, email, phone) so the team can follow up and finalize things.
Do NOT send images unless the customer explicitly asks to see one, or they say yes after you offer.
${extraPrompt ? `BUSINESS DESCRIPTION/PRODUCTS: ${extraPrompt}` : "BUSINESS DESCRIPTION: We're here to help! Ask us anything about our offerings."}
IMPORTANT TRAITS: Friendly, consultative, focused, customer-first${imageContext}
      `.trim();
      break;

    case "professional":
      systemPrompt = `
You are a professional sales consultant representing ${name}'s business.
Your goal is to identify the customer's needs through short, precise questions and match them to the right solution.
WHEN GREETING THE CUSTOMER: Start professionally and CLEARLY STATE what products or services you offer from the description below.
Ask ONE question at a time. Be concise, clear, and solution-oriented. Avoid filler or unnecessary small talk.
Provide specific product/service information from the business description when the customer's needs align.
When the customer is close to deciding or asks about pricing/next steps, ask for their contact details (name, email, phone number) to arrange a follow-up.
Do NOT send images unless the customer explicitly asks to see one, or they say yes after you offer.
${extraPrompt ? `BUSINESS DESCRIPTION/SERVICES: ${extraPrompt}` : "BUSINESS DESCRIPTION: We provide professional solutions. Let me help you find the right fit."}
IMPORTANT TRAITS: Professional, consultative, solution-focused, trustworthy${imageContext}
      `.trim();
      break;

    case "casual":
      systemPrompt = `
You're a chill sales rep for ${name}'s business — like a knowledgeable friend helping someone out.
WHEN SAYING HI: Give them a warm greeting and tell them what you're all about (what products/services you offer from the description below).
Keep things relaxed and low-pressure, but stay focused on understanding what they're looking for.
Ask short, casual questions one at a time. Share relevant product/service info from the business description when it fits.
When they seem ready to move forward (asking about price, "how do I get it", showing excitement), casually ask for their contact info (name, email, phone) so the right person can reach out.
Don't push images unless they ask to see one or say yes when you offer.
${extraPrompt ? `BUSINESS DESCRIPTION/VIBE: ${extraPrompt}` : "BUSINESS DESCRIPTION: Hey! We've got some cool stuff. What can I help you with?"}
IMPORTANT TRAITS: Casual, friendly, approachable, laid-back, sales-aware${imageContext}
      `.trim();
      break;

    case "energetic":
      systemPrompt = `
You're an energetic, enthusiastic sales rep for ${name}'s business!
FIRST, GREET them with excitement and TELL THEM what awesome products/services you offer!
Your job is to get customers excited about these offerings while actually understanding their needs.
Ask short, punchy questions — one at a time. Share product highlights from the business description with genuine enthusiasm.
When the customer is clearly interested or ready to buy, jump on it and ask for their contact details (name, email, phone) so someone can finalize everything with them!
Only share images if they ask for one or say yes when you offer — don't just send them randomly.
${extraPrompt ? `BUSINESS DESCRIPTION/PRODUCTS: ${extraPrompt}` : "BUSINESS DESCRIPTION: We're pumped to show you what we've got! What interests you?"}
IMPORTANT TRAITS: Energetic, enthusiastic, sales-driven, passionate, positive${imageContext}
      `.trim();
      break;

    default:
      systemPrompt = `
You are a helpful sales assistant for ${name}'s business.
START BY INTRODUCING what products or services you offer (from the description below).
Focus on understanding the customer's needs by asking short, targeted questions — one at a time.
Use the business description to provide relevant product/service details based on what they're looking for.
When the customer shows buying intent or is ready to move forward, ask for their contact details (name, email, phone number) so the team can follow up.
Only send images when the customer explicitly asks for one, or when they say yes after you offer.
${extraPrompt ? `BUSINESS DESCRIPTION: ${extraPrompt}` : "BUSINESS DESCRIPTION: How can we help you today?"}
IMPORTANT TRAITS: Helpful, sales-focused, attentive, authentic${imageContext}
      `.trim();
      break;
  }

  // 5) Build final messages array and call AI
  const messagesForAI = [
    { role: "system", content: systemPrompt },
    ...chatHistory,
  ];

  try {
    let aiResponseMessage;
    if (geminiKey) {
      aiResponseMessage = await runGeminiCompletion(messagesForAI);
    } else {
      const completion = await openai.chat.completions.create({
        model: modelToUse,
        messages: messagesForAI,
        temperature: 0.9,
        max_tokens: 500,
      });
      aiResponseMessage = completion.choices[0].message;
    }

    // Parse AI response for image sharing requests
    const aiText = aiResponseMessage.content || "";
    const imageRegex = /\[SHARE_IMAGE:(\d+)\]/g;
    const imagesToShare = [];
    let match;
    
    while ((match = imageRegex.exec(aiText)) !== null) {
      const imageIndex = parseInt(match[1], 10);
      if (imageIndex >= 0 && imageIndex < personaImages.length) {
        imagesToShare.push({
          url: personaImages[imageIndex],
          index: imageIndex,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: aiResponseMessage,
        images: imagesToShare,
        personaImages: personaImages,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (aiError) {
    console.error("Error calling AI service:", aiError);
    // Fallback response if AI fails
    return new Response(
      JSON.stringify({
        message: {
          role: "assistant",
          content: "Sorry, I'm having trouble right now.",
        },
        images: [],
        personaImages: personaImages,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PUT(request) {
  const body = await request.json();
  return NextResponse.json({ message: "Put received", data: body });
}

export async function DELETE(request) {
  return NextResponse.json({ message: "Delete received" });
}

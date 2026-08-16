// pages/api/demo/chat.js

import demoChatController from "../../controllers/demoChatController";

export const GET = async (req) => {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    
    const chat = await demoChatController.getChat(id);
    
    return new Response(JSON.stringify(chat));
  } catch (e) {
    console.error(`Error in GET /api/demo/chat:`, e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
    });
  }
};

export const POST = async (req) => {
  try {
    const chatData = await req.json();
    
    const chatId = await demoChatController.createChat(chatData);
    
    return new Response(JSON.stringify({ id: chatId }), { status: 201 });
  } catch (error) {
    console.error(`Error in POST /api/demo/chat:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }
};

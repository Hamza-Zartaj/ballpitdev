import chatController      from "../../controllers/chatController";
import demoChatController  from "@/app/controllers/demoChatController";
import demoUserController  from "@/app/controllers/demoUserController";
import { getById }         from "@/app/utils/firebase/firestore";  // Firestore helper

export const GET = async (req) => {
  try {
    const url = new URL(req.url);
    const id  = url.searchParams.get("id");
    

    if (id?.startsWith("guest-")) {
      // 1) RTDB meta (last message, status, isAI)
      const rtdbMeta = (await demoChatController.getChat(id)) || {};

      // 2) Firestore meta (unread count, lastMessageTime/Author)
      const fsMeta   = (await getById("demochats", id)) || {};

      // 3) Demo-user doc (to get creatorId)
      const du       = await demoUserController.getDemoUser(id);

      const fakeChat = {
        id,
        users: [ id, du.creatorId ],
        // prefer RTDB timestamp, else Firestore, else null
        lastMessageTime:   rtdbMeta.lastMessage?.timestamp
                          ?? fsMeta.lastMessageTime
                          ?? null,
        // same for author
        lastMessageAuthor: rtdbMeta.lastMessage?.author
                          ?? fsMeta.lastMessageAuthor
                          ?? null,
        // get the Firestore unread count (default 0)
        unread:            fsMeta.unread ?? 0,
      };

      
      return new Response(JSON.stringify(fakeChat), { status: 200 });
    }

    // non-demo chat: just pass through to your normal controller
    const chat = await chatController.getChat(id);
    
    return new Response(JSON.stringify(chat), { status: 200 });
  } catch (e) {
    console.error("Error in GET /api/chat:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
    });
  }
}
export const POST = async (req) => {
  try {
    const chatData = await req.json(); // Parse the JSON body for chat data
    

    const chatId = await chatController.createchat(chatData); // Create a new chat
    

    return new Response(JSON.stringify({ id: chatId }), { status: 201 });
  } catch (error) {
    console.error(`Error in POST /api/chat:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  }
};

import { NextResponse } from "next/server"
import { firestore, database } from "@/app/config/firebase"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { ref, push, serverTimestamp, get, query as queryRealtime, limitToLast } from "firebase/database"
import { generateAIResponse } from "@/app/utils/gemini"
import moment from "moment"

function splitTimeString(timeStr) {
  const regex = /^(\d+)([a-zA-Z]+)$/
  const match = timeStr.match(regex)
  if (!match) return null
  const number = parseInt(match[1], 10)
  const unit = match[2]
  return { number, unit }
}

export async function GET() {
  try {
    
    const chatsRef = collection(firestore, "chats")
    const q1 = query(chatsRef, where("unread", ">", 0))
    const chatSnapshots = await getDocs(q1)
    const processedChats = []

    for (const chat of chatSnapshots.docs) {
      const chatData = chat.data()
      const users = chatData.users
      
      const userConfigsRef = collection(firestore, "users")
      const userSnapshots = await getDocs(query(userConfigsRef, where("uid", "in", users), where("personaConfig.enablePersona", "==", true)))
      
      for (const user of userSnapshots.docs) {
        const userData = user.data()
        if (userData.autoChat && userData.persona) {
          const timeThreshold = new Date()
          timeThreshold.setMinutes(timeThreshold.getMinutes() - (userData.autoChatDelay || 10))
          if (chatData.lastMessageTime && new Date(chatData.lastMessageTime.toDate()) < timeThreshold) {
            
            const response = await generateAIResponse(chatData.lastMessage, userData.uid, chat.id)
            const messagesRef = ref(database, `messages/${chat.id}`)
            await push(messagesRef, {
              text: response,
              sender: userData.uid,
              timestamp: serverTimestamp(),
              isAI: true
            })
            
            const chatDocRef = doc(firestore, "chats", chat.id)
            await updateDoc(chatDocRef, {
              lastMessage: response,
              lastMessageTime: new Date(),
              unread: chatData.unread + 1
            })
            processedChats.push(chat.id)
          }
        }
      }
    }

    
    const userCollection = collection(firestore, "users")
    const userSnapshots = await getDocs(query(userCollection, where("personaSetting.enablePersona", "==", true)))
    const personaUsers = userSnapshots.docs.map(doc => doc.data().uid)
    
    
    const chatRef = collection(firestore, "chats")
    const chats = await getDocs(query(chatRef, where("unread", ">", 0), where("users", "array-contains-any", personaUsers)))
    
    const chatLists = await Promise.all(chats.docs.map(async item => {
      try {
        const chatId = item.id
        
        const chatDataRef = ref(database, `messages/${chatId}`)
        const q2 = queryRealtime(chatDataRef, limitToLast(10))
        const chatDataSnapshot = await get(q2)
        const chatDataVal = chatDataSnapshot.val()
        const prompt = Object.values(chatDataVal)
          .filter(i => i.type === "text")
          .map(i => `User: ${i.content}`)
          .join("\n")
        const personaResponse = item.data().users.filter(i => i !== item.data().lastMessageAuthor)[0]
        
        
        const personaSettingSnap = await getDocs(query(collection(firestore, "users"), where("uid", "==", personaResponse)))
        const personaSetting = personaSettingSnap.docs.map(i => i.data())[0].personaSetting
        
        if (moment(item.data().lastMessageTime.toDate()).isBefore(moment().subtract(splitTimeString(personaSetting.responseTimeout).number, splitTimeString(personaSetting.responseTimeout).unit))) {
          
          const aiResponse = await generateAIResponse(prompt, personaResponse)
          if (aiResponse) {
            const newChat = {
              content: aiResponse.response,
              type: "text",
              isAI: true,
              created_at: Date.now(),
              author: personaResponse
            }
            await push(chatDataRef, newChat)
            
            if (aiResponse.image && personaSetting.shareImage && personaSetting.images?.length > 0) {
              
              const imageCount = personaSetting.images.length || 0
              const image = personaSetting.images[Math.round(Math.random() * imageCount)]
              const imageDoc = {
                content: image,
                type: "media",
                isAI: true,
                created_at: Date.now(),
                author: personaResponse
              }
              await push(chatDataRef, imageDoc)
            }
            
            await updateDoc(doc(firestore, "chats", chatId), {
              unread: 0
            })
          }
          return {
            prompt,
            chatId,
            personaResponse,
            aiResponse: aiResponse.response
          }
        }
      } catch (e) {
        
      }
    }))

    return NextResponse.json({
      ok: true,
      processed: processedChats.length,
      chats: chatLists
    })
  } catch (error) {
    console.error("Error in cron job:", error)
    return NextResponse.json({
      ok: false,
      error: error.message
    }, { status: 500 })
  }
}

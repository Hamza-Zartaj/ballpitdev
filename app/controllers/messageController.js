import { database } from '../config/firebase';
import { ref, get, query, orderByChild, limitToLast } from 'firebase/database';
import { RTDB_PATHS } from '../models/schema';

const messageController = {
    // Get recent messages for a chat (read-only, no write validation needed)
    getRecentMessages: async (chatId, limit = 5) => {
        try {
            const messagesRef = ref(database, `${RTDB_PATHS.MESSAGES}/${chatId}`);
            const recentMessagesQuery = query(
                messagesRef,
                orderByChild('timestamp'),
                limitToLast(limit)
            );
            
            const snapshot = await get(recentMessagesQuery);
            const messages = [];
            
            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    messages.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
            }
            
            return messages.sort((a, b) => a.timestamp - b.timestamp);
        } catch (error) {
            throw new Error(`Error fetching messages: ${error.message}`);
        }
    }
};

export default messageController;
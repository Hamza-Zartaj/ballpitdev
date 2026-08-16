"use client";

import useChatList from "@/app/hooks/useChatList";
import ChatList from "./ChatList";
import NoChats from "./NoChats";
import { useAuth } from "@/app/contexts/AuthProvider";
import { Spinner } from "@/app/components/Spinner";

const ChatHome = () => {
	const { user } = useAuth();
	const { chats, loading, stories } = useChatList(user?.uid, user);

	if (loading) {
		return <Spinner />;
	}

		return (
			<>
				{chats.length > 0 ? (
					<ChatList chatList={chats} stories={stories} />
				) : (
					<NoChats />
				)}
			</>
		);
};

export default ChatHome;

// app/hooks/useChatList.js

import {
	collection,
	getDocs,
	onSnapshot,
	query,
	where,
	orderBy,
	limitToLast as limitToLastFirestore,
	doc,
	getDoc,
} from "firebase/firestore";
import {
	ref as rtdbRef,
	get as rtdbGet,
	query as rtdbQuery,
	limitToLast as rtdbLimit,
} from "firebase/database";
import { useEffect, useState } from "react";

const portfolioMode =
	process.env.NODE_ENV !== "production" &&
	process.env.NEXT_PUBLIC_PORTFOLIO_MODE === "true";

// helper to fetch last message + status from a generic path
async function getLastMessageAndStatus(path) {
	// last message
	const msgSnap = await rtdbGet(
		rtdbQuery(rtdbRef(database, `${path}`), rtdbLimit(1))
	);
	const lastMsg = Object.values(msgSnap.val() || {})[0] || null;

	// online status
	const statusSnap = await rtdbGet(rtdbRef(database, `demoOnline/${path}`));
	const online = statusSnap.val() === true;

	// Format content for display in chat list
	let displayContent = null;
	if (lastMsg?.content) {
		if (typeof lastMsg.content === "object") {
			// Handle media messages
			if (lastMsg.type === "media") {
				displayContent = lastMsg.content.type === "image" ? "📷 Image" : "🎥 Video";
			} else {
				displayContent = "Media";
			}
		} else {
			// Handle text messages
			displayContent = lastMsg.content;
		}
	}

	return {
		content: displayContent,
		timestamp: lastMsg?.created_at || null,
		type: lastMsg?.type || "text",
		isAI: lastMsg?.isAI || false,
		status: online ? "online" : "offline",
	};
}

export default function useChatList(userId, currentUser) {
	const [chats, setChats] = useState([]);
	const [stories, setStories] = useState([]);
	const [loading, setLoading] = useState(true);

	function toMillis(ts) {
		if (!ts) return 0;
		// Firestore Timestamp
		if (ts.seconds != null && ts.nanoseconds != null) {
			return ts.seconds * 1000 + Math.floor(ts.nanoseconds / 1e6);
		}
		// JavaScript Date
		if (ts instanceof Date) {
			return ts.getTime();
		}
		// ISO‐string or other string
		if (typeof ts === "string") {
			const d = Date.parse(ts);
			return isNaN(d) ? 0 : d;
		}
		// Fallback
		return 0;
	}

	useEffect(() => {
		if (!userId || !currentUser) return;

		if (portfolioMode) {
			setChats([
				{
					id: "portfolio-chat-1",
					name: "Sarah Mitchell",
					avatar: "/fallback.png",
					status: "online",
					lastMessage: "Thanks, that sounds perfect.",
					timestamp: new Date().toISOString(),
					unreadCount: 2,
					isAI: false,
					isDemo: false,
				},
				{
					id: "portfolio-chat-2",
					name: "Michael Chen",
					avatar: "/fallback.png",
					status: "offline",
					lastMessage: "I would like to learn more about pricing.",
					timestamp: new Date(Date.now() - 86400000).toISOString(),
					unreadCount: 0,
					isAI: true,
					isDemo: true,
				},
			]);
			setLoading(false);
			return;
		}

		setLoading(true);

		let firestore;
		let database;
		let unsubscribe;
		const initializeFirebase = async () => {
			({ firestore, database } = await import("@/app/config/firebase"));

		// 1) Listen to real user chats
		const chatCol = collection(firestore, "chats");
		const realChatsQuery = query(
			chatCol,
			where("users", "array-contains", userId)
		);

		unsubscribe = onSnapshot(realChatsQuery, async (snapshot) => {
			try {
				// map each chat doc → chat object
				const realChats = await Promise.all(
					snapshot.docs.map(async (docSnap) => {
						const chatId = docSnap.id;
						const data = docSnap.data();

						// find the other user
						const otherId = data.users[0] === userId ? data.users[1] : data.users[0];

						// fetch that user’s name & avatar
						const userDocs = await getDocs(
							query(collection(firestore, "users"), where("uid", "==", otherId))
						);
						const userDoc = userDocs.docs[0]?.data() || {};

						// **new**: fetch avatar via your API
						let avatarUrl = "/fallback.png";
						try {
							const avRes = await fetch(`/api/avatar?id=${otherId}`);
							if (avRes.ok) {
								const { avatar } = await avRes.json();
								avatarUrl = avatar || avatarUrl;
							}
						} catch (e) {
							console.warn("Could not fetch avatar for", otherId, e);
						}

						

						// get last message & status from RTDB under “messages/{chatId}”
						const { content, timestamp, status, isAI } =
							await getLastMessageAndStatus(`messages/${chatId}`);

						return {
							id: chatId,
							name: userDoc.name || "Unknown",
							avatar: avatarUrl || "/fallback.png",
							status,
							lastMessage: content,
							timestamp,
							unreadCount: data.lastMessageAuthor !== userId ? data.unread : 0,
							isAI,
							isDemo: false,
						};
					})
				);

				// 2) Fetch demo-users YOU created
				const demochatSnap = await getDocs(
					query(
						collection(firestore, "demochats"),
						where("creatorId", "==", currentUser.uid)
					)
				);

				const demoChats = await Promise.all(
					demochatSnap.docs.map(async (dcDoc) => {
						const dc = dcDoc.data();
						const demoId = dcDoc.id; // "guest-XXXXX"

						// get last message & status under "demoMessages/{demoId}"
						const { content, timestamp, status, isAI } =
							await getLastMessageAndStatus(`demoMessages/${demoId}`);

						// All metadata now in same document (merged)
						return {
							id: demoId,
							name: dc.uid,
							avatar: dc.avatar,
							status,
							lastMessage: content || dc.lastMessage || null,
							time: timestamp || dc.lastMessageTime,
							unreadCount: dc.unread || 0,
							isAI,
							isDemo: true,
						};
					})
				);

				// 3) Combine and sort by timestamp descending
				const combined = [...realChats, ...demoChats].sort(
					(a, b) => toMillis(b.timestamp) - toMillis(a.timestamp)
				);
				setChats(combined);
				setLoading(false);
			} catch (err) {
				console.error("Error assembling chat list:", err);
				setChats([]);
				setLoading(false);
			}
		});

		};

		initializeFirebase();

		return () => unsubscribe?.();
	}, [userId, currentUser]);

	return { chats, loading, stories };
}

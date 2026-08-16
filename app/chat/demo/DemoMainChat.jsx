// DemoChatMain.jsx
"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatHeader from "../common/ChatHeader";
import moment from "moment";
import { useDemoChat } from "@/app/contexts/DemoChatProvider";
import { Spinner } from "@/app/components/Spinner";
import { ChatInput } from "./ChatInput";

const urlRegex = /(https?:\/\/[^\s]+)/g;
const boldRegex = /\*\*([^*]+)\*\*/g;

const parseTextContent = (text) => {
	// Split by URLs first
	const urlParts = text.split(urlRegex);

	return urlParts.map((part, i) => {
		// If this part is a URL, render as link
		if (urlRegex.test(part)) {
			return (
				<a
					key={i}
					href={part}
					target="_blank"
					rel="noopener noreferrer"
					className="underline text-blue-400 hover:text-blue-300"
				>
					{part}
				</a>
			);
		}

		// Otherwise, parse for bold text
		const boldParts = part.split(boldRegex);
		return boldParts.map((boldPart, j) => {
			// Check if this is bold text (every odd index is bold)
			if (j % 2 === 1) {
				return (
					<strong key={`${i}-${j}`} className="font-bold">
						{boldPart}
					</strong>
				);
			}
			return <span key={`${i}-${j}`}>{boldPart}</span>;
		});
	});
};

const ChatBubble = (props) => {
	const { isMe, time, type, content, isAI } = props;
	switch (type) {
		case "text":
			return (
				<div className="w-full flex flex-col">
					<div className={`flex ${isMe ? "justify-end" : ""}`}>
						<div
							className={`p-4 rounded-t-3xl max-w-[80%] text-md break-words ${
								!isMe
									? "rounded-br-3xl bg-Grey-800"
									: "rounded-bl-3xl bg-Primary-500 text-white"
							}`}>
							{parseTextContent(content)}
						</div>
					</div>
					<div
						className={`mt-2 flex items-center ${
							isMe ? "justify-end" : "justify-start"
						}`}>
						{isAI ? (
							<img className="h-6 w-6 mr-2.5" src="/assets/svgs/ai-persona.svg" />
						) : null}
						<p className="text-sm font-satoshi">
							{moment.duration(moment(time).diff(new Date())).humanize(true)}
						</p>
					</div>
				</div>
			);
		case "media":
			return (
				<div className="w-full flex flex-col">
					<div className={`flex ${isMe ? "justify-end" : ""}`}>
						<div
							className={`rounded-t-3xl max-w-[80%] text-md ${
								!isMe
									? "rounded-br-3xl bg-[#F4F4F5]"
									: "rounded-bl-3xl bg-Primary-500 text-white"
							}`}>
							{content.type === "image" ? (
								<img
									src={content.url}
									alt="Uploaded media"
									loading="lazy"
									className={`max-w-full h-auto rounded-t-3xl ${
										!isMe ? "rounded-br-3xl" : "rounded-bl-3xl"
									}`}
								/>
							) : (
								<video
									controls
									className={`max-w-full h-auto rounded-t-3xl ${
										!isMe ? "rounded-br-3xl" : "rounded-bl-3xl"
									}`}>
									<source src={content.url} type="video/mp4" />
									Your browser does not support the video tag.
								</video>
							)}
						</div>
					</div>
					<p className={`text-[14px] mt-2 ${isMe ? "text-right" : ""}`}>
						{moment.duration(moment(time).diff(new Date())).humanize(true)}
					</p>
				</div>
			);
		case "info":
			return (
				<>
					<hr />
					<div className="w-full flex p-4">
						<img src="/assets/svgs/info.svg" className="h-[18px]" />
						<p className="px-3 text-xs">{content}</p>
					</div>
					<hr className="mb-4" />
				</>
			);
		default:
			return null;
	}
};

const TypingIndicator = ({ name }) => {
	return (
		<div className="w-full mt-4">
			<i className="italic px-4 py-2.5 text-gray-500 border-[1px] rounded-tl-3xl rounded-tr-3xl rounded-br-3xl">
				{name} is typing...
			</i>
		</div>
	);
};

const DemoChatMain = () => {
	const { id } = useParams(); // e.g. "guest-12345"
	const router = useRouter();

	const {
		sendMessage,
		messages,
		typingUsers,
		recipientName,
		recipientId,
		loading,
	} = useDemoChat();

	const chatContainerRef = useRef(null);

	// ─── Updated scroll‐to‐bottom effect ────────────────────────────────────
	useEffect(() => {
		const scrollToBottom = () => {
			const el = chatContainerRef.current;
			if (!el) return; // guard against null

			const { scrollHeight, clientHeight } = el;
			el.scrollTop =
				scrollHeight - clientHeight > 0 ? scrollHeight - clientHeight : 0;
		};

		scrollToBottom();
		const timeoutId = setTimeout(scrollToBottom, 100);
		return () => clearTimeout(timeoutId);
	}, [messages]);
	// ──────────────────────────────────────────────────────────────────────

	if (!id || !id.startsWith("guest-")) {
		return <p className="text-red-600 p-4">Invalid demo chat ID.</p>;
	}

	if (loading) {
		return <Spinner />;
	}

	return (
		<>
			<ChatHeader
				name={"Mia Khalifa"}
				status="online"
				avatar="/assets/svgs/backbutton.svg"
				url={recipientId}
			/>
			<hr className="mb-4" />
			<div
				className="flex flex-col flex-grow overflow-auto p-6 scroll-smooth"
				ref={chatContainerRef}>
				{messages.map((item) => (
					<ChatBubble
						key={`${item.time}_${item.id}`}
						isMe={item.isMe}
						type={item.type}
						content={item.content}
						time={item.time}
						isAI={item.isAI}
					/>
				))}
				{typingUsers.length > 0 && <TypingIndicator name={recipientName} />}
			</div>
			<hr />
			<ChatInput
				sendMessage={sendMessage}
				onEnter={(msg) => sendMessage(msg, "text")}
				recipientId={recipientId}
			/>
		</>
	);
};

export default DemoChatMain;

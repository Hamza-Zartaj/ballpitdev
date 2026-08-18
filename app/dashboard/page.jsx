"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthProvider";
import MenuBar from "../components/MenuBar";
import { Spinner } from "../components/Spinner";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { collection, getDocs, query, where } from "firebase/firestore";

const portfolioMode =
	process.env.NODE_ENV !== "production" &&
	process.env.NEXT_PUBLIC_PORTFOLIO_MODE === "true";

export default function Dashboard() {
	const router = useRouter();
	const { user, loading } = useAuth();
	const { updateUser } = useAuth();

	const [dashboardLoading, setDashboardLoading] = useState(true);
	const [totalChats, setTotalChats] = useState(0);
	const [linkCopied, setLinkCopied] = useState(false);
	const [avatar, setAvatar] = useState(null);

	// Derive the instant-chat bot link from the user's uid
	const botLink =
		typeof window !== "undefined" && user?.uid
			? `${window.location.origin}/instantChat/${user.uid}`
			: "";

	// Fetch avatar
	useEffect(() => {
		if (!user?.uid) return;
		if (portfolioMode) return;
		let active = true;

		(async () => {
			try {
				const res = await fetch(`/api/avatar?id=${user.uid}`);
				if (!res.ok) throw new Error("Avatar fetch failed");
				const data = await res.json();
				if (active) {
					setAvatar(data.avatar || null);
				}
			} catch (err) {
				console.error("Error fetching avatar:", err);
				if (active) {
					setAvatar(null);
				}
			}
		})();

		return () => {
			active = false;
		};
	}, [user?.uid]);

	// Redirect unauthenticated users
	useEffect(() => {
		if (!loading && !user) {
			router.push("/auth/signin");
		}
	}, [loading, user, router]);

	// Fetch dashboard data once user is available
	const fetchDashboardData = useCallback(async () => {
		if (!user?.uid) return;
		try {
			setDashboardLoading(true);
			if (portfolioMode) {
				setTotalChats(128);
				return;
			}

			const { firestore } = await import("../config/firebase");

			// 1) Fetch real chats where user is one of the participants
			const chatCol = collection(firestore, "chats");
			const realChatsQuery = query(
				chatCol,
				where("users", "array-contains", user.uid)
			);
			const realChatsSnap = await getDocs(realChatsQuery);
			const realChatsCount = realChatsSnap.size;

			// 2) Fetch demo chats created by this user (merged demochats)
			const demochatQuery = query(
				collection(firestore, "demochats"),
				where("creatorId", "==", user.uid)
			);
			const demochatSnap = await getDocs(demochatQuery);
			const demoChatsCount = demochatSnap.size;

			// 3) Set total chat count
			setTotalChats(realChatsCount + demoChatsCount);
		} catch (err) {
			console.error("Error loading dashboard:", err);
		} finally {
			setDashboardLoading(false);
		}
	}, [user?.uid]);

	useEffect(() => {
		fetchDashboardData();
	}, [fetchDashboardData]);

	// Copy bot link to clipboard
	const handleCopyLink = async () => {
		try {
			// Try modern Clipboard API first
			if (navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(botLink);
			} else {
				// Fallback for mobile and non-secure contexts
				const textArea = document.createElement("textarea");
				textArea.value = botLink;
				textArea.style.position = "fixed";
				textArea.style.left = "-999999px";
				textArea.style.top = "-999999px";
				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();
				
				const success = document.execCommand("copy");
				document.body.removeChild(textArea);
				
				if (!success) throw new Error("Copy failed");
			}
			
			setLinkCopied(true);
			toast.success("Link copied to clipboard!");
			setTimeout(() => setLinkCopied(false), 2000);
		} catch {
			toast.error("Failed to copy link");
		}
	};

	if (loading || dashboardLoading) {
		return <Spinner />;
	}

	return (
		<div className="flex flex-col h-dvh bg-white">
			{/* Header */}
			<div className="fixed top-0 left-0 right-0 z-50 flex justify-center">
				<div className="flex justify-between items-center w-full max-w-[528px] p-4 bg-white border-b border-zinc-200">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
							{avatar ? (
								typeof avatar === "string" ? (
									<img
										src={avatar}
										alt="Avatar"
										className="w-full h-full object-cover"
									/>
								) : avatar.downloadURL ? (
									<img
										src={avatar.downloadURL}
										alt="Avatar"
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-lg">
										{user?.name?.charAt(0)?.toUpperCase() || "U"}
									</div>
								)
							) : (
								<div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-lg">
									{user?.name?.charAt(0)?.toUpperCase() || "U"}
								</div>
							)}
						</div>
						<div>
							<p className="text-sm text-zinc-500">Welcome back</p>
							<p className="text-lg font-medium text-black leading-tight">
								{user?.name || "User"}
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Scrollable Content */}
			<div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 pb-24 pt-24">
				{/* Total Chats Stat Card */}
				<div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white shadow-lg">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-medium text-indigo-100">
								Total Chats
							</p>
							<p className="text-4xl font-bold mt-1">{totalChats}</p>
							<p className="text-xs text-indigo-200 mt-1">
								All-time conversations
							</p>
						</div>
						<button
							onClick={() => router.push("/chat/list")}
							className="w-14 h-14 rounded-2xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
						>
							<svg
								className="w-7 h-7 text-white"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
								/>
							</svg>
						</button>
					</div>
				</div>

				{/* Instant Chat Link */}
				<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
					<div className="flex items-center gap-2 mb-3">
						<svg
							className="w-5 h-5 text-indigo-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
							/>
						</svg>
						<h3 className="text-base font-semibold text-black">
							Instant Chat Link
						</h3>
					</div>
					<p className="text-sm text-zinc-500 mb-3">
						Share this link with leads to start an AI conversation.
					</p>
					<div className="flex items-center gap-2">
						<div className="flex-1 bg-zinc-100 rounded-xl px-4 py-3 text-sm text-zinc-700 truncate font-mono">
							{botLink || "Loading..."}
						</div>
						<button
							onClick={handleCopyLink}
							disabled={!botLink}
							className={`px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
								linkCopied
									? "bg-green-500 text-white"
									: "bg-indigo-600 text-white hover:bg-indigo-700"
							} disabled:opacity-50 disabled:cursor-not-allowed`}
						>
							{linkCopied ? "Copied!" : "Copy"}
						</button>
					</div>
				</div>

				{/* AI Control Center */}
				<div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
					<div className="flex items-center gap-2 mb-3">
						<svg
							className="w-5 h-5 text-indigo-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.59.659H9.06a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V17a2.25 2.25 0 01-2.25 2.25H7.25A2.25 2.25 0 015 17v-2.5"
							/>
						</svg>
						<h3 className="text-base font-semibold text-black">
							AI Control Center
						</h3>
					</div>
					<p className="text-sm text-zinc-500 mb-3">
						Configure your AI persona, personality, and conversation settings.
					</p>
					<button
						onClick={() => router.push("/persona")}
						className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-colors group"
					>
						<span className="text-sm font-medium text-zinc-800">
							Open AI Persona Settings
						</span>
						<svg
							className="w-5 h-5 text-zinc-400 group-hover:text-indigo-600 transition-colors"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							strokeWidth={2}
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</button>
				</div>
			</div>

			{/* Bottom Menu Bar */}
			<MenuBar />

			<ToastContainer
				position="top-center"
				autoClose={2000}
				hideProgressBar
				closeOnClick
			/>
		</div>
	);
}

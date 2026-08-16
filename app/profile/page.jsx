"use client";
import * as React from "react";
import { useEffect } from "react";
import MenuBar from "../components/MenuBar";
import { Content } from "./Content";
import { SettingsMenu } from "./SettingMenu";
import Header from "../components/Header";
import { Spinner } from "../components/Spinner";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthProvider";

export default function ProfileLayout() {
	const { user, loading } = useAuth(); // Get user data from Firebase (already fetched by AuthProvider)
	const router = useRouter();

	// Redirect to signin if not authenticated
	useEffect(() => {
		if (!loading && !user) {
			router.push("/auth/signin");
		}
	}, [loading, user, router]);

	// Set sessionStorage on mount
	useEffect(() => {
		if (!loading && user?.uid) {
			sessionStorage.setItem("profilesetting_tab", "basic");
		}
	}, [loading, user?.uid]);

	if (loading) {
		return <Spinner />;
	}

	if (!user) {
		return null; // Redirect handled by useEffect above
	}

	return (
		<div className="flex flex-col h-dvh bg-white">
			{/* Header */}
			<Header text="Profile" />

			{/* Body Section */}
			<div className="flex flex-col flex-grow overflow-hidden pt-[90px] pb-[70px]">
				{/* Scrollable Section - Content and Settings Menu in same flow */}
				<div className="flex-grow overflow-y-auto">
					{/* Content Section */}
					<div className="bg-white">
						<Content userData={user} />
					</div>

					<hr />

					{/* SettingsMenu Section */}
					<div className="mt-2">
						<SettingsMenu data={user} />
					</div>
				</div>
			</div>

			{/* Fixed MenuBar Section */}
			<MenuBar />
		</div>
	);
}

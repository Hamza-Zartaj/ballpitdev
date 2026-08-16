"use client";

import { useState, useEffect } from "react";
import { MenuItem } from "./MenuItem";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthProvider";
import { Spinner } from "../components/Spinner";

const menuItems = [
	{
		icon: "/assets/svgs/profile_setting.svg",
		title: "Profile Settings",
		description: "Manage how you are seen publicly",
		order: 1,
		hasArrow: true,
	},
	{
		icon: "/assets/svgs/ai-chat.svg",
		title: "AI Persona",
		description: "Customize your AI Persona",
		order: 2,
		hasArrow: true,
	},
	{
		icon: "/assets/svgs/policy.svg",
		title: "Billing & Subscription",
		description: "Manage your subscription and payment",
		order: 3,
		hasArrow: true,
	},
	{
		icon: "/assets/svgs/policy.svg",
		title: "Privacy Policy",
		description: "Read our Privacy Policy",
		order: 4,
		hasArrow: true,
	},
	{
		icon: "/assets/svgs/logout.svg",
		title: "Log Out",
		description: "Sign out from this device",
		order: 5,
		titleColor: "text-orange-400",
	},
	{
		icon: "/assets/svgs/delete.svg",
		title: "Delete Account",
		description: "Delete your Ballpitt Account",
		order: 6,
		titleColor: "text-red-500",
	},
];

export function SettingsMenu({ data }) {
	const router = useRouter();
	const { user, loading } = useAuth();

	if (loading || !user) {
		return <Spinner />;
	}

	const [creatorAvatar, setCreatorAvatar] = useState(user?.photoURL || "");
	const [avatarLoading, setAvatarLoading] = useState(true);

	// fetch your stored avatars & pick the “main” one
	useEffect(() => {
		if (!user?.uid) return;
		const fetchDefaultPhotos = async (uid) => {
			try {
				const response = await fetch(`/api/avatar?all=1&id=${uid}`);
				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(`HTTP ${response.status}: ${errorText}`);
				}
				const data = await response.json();
				// data.avatars is an array, data.main is the index
				setCreatorAvatar(data.avatars?.[data.main] || data.avatars?.[0] || user.photoURL);
			} catch (err) {
				console.error("Error fetching avatar:", err);
				setCreatorAvatar(user.photoURL);
			} finally {
				setAvatarLoading(false);
			}
		};

		fetchDefaultPhotos(user.uid);
	}, [user.uid, user.photoURL]);


	const handleClick = async (order) => {
		switch (order) {
			case 1:
				router.push("/profile/setting");
				break;
			case 2:
				router.push("/persona");
				break;
			case 3:
				router.push("/profile/billing");
				break;
			case 4:
				router.push("/policy");
				break;
			case 5:
				router.push("/profile/logout");
				break;
			case 6:
				router.push("/profile/delete");
				break;
			default:
				break;
		}
	};

		return (
		<div
			className={`
        flex flex-col justify-center items-center px-6 pt-[2vh] mb-5 w-full
        bg-white overflow-auto
      `}>
			<div className="flex flex-col w-full h-full overflow-y-auto">
				<div className="flex flex-col w-full">
                    {menuItems.map((item, index) =>
								<MenuItem
									key={item.order}
									icon={item.icon}
									title={item.title}
									description={item.description}
									hasArrow={item.hasArrow}
									titleColor={item.titleColor}
									className={`${index > 0 ? "mt-[2vh]" : ""}`}
									onClick={() => handleClick(item.order)}
								/>
					)}


				</div>
			</div>
		</div>
	);
}

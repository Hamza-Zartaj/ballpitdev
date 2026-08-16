"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import OnlineStatus from "./OnlineStatus";
import Header from "@/app/components/Header";
import Avatar from "@/app/components/AvatarPreview";
import { Spinner } from "@/app/components/Spinner";
import MenuBar from "@/app/components/MenuBar";

function ProfileView() {
	const { user } = useAuth(); // Get user from Firebase
	const [userData, setUserData] = useState(null); // State to store user data
	const [error, setError] = useState(null); // State for error handling
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	const [mediaType, setMediaType] = useState(null); // State to store the media type (image or video)
	const [mediaUrl, setMediaUrl] = useState(null); // State to store the media URL

	// Fetch user data from the API
	const fetchUserData = async (userId) => {
		try {
			const response = await fetch(`/api/users?id=${userId}`, {
				method: "GET",
			});

			if (!response.ok) {
				throw new Error("Failed to fetch user data");
			}

			const data = await response.json(); // Parse the JSON response
			setUserData(data); // Set user data in state

			// Fetch avatar
			const avatarresponse = await fetch(`/api/avatar?id=${userId}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});
			if (avatarresponse.ok) {
				const avatarData = await avatarresponse.json();
				const avatarObj = avatarData.avatar;
				
				// Check if avatar has downloadURL property (object) or is already a URL string
				if (avatarObj?.downloadURL) {
					setMediaUrl(avatarObj.downloadURL);
					setMediaType(avatarObj.type || "image");
				} else if (typeof avatarObj === 'string') {
					setMediaUrl(avatarObj);
					setMediaType("image");
				} else {
					setMediaUrl("/assets/images/temp.jfif");
					setMediaType("image");
				}
			} else {
				setMediaUrl("/assets/images/temp.jfif");
				setMediaType("image");
			}

			setLoading(false);
			setError(null); // Clear any errors
		} catch (err) {
			console.error("Error fetching user data:", err.message);
			setError(err.message); // Set error in state
			setLoading(false);
		}
	};

	// UseEffect to fetch user data when the user exists
	useEffect(() => {
		if (user?.uid) {
			fetchUserData(user.uid); // Fetch user data using user.uid
		}
	}, [user]);

	// Show error message if there's an error
	if (error) {
		return (
			<div className="flex flex-col h-dvh">
				<Header close={true} text="My Profile" />
				<div className="flex-grow flex items-center justify-center pt-[120px] pb-[80px]">
					<div className="text-red-500 text-center">Error: {error}</div>
				</div>
				<MenuBar />
			</div>
		);
	}

	// Show a loading state while userData is being fetched
	if (loading) {
		return <Spinner />;
	}

	return (
		<div className="flex flex-col h-dvh bg-white">
			{/* Header */}
			<Header close={true} text="My Profile" />

			{/* Profile Content */}
			<div className="flex-grow overflow-y-auto pt-[90px] pb-[80px]">
				{/* Avatar Section */}
				<div className="relative w-full bg-gradient-to-b from-[#EFEDFD] to-white">
					<div className="relative h-48 bg-[#EFEDFD]">
						<Avatar
							mediaType={mediaType}
							mediaUrl={mediaUrl}
							className="w-full h-full object-cover"
						/>
					</div>

					{/* Profile Info Card */}
					<div className="px-6 pt-6 pb-6">
						{/* Name */}
						<h1 className="text-3xl font-bold text-black mb-1">
							{userData?.name || "User"}
						</h1>

						{/* Email */}
						{userData?.email && (
							<div className="flex items-center gap-2 mb-3">
								<img src="/assets/svgs/mail.svg" alt="Email" className="w-4 h-4" />
								<p className="text-sm text-gray-600">{userData.email}</p>
							</div>
						)}

						{/* Phone */}
						{userData?.phoneNumber && (
							<div className="flex items-center gap-2 mb-3">
								<img src="/assets/svgs/phone.svg" alt="Phone" className="w-4 h-4" />
								<p className="text-sm text-gray-600">{userData.phoneNumber}</p>
							</div>
						)}

						{/* Location/Business URL */}
						{userData?.businessUrl && (
							<div className="flex items-center gap-2 mb-3">
								<img src="/assets/svgs/globe.svg" alt="Website" className="w-4 h-4" />
								<a
									href={userData.businessUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm text-indigo-600 hover:underline truncate">
									{userData.businessUrl}
								</a>
							</div>
						)}

						{/* Divider */}
						<hr className="my-4" />

						{/* Qualification Criteria */}
						{userData?.qualificationCriteria && (
							<div className="mb-4">
								<h3 className="text-sm font-semibold text-gray-800 mb-1">
									Qualification Criteria
								</h3>
								<p className="text-sm text-gray-600">
									{userData.qualificationCriteria}
								</p>
							</div>
						)}

						{/* Verification Status */}
						<div className="mb-4">
							<h3 className="text-sm font-semibold text-gray-800 mb-2">
								Verification Status
							</h3>
							<div className="space-y-1">
								<p className="text-xs text-gray-600 flex items-center gap-2">
									{userData?.emailVerified ? (
										<span className="w-2 h-2 bg-green-500 rounded-full"></span>
									) : (
										<span className="w-2 h-2 bg-gray-300 rounded-full"></span>
									)}
									Email: {userData?.emailVerified ? "Verified" : "Not Verified"}
								</p>
								<p className="text-xs text-gray-600 flex items-center gap-2">
									{userData?.phoneVerified ? (
										<span className="w-2 h-2 bg-green-500 rounded-full"></span>
									) : (
										<span className="w-2 h-2 bg-gray-300 rounded-full"></span>
									)}
									Phone: {userData?.phoneVerified ? "Verified" : "Not Verified"}
								</p>
							</div>
						</div>

						{/* SMS Phone */}
						{userData?.smsPhone && (
							<div className="mb-4">
								<h3 className="text-sm font-semibold text-gray-800 mb-1">
									SMS Forwarding
								</h3>
								<p className="text-xs text-gray-600">{userData.smsPhone}</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Footer MenuBar */}
			<MenuBar />
		</div>
	);
}

export default ProfileView;

"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Spinner } from "../components/Spinner";

export function Content({ userData }) {
	const router = useRouter();
	const fileInputRef = useRef(null);
	const [uploading, setUploading] = useState(false);
	
	const Preview = () => {
		router.push("/profile/preview");
	};
	
	const [loading, setLoading] = useState(true);
    const [mediaType, setMediaType] = useState("image"); // default to image so page doesn't block
    const [mediaUrl, setMediaUrl] = useState("/assets/images/temp.jfif"); // default placeholder
	// Fetch the image from Firebase Storage when the component is rendered
	useEffect(() => {
        if (!userData?.uid) {
            setLoading(false);
            return;
        }
		let mounted = true;
		(async () => {
			try {
				const res = await fetch(`/api/avatar?id=${userData.uid}`);
				const { avatar } = await res.json();
				
                if (mounted) {
                    if (avatar?.downloadURL) setMediaUrl(avatar.downloadURL);
                    if (avatar?.type) setMediaType(avatar.type);
                }
			} catch (e) {
				console.error(e);
			} finally {
				if (mounted) setLoading(false);
			}
        })();
		return () => {
			mounted = false;
		};
	}, [userData?.uid]); // ← ONLY uid in the dep list

	// Handle avatar file selection and upload
	const handleAvatarUpload = async (file) => {
		if (!file || !userData?.uid) {
			console.error("File or user ID missing");
			return;
		}

		// Validate file type
		if (!file.type.startsWith("image/")) {
			alert("Only image files are allowed");
			return;
		}

		// Validate file size (max 2MB)
		if (file.size > 2 * 1024 * 1024) {
			alert("Image size must be less than 2MB");
			return;
		}

		try {
			setUploading(true);
				const [{ getDownloadURL, ref, uploadBytes }, { storage, firestore }, { doc, setDoc, getDoc }] = await Promise.all([
					import("firebase/storage"),
					import("../config/firebase"),
					import("firebase/firestore"),
				]);
			const fileName = `${userData.uid}_main_avatar`;
			const storageRef = ref(storage, `profileimages/${fileName}`);

			// Upload file to Firebase Storage (overwrites existing automatically)
			const snapshot = await uploadBytes(storageRef, file);
			const downloadURL = await getDownloadURL(snapshot.ref);

			// Add cache-busting timestamp to avoid stale images
			const cachedURL = downloadURL + "?t=" + Date.now();

			// Update Firestore with new avatar
			const photoRef = doc(firestore, "photos", userData.uid);
			const photoSnap = await getDoc(photoRef);

			const avatarData = [{ downloadURL: cachedURL, type: "image" }];

			await setDoc(photoRef, { avatar: avatarData, main: "0" }, { merge: true });

			// Update UI
			setMediaUrl(cachedURL);
			setMediaType("image");
		} catch (error) {
			console.error("Error uploading avatar:", error);
			alert("Failed to upload avatar. Please try again.");
		} finally {
			setUploading(false);
		}
	};

	const handleFileInputChange = (e) => {
		const file = e.target.files?.[0];
		if (file) {
			handleAvatarUpload(file);
		}
		// Reset the input so the same file can be selected again
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const triggerFileInput = () => {
		fileInputRef.current?.click();
	};

    if (loading) {
        return <Spinner />;
    }

	if (mediaType === "image") {
		return (
			<div className="flex flex-col overflow-hidden w-full bg-white border-zinc-200">
				{/* Hidden file input */}
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={handleFileInputChange}
					className="hidden"
				/>
				{/* Header Section */}
				<div className="flex overflow-hidden flex-col items-center justify-center w-full p-6 gap-4">
					{/* Avatar Section */}
					<div className="relative flex items-center justify-center">
						<Image
							src={mediaUrl || "/assets/images/temp.jfif"}
							alt="Profile"
							width={90}
							height={90}
							priority
							className="rounded-full outline outline-[3px] outline-[#5B49EF] border-[3px] border-white object-cover"
						/>
						<button
							onClick={triggerFileInput}
							disabled={uploading}
							className={`absolute w-8 h-8 bottom-0 right-0 z-40 cursor-pointer ${uploading ? "opacity-50" : ""}`}
							title="Upload avatar"
						>
							<img
								src="/assets/icon_plus.png"
								alt="Upload avatar"
								className="w-full h-full"
							/>
						</button>
					</div>

					{/* Name Section */}
					<div className="text-xl tracking-tight leading-tight text-black">
						{userData?.name || "Guest"}
					</div>

					{/* Preview Button */}
					<button
						className="flex items-center gap-2 text-base tracking-normal leading-none text-indigo-600"
						onClick={Preview}
					>
						<div className="px-2">Preview my profile</div>
						<Image
							src="/assets/svgs/next_profile.svg"
							width="20"
							height="20"
							alt=""
							className="w-5 h-5"
						/>
					</button>
				</div>
			</div>
		);
	}

	// Fallback for non-image media types
	return <div className="flex items-center justify-center w-full h-96 bg-gray-100 text-gray-500">No media available</div>;
}
"use client";
import { useState, useEffect } from "react";
import { DeleteButton, CancelButton } from "./ActionButtons";
import { useRouter } from "next/navigation";
import {
	EmailAuthProvider,
	reauthenticateWithCredential,
	signInWithCredential,
} from "firebase/auth";
import Modal from "@/app/components/Modal";
import { Spinner } from "@/app/components/Spinner";
import { auth } from "@/app/config/firebase";
import { useNewNotification } from "@/app/contexts/NewNotificationProvider";
import { useAuth } from "@/app/contexts/AuthProvider";
import { firebaseSignOut } from "@/app/utils/firebase/firebaseAuth";

function DeleteAccountModal() {
	const router = useRouter();
	const [showPassword, setShowPassword] = useState(false);
	const [password, setPassword] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [deleting, setDeleting] = useState(false);
	const { showNotification } = useNewNotification();
	const { user, loading } = useAuth();

	useEffect(() => {
		if (!loading && !user) {
			router.push("/auth/signin");
		}
	}, [loading, user, router]);

	const togglePasswordVisibility = () => {
		setShowPassword((prevState) => !prevState);
	};

	const handlePasswordChange = (e) => {
		const value = e.target.value;
		setPassword(value);
	};

	if (loading) return <Spinner />;

	const handleDelete = async () => {
		try {
			setDeleting(true);
			if (password.length === 0) {
				setPasswordError("Password is required");
				return;
			}
			setPasswordError("");
			
			// Verify password by signing in with credentials
			await signInWithCredential(
				auth,
				EmailAuthProvider.credential(user.email, password)
			);
			
			// Call backend to delete user from Auth and Firestore
			const response = await fetch(`/api/users?id=${user.uid}`, {
				method: "DELETE",
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to delete account");
			}
			
			// Backend has deleted from Firebase Auth, now sign out
			await firebaseSignOut();
			router.push("/auth/signin");
		} catch (e) {
			if (e.code === "auth/invalid-credential") {
				showNotification("Incorrect password. Try again.", "error");
				setPasswordError("Incorrect password.");
			} else {
				showNotification(e.message || "Error deleting account", "error");
				console.error("Delete account error:", e);
			}
		} finally {
			setDeleting(false);
		}
	};

	const handleCancel = () => {
		router.push("/profile");
	};

	return (
		<div
			className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
			role="dialog"
			aria-labelledby="delete-account-title"
			aria-describedby="delete-account-description">
			<Modal
				isOpen={true}
				overlayClassName=""
				noCloseButton={true}
				onClose={handleCancel}
				animationDuration="0.3s">
				<div className="flex flex-col w-full max-w-[500px] bg-white rounded-[32px] p-8">
					{/* Icon */}
					<div className="flex justify-center mb-4">
						<img
							loading="lazy"
							src="/assets/images/valentine_broken_heart.webp"
							alt="Delete account"
							className="object-contain w-16 h-16 scale-125 rotate-[-10deg]"
						/>
					</div>

					{/* Title and Description */}
					<div className="mb-6 text-center">
						<h1 className="text-2xl font-bold mb-2">Delete your account?</h1>
						<p className="text-sm text-gray-600 leading-relaxed">
							Are you sure you want to delete your account? This action is permanent
							and cannot be undone. If you're certain, please confirm your decision
							and enter your password.
						</p>
					</div>

					{/* Password Input */}
					<div className="mb-6 w-full">
						<label className="block font-semibold text-sm text-black mb-2">
							Password:
						</label>
						<div className="relative">
							<input
								type={showPassword ? "text" : "password"}
								placeholder="Enter your Password"
								value={password}
								onChange={handlePasswordChange}
								className={`w-full py-3 px-4 border-2 ${
									passwordError && password.length !== 0
										? "border-red-500"
										: "border-[#E5E5E5]"
								} rounded-full text-base focus:border-Primary-500 focus:outline-none`}
							/>
							<img
								src={
									showPassword ? "/assets/svgs/view-off.svg" : "/assets/svgs/view.svg"
								}
								alt="Toggle visibility"
								className="absolute top-1/2 right-4 transform -translate-y-1/2 cursor-pointer w-5 h-5"
								onClick={togglePasswordVisibility}
							/>
						</div>
						{passwordError && (
							<p className="text-red-500 text-xs mt-1">{passwordError}</p>
						)}
					</div>

					{/* Buttons */}
					<div className="flex gap-3 w-full">
						<DeleteButton loading={deleting} onClick={handleDelete} />
						<CancelButton onClick={handleCancel} />
					</div>
				</div>
			</Modal>
		</div>
	);
}

export default DeleteAccountModal;

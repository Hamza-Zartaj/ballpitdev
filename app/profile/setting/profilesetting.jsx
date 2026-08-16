import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthProvider";
import { Spinner } from "@/app/components/Spinner";
import Button from "@/app/components/Button";

const ProfileSetting = () => {
	const router = useRouter();
	const { user, updateUser } = useAuth();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [successMessage, setSuccessMessage] = useState(null);
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phoneNumber: "",
		businessUrl: "",
		qualificationCriteria: "",
		notificationstate: false,
	});
	const [showPasswordForm, setShowPasswordForm] = useState(false);
	const [passwordData, setPasswordData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	useEffect(() => {
		if (user) {
			setFormData({
				name: user.name || "",
				email: user.email || "",
				phoneNumber: user.phoneNumber || "",
				businessUrl: user.businessUrl || "",
				qualificationCriteria: user.qualificationCriteria || "",
				notificationstate: user.notificationstate || false,
			});
		}
	}, [user]);

	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
		setError(null);
	};

	const handlePasswordChange = (e) => {
		const { name, value } = e.target;
		setPasswordData((prev) => ({
			...prev,
			[name]: value,
		}));
		setError(null);
	};

	const handleSaveProfile = async () => {
		try {
			setLoading(true);
			setSuccessMessage(null);
			setError(null);

			const response = await fetch(`/api/users?id=${user.uid}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to update profile");
			}

			const updatedUser = await response.json();
			updateUser(updatedUser);
			setSuccessMessage("Profile updated successfully!");
			setTimeout(() => setSuccessMessage(null), 3000);
		} catch (err) {
			console.error("Error updating profile:", err);
			setError(err.message || "Failed to update profile");
		} finally {
			setLoading(false);
		}
	};

	const handleChangePassword = async () => {
		try {
			setLoading(true);
			setSuccessMessage(null);
			setError(null);

			if (passwordData.newPassword !== passwordData.confirmPassword) {
				throw new Error("Passwords do not match");
			}

			if (passwordData.newPassword.length < 6) {
				throw new Error("Password must be at least 6 characters");
			}

			const response = await fetch(`/api/auth/change-password`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId: user.uid,
					currentPassword: passwordData.currentPassword,
					newPassword: passwordData.newPassword,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to change password");
			}

			setSuccessMessage("Password changed successfully!");
			setPasswordData({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
			setShowPasswordForm(false);
			setTimeout(() => setSuccessMessage(null), 3000);
		} catch (err) {
			console.error("Error changing password:", err);
			setError(err.message || "Failed to change password");
		} finally {
			setLoading(false);
		}
	};

	if (!user) {
		return <Spinner />;
	}

	return (
		<div className="w-full p-6 overflow-y-auto flex-1" style={{ color: "#171717" }}>
			{/* Success Message */}
			{successMessage && (
				<div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
					<p className="text-green-800">{successMessage}</p>
				</div>
			)}

			{/* Error Message */}
			{error && (
				<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
					<p className="text-red-800">{error}</p>
				</div>
			)}

			{/* Profile Information Section */}
			<div className="space-y-6">
				<div>
					<h2 className="text-2xl font-cabinet font-bold mb-6" style={{ color: "#171717" }}>Profile Settings</h2>

					{/* Name */}
					<div className="mb-4">
						<label className="block text-sm font-medium mb-1" style={{ color: "#171717" }}>
							Name
						</label>
						<input
							type="text"
							name="name"
							value={formData.name}
							onChange={handleInputChange}
							className="w-full px-4 py-2 border border-grey-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Enter your name"
						/>
					</div>

					{/* Email */}
					<div className="mb-4">
						<label className="block text-sm font-medium mb-1" style={{ color: "#171717" }}>
							Email
						</label>
						<input
							type="email"
							name="email"
							value={formData.email}
							onChange={handleInputChange}
							className="w-full px-4 py-2 border border-grey-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Enter your email"
						/>
					</div>

					{/* Phone Number */}
					<div className="mb-4">
						<label className="block text-sm font-medium mb-1" style={{ color: "#171717" }}>
							Phone Number
						</label>
						<input
							type="tel"
							name="phoneNumber"
							value={formData.phoneNumber}
							onChange={handleInputChange}
							className="w-full px-4 py-2 border border-grey-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Enter your phone number"
						/>
					</div>

					{/* Business URL */}
					<div className="mb-4">
						<label className="block text-sm font-medium mb-1" style={{ color: "#171717" }}>
							Business URL
						</label>
						<input
							type="url"
							name="businessUrl"
							value={formData.businessUrl}
							onChange={handleInputChange}
							className="w-full px-4 py-2 border border-grey-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="https://example.com"
						/>
					</div>

					{/* Qualification Criteria */}
					<div className="mb-4">
						<label className="block text-sm font-medium mb-1" style={{ color: "#171717" }}>
							Qualification Criteria
						</label>
						<textarea
							name="qualificationCriteria"
							value={formData.qualificationCriteria}
							onChange={handleInputChange}
							className="w-full px-4 py-2 border border-grey-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Describe your qualifications"
							rows="4"
						/>
					</div>

					{/* Notifications */}
					<div className="mb-6">
						<label className="flex items-center">
							<input
								type="checkbox"
								name="notificationstate"
								checked={formData.notificationstate}
								onChange={handleInputChange}
								className="w-4 h-4 text-blue-600 border border-grey-300 rounded focus:ring-2 focus:ring-blue-500"
							/>
						<span className="ml-2 text-sm font-medium" style={{ color: "#171717" }}>
								Enable Notifications
							</span>
						</label>
					</div>

					{/* Save Profile Button */}
					<div className="mb-8">
						<Button
							onClick={handleSaveProfile}
							disabled={loading}
							className="w-full"
						>
							{loading ? "Saving..." : "Save Profile"}
						</Button>
					</div>
				</div>

				{/* Password Change Section */}
				<div className="border-t-2 border-grey-200 pt-6">
					<h3 className="text-lg font-cabinet font-bold mb-4" style={{ color: "#171717" }}>Security</h3>

					{!showPasswordForm ? (
						<button
							onClick={() => setShowPasswordForm(true)}
							className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
						>
							Change Password
						</button>
					) : (
						<div>
							<div className="mb-4">
								<label className="block text-sm font-medium mb-1" style={{ color: "#171717" }}>
									Current Password
								</label>
								<input
									type="password"
									name="currentPassword"
									value={passwordData.currentPassword}
									onChange={handlePasswordChange}
									className="w-full px-4 py-2 border border-grey-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="Enter current password"
								/>
							</div>

							<div className="mb-4">
								<label className="block text-sm font-medium mb-1" style={{ color: "#171717" }}>
									New Password
								</label>
								<input
									type="password"
									name="newPassword"
									value={passwordData.newPassword}
									onChange={handlePasswordChange}
									className="w-full px-4 py-2 border border-grey-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="Enter new password"
								/>
							</div>

							<div className="mb-4">
								<label className="block text-sm font-medium mb-1" style={{ color: "#171717" }}>
									Confirm Password
								</label>
								<input
									type="password"
									name="confirmPassword"
									value={passwordData.confirmPassword}
									onChange={handlePasswordChange}
									className="w-full px-4 py-2 border border-grey-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="Confirm new password"
								/>
							</div>

							<div className="flex gap-3">
								<button
									onClick={handleChangePassword}
									disabled={loading}
									className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
								>
									{loading ? "Updating..." : "Update Password"}
								</button>
								<button
									onClick={() => setShowPasswordForm(false)}
									className="flex-1 px-4 py-2 bg-grey-300 rounded-lg hover:bg-grey-400 transition-colors font-medium"
									style={{ color: "#171717" }}
								>
									Cancel
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default ProfileSetting;

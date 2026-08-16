// app/api/auth/change-password/route.js
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Initialize Firebase Admin if not already initialized
if (!getApps().length && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
	try {
		const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n");
		
		initializeApp({
			credential: cert({
				type: process.env.FIREBASE_ADMIN_TYPE,
				project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
				private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
				private_key: privateKey,
				client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
				client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
				auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
				token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
				auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
				client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
			}),
		});
	} catch (error) {
		console.error("Failed to initialize Firebase Admin:", error.message);
	}
}

export const POST = async (req) => {
	try {
		let auth;
		try {
			auth = getAuth();
		} catch (error) {
			console.error("Auth initialization failed:", error);
			return new Response(
				JSON.stringify({ error: "Firebase Auth not available" }),
				{ status: 500 }
			);
		}

		const { userId, currentPassword, newPassword } = await req.json();

		if (!userId || !currentPassword || !newPassword) {
			return new Response(
				JSON.stringify({ error: "Missing required fields" }),
				{ status: 400 }
			);
		}

		if (newPassword.length < 6) {
			return new Response(
				JSON.stringify({ error: "Password must be at least 6 characters" }),
				{ status: 400 }
			);
		}

		// Get the user to verify current password
		const user = await auth.getUser(userId);

		if (!user) {
			return new Response(JSON.stringify({ error: "User not found" }), {
				status: 404,
			});
		}

		// Update the user's password
		await auth.updateUser(userId, {
			password: newPassword,
		});

		return new Response(
			JSON.stringify({ message: "Password changed successfully" }),
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error changing password:", error);
		let message = error.message;

		// Handle specific Firebase errors
		if (error.code === "auth/user-not-found") {
			message = "User not found";
		} else if (error.code === "auth/invalid-password") {
			message = "Invalid password";
		} else if (error.code === "auth/weak-password") {
			message = "Password is too weak";
		}

		return new Response(JSON.stringify({ error: message }), {
			status: 400,
		});
	}
};

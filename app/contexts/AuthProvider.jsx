"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../config/firebase";
import {
	onAuthStateChanged,
	setPersistence,
	browserLocalPersistence,
} from "firebase/auth";
import { Spinner } from "../components/Spinner";

const AuthContext = createContext({});

const _AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isHydrated, setIsHydrated] = useState(false);
	const [otpConfirm, setOtpConfirm] = useState(null);

	const updateUser = (updatedFields) => {
		setUser((prevUser) => ({
			...prevUser,
			...updatedFields,
		}));
	};

	// Handle hydration
	useEffect(() => {
		setIsHydrated(true);
	}, []);

	useEffect(() => {
		const initializeAuthState = async () => {
			try {
				await setPersistence(auth, browserLocalPersistence);
				const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
					if (firebaseUser) {
						try {
							// Fetch user data from Firestore
							const response = await fetch(`/api/users?id=${firebaseUser.uid}`, {
								method: "GET",
								headers: {
									"Content-Type": "application/json",
								},
							});

							if (!response.ok) {
								console.error("Failed to fetch user data, status:", response.status);
								setUser({
									uid: firebaseUser.uid,
									email: firebaseUser.email,
									displayName: firebaseUser.displayName,
									photoURL: firebaseUser.photoURL,
									emailVerified: firebaseUser.emailVerified,
									isAnonymous: firebaseUser.isAnonymous,
									name: firebaseUser.displayName || "User",
									businessUrl: "",
									qualificationCriteria: "",
									phoneNumber: null,
									smsPhone: null,
									notificationstate: true,
									personaSetting: null,
									providerData: firebaseUser.providerData,
								});
								setLoading(false);
								return;
							}

							const userData = await response.json();
							const sessionUser = {
								uid: firebaseUser.uid,
								email: firebaseUser.email,
								displayName: firebaseUser.displayName,
								photoURL: firebaseUser.photoURL,
								emailVerified: firebaseUser.emailVerified,
								isAnonymous: firebaseUser.isAnonymous,
								name: userData.name,
								businessUrl: userData.businessUrl || userData.hope || "",
								qualificationCriteria: userData.qualificationCriteria || userData.description || "",
								phoneNumber: userData.phoneNumber,
								smsPhone: userData.smsPhone,
								notificationstate: userData.notificationstate,
								personaSetting: userData.personaSetting,
								providerData: firebaseUser.providerData,
							};
							setUser(sessionUser);
						} catch (error) {
							console.error("Error setting user:", error);
							setUser(null);
						}
					} else {
						setUser(null);
					}
					setLoading(false);
				});

				return () => unsubscribe();
			} catch (error) {
				console.error("Failed to set persistence:", error);
				setLoading(false);
			}
		};

		initializeAuthState();
	}, []);

	// Don't render anything until hydration is complete to avoid hydration mismatch
	if (!isHydrated) {
		return null;
	}

	if (loading) {
		return <Spinner />;
	}

	return (
		<AuthContext.Provider
			value={{ user, loading, otpConfirm, setOtpConfirm, updateUser }}>
			{children}
		</AuthContext.Provider>
	);
};

export const AuthProvider = ({ children }) => {
	return <_AuthProvider>{children}</_AuthProvider>;
};

export const useAuth = () => useContext(AuthContext);

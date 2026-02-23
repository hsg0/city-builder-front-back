import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { authSuccess } from "../reduxToolKit/reduxState/globalState/authSlice";
import { getToken, getUser } from "../services/secureStore";

/**
 * AppInitializer - Restores auth state from secure storage on app launch
 * This component runs early in the app lifecycle to restore persisted auth data
 */
export default function AppInitializer({ children }) {
	const dispatch = useDispatch();

	useEffect(() => {
		const restoreAuthState = async () => {
			try {
				console.log("🔍 Attempting to restore auth state from secure storage...");
				const token = await getToken();
				const user = await getUser();

				if (token && user) {
					console.log("✅ Auth state restored from secure storage");
					dispatch(
						authSuccess({
							token,
							user,
						})
					);
				} else {
					console.log("ℹ️ No persisted auth state found");
				}
			} catch (error) {
				console.error("❌ Error restoring auth state:", error);
			}
		};

		restoreAuthState();
	}, [dispatch]);

	return children;
}

import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  authStart,
  authSuccess,
  authFail,
} from "../reduxToolKit/reduxState/globalState/authSlice";
import { getToken, getUser } from "../services/secureStore";

/**
 * AppInitializer - Restores auth state from secure storage on app launch.
 *
 * Dispatches authStart() FIRST so that authLoading = true while the async
 * restore is in flight.  PrivateSecurityLayout checks authLoading and waits
 * instead of immediately redirecting to login.
 */
export default function AppInitializer({ children }) {
	const dispatch = useDispatch();

	useEffect(() => {
		const restoreAuthState = async () => {
			try {
				// Signal that auth restore is in progress
				dispatch(authStart());

				console.log("🔍 Attempting to restore auth state from secure storage...");
				const token = await getToken();
				const user = await getUser();

				if (token && user) {
					console.log("✅ Auth state restored from secure storage");
					dispatch(authSuccess({ token, user }));
				} else {
					console.log("ℹ️ No persisted auth state found");
					// Clear loading flag — no stored credentials
					dispatch(authFail(null));
				}
			} catch (error) {
				console.error("❌ Error restoring auth state:", error);
				dispatch(authFail("Failed to restore auth state"));
			}
		};

		restoreAuthState();
	}, [dispatch]);

	return children;
}

import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

/**
 * Save authentication token to secure storage
 * @param {string} token - JWT token to save
 * @returns {Promise<void>}
 */
export const saveToken = async (token) => {
	try {
		if (token) {
			await SecureStore.setItemAsync(TOKEN_KEY, token);
		}
	} catch (error) {
		console.error("Error saving token to secure store:", error);
		throw error;
	}
};

/**
 * Save user data to secure storage
 * @param {object} user - User object to save
 * @returns {Promise<void>}
 */
export const saveUser = async (user) => {
	try {
		if (user) {
			await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
		}
	} catch (error) {
		console.error("Error saving user to secure store:", error);
		throw error;
	}
};

/**
 * Retrieve token from secure storage
 * @returns {Promise<string|null>} - The stored token or null if not found
 */
export const getToken = async () => {
	try {
		const token = await SecureStore.getItemAsync(TOKEN_KEY);
		return token || null;
	} catch (error) {
		console.error("Error retrieving token from secure store:", error);
		return null;
	}
};

/**
 * Retrieve user data from secure storage
 * @returns {Promise<object|null>} - The stored user object or null if not found
 */
export const getUser = async () => {
	try {
		const userJson = await SecureStore.getItemAsync(USER_KEY);
		return userJson ? JSON.parse(userJson) : null;
	} catch (error) {
		console.error("Error retrieving user from secure store:", error);
		return null;
	}
};

/**
 * Delete token from secure storage
 * @returns {Promise<void>}
 */
export const deleteToken = async () => {
	try {
		await SecureStore.deleteItemAsync(TOKEN_KEY);
	} catch (error) {
		console.error("Error deleting token from secure store:", error);
		throw error;
	}
};

/**
 * Delete user data from secure storage
 * @returns {Promise<void>}
 */
export const deleteUser = async () => {
	try {
		await SecureStore.deleteItemAsync(USER_KEY);
	} catch (error) {
		console.error("Error deleting user from secure store:", error);
		throw error;
	}
};

/**
 * Clear all authentication data from secure storage
 * @returns {Promise<void>}
 */
export const clearAuthData = async () => {
	try {
		await Promise.all([deleteToken(), deleteUser()]);
	} catch (error) {
		console.error("Error clearing auth data from secure store:", error);
		throw error;
	}
};

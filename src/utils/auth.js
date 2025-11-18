/**
 * Authentication utilities
 */

const AUTH_KEY = "authenticated";
const USERNAME_KEY = "username";

/**
 * Check if user is authenticated
 * Verifies with server to ensure session is still valid
 */
export const isAuthenticated = async () => {
  // Check local storage first
  const localAuth = sessionStorage.getItem(AUTH_KEY);
  if (localAuth !== "true") {
    return false;
  }

  // Verify with server
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "";
    let authUrl;
    
    if (apiUrl) {
      const baseUrl = apiUrl.replace(/\/+$/, "");
      authUrl = `${baseUrl}/auth.php`;
    } else {
      authUrl = "/auth.php";
    }

    const response = await fetch(authUrl, {
      method: "GET",
      credentials: "include", // Important for session cookies
    });

    const data = await response.json();

    if (response.ok && data.success && data.data?.authenticated) {
      return true;
    } else {
      // Session expired or invalid
      clearAuth();
      return false;
    }
  } catch (error) {
    console.error("Auth check error:", error);
    // On error, check local storage as fallback
    return localAuth === "true";
  }
};

/**
 * Get stored username
 */
export const getUsername = () => {
  return sessionStorage.getItem(USERNAME_KEY) || "admin";
};

/**
 * Clear authentication
 */
export const clearAuth = () => {
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(USERNAME_KEY);
};

/**
 * Logout user
 */
export const logout = async () => {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || "";
    let authUrl;
    
    if (apiUrl) {
      const baseUrl = apiUrl.replace(/\/+$/, "");
      authUrl = `${baseUrl}/auth.php`;
    } else {
      authUrl = "/auth.php";
    }

    await fetch(authUrl, {
      method: "DELETE",
      credentials: "include",
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    clearAuth();
    window.location.href = "/";
  }
};




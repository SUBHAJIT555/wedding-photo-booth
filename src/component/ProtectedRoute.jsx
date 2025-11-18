import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";
import Login from "../pages/Login";
import PropTypes from "prop-types";

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      setIsAuth(authenticated);
      setIsChecking(false);
    };

    checkAuth();
  }, [location]);

  if (isChecking) {
    // Show loading state while checking
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e91e63] mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    // Not authenticated, show login page
    return <Login />;
  }

  // Authenticated, render protected content
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;



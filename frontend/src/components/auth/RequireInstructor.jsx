import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * RequireInstructor Component - Moderator/Admin Role Route Wrapper
 * 
 * Protects routes that require moderator or admin privileges.
 * Checks both authentication state and user role (MODERATOR or ADMIN).
 * Redirects non-moderators to home page and unauthenticated users to login.
 * Handles loading state to prevent premature redirects during auth context initialization.
 * 
 * @returns {React.Element} Outlet component if moderator/admin, Navigate to home if not, Navigate to login if not authenticated, or loading indicator
 */

const RequireInstructor = () => {
  const { isAuthenticated, canModerate, isLoading } = useAuth();

  // Show loading state while auth context is initializing
  // This prevents premature redirects on page reloads
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to home if authenticated but not a moderator/admin
  if (!canModerate) {
    return <Navigate to="/" replace />;
  }

  // Render child routes if user has moderator or admin role
  return <Outlet />;
};

export default RequireInstructor;

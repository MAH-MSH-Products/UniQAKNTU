import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * RequireAuth Component - Authentication Route Wrapper
 * 
 * Protects routes that require user authentication.
 * Checks authentication state and redirects unauthenticated users to login page.
 * Handles loading state to prevent premature redirects during auth context initialization.
 * 
 * @returns {React.Element} Outlet component if authenticated, Navigate to login if not, or loading indicator
 */

const RequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();

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

  // Render child routes if authenticated
  return <Outlet />;
};

export default RequireAuth;

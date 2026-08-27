import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * RequireAdmin Component - Admin-Only Route Wrapper
 * 
 * Protects routes that require ADMIN privileges only.
 * Checks both authentication state and user role (ADMIN).
 * Redirects non-admins to home page and unauthenticated users to login.
 * Handles loading state to prevent premature redirects during auth context initialization.
 * 
 * @returns {React.Element} Outlet component if admin, Navigate to home if not, Navigate to login if not authenticated, or loading indicator
 */

const RequireAdmin = () => {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

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

  // Redirect to home if authenticated but not an admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Render child routes if user has admin role
  return <Outlet />;
};

export default RequireAdmin;

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * RequireInstructor Component - Instructor Role Route Wrapper
 * 
 * Protects routes that require instructor privileges.
 * Checks both authentication state and instructor role status.
 * Redirects non-instructors to home page and unauthenticated users to login.
 * Handles loading state to prevent premature redirects during auth context initialization.
 * 
 * @returns {React.Element} Outlet component if instructor, Navigate to home if not instructor, Navigate to login if not authenticated, or loading indicator
 */

const RequireInstructor = () => {
  const { isAuthenticated, isInstructor, isLoading } = useAuth();

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

  // Redirect to home if authenticated but not an instructor
  if (!isInstructor) {
    return <Navigate to="/" replace />;
  }

  // Render child routes if user is a verified instructor
  return <Outlet />;
};

export default RequireInstructor;

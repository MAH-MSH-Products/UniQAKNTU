import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

/**
 * AuthLayout Component - Authentication Pages Layout Wrapper
 * 
 * Provides a minimal layout wrapper specifically for authentication pages (Login/Register).
 * Includes only the Navbar component at the top, followed by the page content via Outlet.
 * Excludes Sidebar, WidgetsPanel, and Footer to maintain focus on authentication flow.
 * The Navbar dynamically adapts its styling when rendered within this layout to blend
 * with the gradient backgrounds of auth pages using glassmorphism effects.
 */

const AuthLayout = () => {
  return (
    <div className="auth-layout-wrapper">
      <Navbar />
      <main className="auth-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AuthLayout;

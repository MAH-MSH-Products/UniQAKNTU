import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

/**
 * MainLayout Component - Application Shell
 * 
 * Wrapper component that provides the main application structure.
 * Includes Navbar, Sidebar, and main content area with Outlet for routing.
 */

const MainLayout = () => {
  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
      {/* Top Navigation Bar */}
      <Navbar />
      
      {/* Main content area with sidebar */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar - hidden on small screens, can be enhanced with toggle */}
        <div className="d-none d-md-block" style={{ width: '250px', flexShrink: 0 }}>
          <Sidebar />
        </div>
        
        {/* Main content area */}
        <main className="flex-grow-1 p-4 bg-light" style={{ overflowY: 'auto' }}>
          <div className="container-fluid">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

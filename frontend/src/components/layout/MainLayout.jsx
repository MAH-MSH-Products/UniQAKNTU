import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import WidgetsPanel from './WidgetsPanel';
import Footer from './Footer';

/**
 * MainLayout Component - Application Shell
 * 
 * Wrapper component that provides the main application structure.
 * Includes Navbar, Sidebar, main content area with Outlet for routing,
 * WidgetsPanel for dynamic side content, and Footer.
 * 
 * Layout Structure:
 * - Desktop: 3-column layout (Sidebar | Main Content | WidgetsPanel) + Footer
 * - Mobile: Stacked layout (WidgetsPanel at bottom) + Footer
 */

const MainLayout = () => {
  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
      {/* Top Navigation Bar */}
      <Navbar />
      
      {/* Main content area with sidebar and widgets panel */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar - hidden on small screens */}
        <div className="d-none d-md-block" style={{ width: '250px', flexShrink: 0 }}>
          <Sidebar />
        </div>
        
        {/* Main content area */}
        <main className="flex-grow-1 p-4" style={{ overflowY: 'auto', backgroundColor: 'var(--background-color)' }}>
          <div className="container-fluid">
            <Outlet />
          </div>
        </main>
        
        {/* Widgets Panel - hidden on mobile, shown on desktop */}
        <div className="d-none d-lg-block">
          <WidgetsPanel />
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default MainLayout;

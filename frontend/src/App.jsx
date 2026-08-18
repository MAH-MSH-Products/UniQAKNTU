import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import SupportCenter from './pages/support/SupportCenter';
import AdminSupportPanel from './pages/admin/AdminSupportPanel';

/**
 * App Component - Main Application Entry Point
 * 
 * Sets up routing structure and provides authentication context.
 * Configures protected and public routes with layout wrapper.
 */

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Routes with MainLayout (Navbar + Sidebar) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<div className="p-4"><h2>Courses Page</h2></div>} />
            <Route path="/support" element={<SupportCenter />} />
            <Route path="/admin/support" element={<AdminSupportPanel />} />
            <Route path="/tickets" element={<div className="p-4"><h2>My Tickets Page</h2></div>} />
            <Route path="/reports" element={<div className="p-4"><h2>Reports Page</h2></div>} />
            <Route path="/instructor/dashboard" element={<div className="p-4"><h2>Instructor Dashboard</h2></div>} />
            <Route path="/instructor/answers" element={<div className="p-4"><h2>Manage Answers</h2></div>} />
          </Route>
          
          {/* Standalone routes (no layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<div className="container mt-5"><h2>Register Page</h2></div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

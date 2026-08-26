import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SourceMaterialsProvider } from './context/SourceMaterialsContext';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import RequireAuth from './components/auth/RequireAuth';
import RequireInstructor from './components/auth/RequireInstructor';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SupportCenter from './pages/support/SupportCenter';
import AdminSupportPanel from './pages/admin/AdminSupportPanel';
import QuestionExplorer from './components/wiki/QuestionExplorer';
import AnswerDetail from './components/wiki/AnswerDetail';
import './i18n';
import i18n from 'i18next';

/**
 * App Component - Main Application Entry Point
 * 
 * Sets up routing structure and provides authentication context.
 * Configures protected and public routes with layout wrappers.
 * Handles RTL/LTR direction switching based on active language.
 * Implements route protection using RequireAuth and RequireInstructor wrappers.
 * 
 * Phase 4 Updates:
 * - Added SourceMaterialsProvider for caching source materials
 * - Updated routes to use flat endpoint structure instead of nested paths
 * - Replaced /curriculum/courses/ with /source-materials/
 * - Replaced /wiki/questions/:id/answers/ with /questions/:questionId/answers/
 * - Added /answers/:answerId/ route for single answer detail
 */

function App() {
  // Handle RTL/LTR direction switching based on language
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      document.documentElement.dir = lng === 'fa' ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;
    };

    // Set initial direction
    handleLanguageChange(i18n.language);

    // Listen for language changes
    i18n.on('languageChanged', handleLanguageChange);

    // Cleanup listener on unmount
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <SourceMaterialsProvider>
          <Routes>
            {/* Public Routes - Accessible to everyone */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              
              {/* Phase 4: Source Materials routes (replaces /curriculum/courses/) */}
              <Route path="/source-materials" element={<div className="p-4"><h2>Source Materials List</h2></div>} />
              <Route path="/source-materials/:id" element={<div className="p-4"><h2>Source Material Detail</h2></div>} />
            </Route>

            {/* Protected Routes - Require Authentication */}
            <Route element={<RequireAuth />}>
              <Route element={<MainLayout />}>
                <Route path="/support" element={<SupportCenter />} />
                <Route path="/support/tickets" element={<div className="p-4"><h2>My Tickets Page</h2></div>} />
                <Route path="/tickets" element={<div className="p-4"><h2>My Tickets Page</h2></div>} />
                <Route path="/reports" element={<div className="p-4"><h2>Reports Page</h2></div>} />
                <Route path="/admin/reports" element={<div className="p-4"><h2>Reports Page</h2></div>} />
                <Route path="/admin/support" element={<AdminSupportPanel />} />
                
                {/* Phase 4: Questions and Answers routes with flat structure */}
                <Route path="/questions/:questionId/answers" element={<QuestionExplorer />} />
                <Route path="/answers/:answerId" element={<AnswerDetail />} />
              </Route>
            </Route>

            {/* Instructor Routes - Require Instructor Role */}
            <Route element={<RequireInstructor />}>
              <Route element={<MainLayout />}>
                <Route path="/instructor/dashboard" element={<div className="p-4"><h2>Instructor Dashboard</h2></div>} />
                <Route path="/instructor/answers" element={<div className="p-4"><h2>Manage Answers</h2></div>} />
              </Route>
            </Route>
            
            {/* Auth Routes - Login/Register with AuthLayout */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
          </Routes>
        </SourceMaterialsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SourceMaterialsProvider } from './context/SourceMaterialsContext';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import RequireAuth from './components/auth/RequireAuth';
import RequireInstructor from './components/auth/RequireInstructor';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SourceMaterialsList from './pages/SourceMaterialsList';
import SupportCenter from './pages/support/SupportCenter';
import AdminSupportPanel from './pages/admin/AdminSupportPanel';
import UserReports from './pages/support/UserReports';
import QuestionExplorer from './components/wiki/QuestionExplorer';
import AnswerDetail from './components/wiki/AnswerDetail';
import './i18n';
import i18n from 'i18next';
import Profile from './pages/Profile';

function App() {
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      document.documentElement.dir = lng === 'fa' ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;
    };
    handleLanguageChange(i18n.language);
    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <SourceMaterialsProvider>
          <Routes>
            {/* Public Routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/source-materials" element={<SourceMaterialsList />} />
              <Route path="/source-materials/:id" element={<div className="p-4"><h2>Source Material Detail</h2></div>} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/source-materials/:examId/questions" element={<QuestionExplorer />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<RequireAuth />}>
              <Route element={<MainLayout />}>
                <Route path="/support" element={<SupportCenter />} />
                <Route path="/tickets" element={<SupportCenter />} />
                <Route path="/reports" element={<UserReports />} />
                <Route path="/admin" element={<Navigate to="/admin/support" replace />} />
                <Route path="/admin/support" element={<AdminSupportPanel />} />
                <Route path="/answers/:answerId" element={<AnswerDetail />} />
              </Route>
            </Route>

            {/* Instructor Routes */}
            <Route element={<RequireInstructor />}>
              <Route element={<MainLayout />}>
                <Route path="/instructor/dashboard" element={<div className="p-4"><h2>Instructor Dashboard</h2></div>} />
                <Route path="/instructor/answers" element={<div className="p-4"><h2>Manage Answers</h2></div>} />
              </Route>
            </Route>
            
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<div className="p-4">Forgot Password Component (Work in Progress)</div>} />
            </Route>
          </Routes>
        </SourceMaterialsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
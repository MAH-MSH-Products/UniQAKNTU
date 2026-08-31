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
import VerifyEmail from './pages/VerifyEmail';
import SourceMaterialsList from './pages/SourceMaterialsList';
import SupportCenter from './pages/support/SupportCenter';
import AdminSupportPanel from './pages/admin/AdminSupportPanel';
import UserReports from './pages/support/UserReports';
import QuestionExplorer from './components/wiki/QuestionExplorer';
import QuestionDetail from './components/wiki/QuestionDetail';
import AnswerDetail from './components/wiki/AnswerDetail';
import Profile from './pages/Profile';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import ManageAnswers from './pages/instructor/ManageAnswers';
import './i18n';
import i18n from 'i18next';
import ForgotPassword from './pages/ForgotPassword';
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
            {/* Public Routes - Accessible to everyone */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/source-materials" element={<SourceMaterialsList />} />
              <Route path="/source-materials/:id" element={<div className="p-4"><h2>Source Material Detail</h2></div>} />
              <Route path="/profile" element={<Profile />} />
              
              <Route path="/source-materials/:examId/questions" element={<QuestionExplorer />} />
              {/* New Route for individual question details */}
              <Route path="/questions/:id" element={<QuestionDetail />} />
            </Route>

            {/* Protected Routes - Require Authentication */}
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

            {/* Instructor Routes - Require Instructor Role */}
            <Route element={<RequireInstructor />}>
              <Route element={<MainLayout />}>
                <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
                <Route path="/instructor/answers" element={<ManageAnswers />} />
              </Route>
            </Route>
            
            {/* Auth Routes - Login/Register with AuthLayout */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>
          </Routes>
        </SourceMaterialsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
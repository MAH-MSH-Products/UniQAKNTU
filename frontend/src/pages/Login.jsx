// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { FiUser, FiLock } from 'react-icons/fi';
import 'bootstrap/dist/css/bootstrap.min.css';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const result = await login(identifier, password);
    
    if (result.success) {
      navigate('/');
    } else {
      // اگر حساب تایید نشده بود، به صفحه Verify می‌رویم و دستور ارسال خودکار کد را صادر می‌کنیم
      if (result.error === 'email_not_verified') {
        navigate('/verify-email', { 
          state: { 
            email: identifier.includes('@') ? identifier : '', 
            autoSendOtp: true 
          } 
        });
      } else {
        setError(result.error);
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-avatar">
          <FiUser />
        </div>
        
        <h1 className="auth-title">{t('login.title_short', 'LOGIN')}</h1>
        
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <FiUser className="auth-input-icon" />
            <input
              type="text"
              className="auth-input"
              placeholder={t('login.username', 'Username or Email')}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="auth-input-group">
            <FiLock className="auth-input-icon" />
            <input
              type="password"
              className="auth-input"
              placeholder={t('login.password', 'Password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="auth-options">
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <span className="ms-2">{t('login.remember_me', 'Remember me')}</span>
            </label>
            <Link to="/forgot-password" className="auth-link">
              {t('login.forgot_password', 'Forgot Password?')}
            </Link>
          </div>
          
          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {t('common.loading', 'Loading...')}
              </>
            ) : (
              t('login.login_button', 'LOGIN')
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          {t('nav.dont_have_account', "Don't have an account?")}{' '}
          <Link to="/register">{t('nav.register_here', 'Register here')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
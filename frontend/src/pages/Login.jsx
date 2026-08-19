import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { FiUser, FiMail, FiLock, FiCheck } from 'react-icons/fi';
import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * Login Component - Modern Gradient Auth Page
 * 
 * Provides a modern, full-screen gradient-based login interface.
 * Features centered layout with avatar icon, minimalist inputs, and prominent CTA.
 * Uses AuthContext to manage login state and redirection.
 * Uses i18n translations for all text content.
 */

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(username, password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        {/* Avatar Icon */}
        <div className="auth-avatar">
          <FiUser />
        </div>
        
        {/* Title */}
        <h1 className="auth-title">{t('login.title_short')}</h1>
        
        {/* Error Message */}
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Username/Email Input */}
          <div className="auth-input-group">
            <FiMail className="auth-input-icon" />
            <input
              type="text"
              className="auth-input"
              placeholder={t('login.username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          {/* Password Input */}
          <div className="auth-input-group">
            <FiLock className="auth-input-icon" />
            <input
              type="password"
              className="auth-input"
              placeholder={t('login.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          {/* Remember Me & Forgot Password */}
          <div className="auth-options">
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              {t('login.remember_me')}
            </label>
            <Link to="/forgot-password" className="auth-link">
              {t('login.forgot_password')}
            </Link>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {t('login.logging_in')}
              </>
            ) : (
              t('login.login_button')
            )}
          </button>
        </form>
        
        {/* Footer Link */}
        <div className="auth-footer">
          {t('nav.dont_have_account')}{' '}
          <Link to="/register">{t('nav.register_here')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiUser, FiMail, FiLock } from 'react-icons/fi';
import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * Register Component - Modern Gradient Auth Page
 * 
 * Provides a modern, full-screen gradient-based registration interface.
 * Matches the aesthetic of the Login component.
 * Uses i18n translations for all text content.
 */

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError(t('register.password_mismatch', 'Passwords do not match.'));
      return;
    }

    setIsLoading(true);

    try {
      // ⚠️ Mock API Call - Backend integration required later
      console.log('Mock Registration Data:', formData);
      await new Promise(resolve => setTimeout(resolve, 800)); // simulate delay
      
      // On success, redirect to login
      navigate('/login');
    } catch (err) {
      setError(t('common.error', 'An error occurred during registration.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        {/* Avatar Icon */}
        <div className="auth-avatar">
          <FiUser />
        </div>
        
        {/* Title */}
        <h1 className="auth-title">{t('nav.register', 'REGISTER')}</h1>
        
        {/* Error Message */}
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Username Input */}
          <div className="auth-input-group">
            <FiUser className="auth-input-icon" />
            <input
              type="text"
              name="username"
              className="auth-input"
              placeholder={t('login.username', 'Username')}
              value={formData.username}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>

          {/* Email Input */}
          <div className="auth-input-group">
            <FiMail className="auth-input-icon" />
            <input
              type="email"
              name="email"
              className="auth-input"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>
          
          {/* Password Input */}
          <div className="auth-input-group">
            <FiLock className="auth-input-icon" />
            <input
              type="password"
              name="password"
              className="auth-input"
              placeholder={t('login.password', 'Password')}
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>

          {/* Confirm Password Input */}
          <div className="auth-input-group">
            <FiLock className="auth-input-icon" />
            <input
              type="password"
              name="confirmPassword"
              className="auth-input"
              placeholder={t('register.confirm_password', 'Confirm Password')}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            className="auth-button mt-4"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {t('common.loading', 'Loading...')}
              </>
            ) : (
              t('nav.register', 'REGISTER')
            )}
          </button>
        </form>
        
        {/* Footer Link */}
        <div className="auth-footer">
          {t('register.already_have_account', 'Already have an account?')} {' '}
          <Link to="/login">{t('nav.login', 'Login here')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
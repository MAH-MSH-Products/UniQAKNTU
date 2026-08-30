import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiUser, FiMail, FiLock } from 'react-icons/fi';
import api from '../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';

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
      // Connect to the real backend registration endpoint
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password2: formData.confirmPassword // Backend requires password2
      };
      
      await api.post('/auth/register/', payload);
      
      // On success, redirect to verify-email page and pass the email
      navigate('/verify-email', { state: { email: formData.email } });
    } catch (err) {
      console.error('Registration error:', err);
      // Extract specific validation errors if available
      let errorMessage = t('common.error', 'An error occurred during registration.');
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          // Get the first error message from the object values
          const firstError = Object.values(errorData)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          } else if (typeof firstError === 'string') {
            errorMessage = firstError;
          }
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-avatar">
          <FiUser />
        </div>
        
        <h1 className="auth-title">{t('nav.register', 'REGISTER')}</h1>
        
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
              name="username"
              className="auth-input"
              placeholder={t('login.username', 'Username')}
              value={formData.username}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="auth-input-group">
            <FiMail className="auth-input-icon" />
            <input
              type="email"
              name="email"
              className="auth-input"
              placeholder={t('register.email', 'Email')}
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={isLoading}
            />
          </div>
          
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
        
        <div className="auth-footer">
          {t('register.already_have_account', 'Already have an account?')} {' '}
          <Link to="/login">{t('nav.login', 'Login here')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
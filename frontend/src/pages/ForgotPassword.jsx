// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiMail, FiLock, FiKey } from 'react-icons/fi';
import api from '../services/api';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    new_password: '',
    new_password2: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Step 1: Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await api.post('/auth/send-otp/', { 
        email: formData.email, 
        otp_type: 'password_reset' 
      });
      setSuccessMsg(t('auth.otp_sent_reset', 'OTP code sent to your email.'));
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || t('common.error', 'Failed to send OTP.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.new_password !== formData.new_password2) {
      setError(t('register.passwords_mismatch', 'Passwords do not match.'));
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password/', formData);
      setSuccessMsg(t('auth.reset_success', 'Password reset successfully! Redirecting...'));
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || t('common.error', 'Failed to reset password.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-avatar">
          <FiLock />
        </div>
        
        <h2 className="auth-title mb-2 fs-3">{t('login.forgot_password', 'Forgot Password')}</h2>
        
        {error && <div className="auth-error" role="alert">{error}</div>}
        {successMsg && <div className="alert alert-success py-2 text-center small border-0" style={{ background: 'rgba(25, 135, 84, 0.8)', color: 'white' }}>{successMsg}</div>}
        
        {step === 1 ? (
          <form onSubmit={handleRequestOtp}>
            <p className="text-center mb-4 text-white-50 small">
              {t('auth.forgot_password_desc', 'Enter your email to receive a password reset code.')}
            </p>
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
            <button type="submit" className="auth-button mt-2" disabled={isLoading || !formData.email}>
              {isLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : t('auth.send_reset_link', 'Send Reset Code')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <p className="text-center mb-4 text-white-50 small">
              {t('auth.enter_otp_new_pass', 'Enter the OTP sent to your email and your new password.')}
            </p>
            <div className="auth-input-group">
              <FiKey className="auth-input-icon" />
              <input
                type="text"
                name="otp"
                className="auth-input"
                placeholder={t('auth.otp_placeholder', '6-Digit Code')}
                value={formData.otp}
                onChange={handleInputChange}
                required
                maxLength="6"
                disabled={isLoading || successMsg.includes('Redirecting')}
              />
            </div>
            <div className="auth-input-group">
              <FiLock className="auth-input-icon" />
              <input
                type="password"
                name="new_password"
                className="auth-input"
                placeholder={t('auth.new_password', 'New Password')}
                value={formData.new_password}
                onChange={handleInputChange}
                required
                disabled={isLoading || successMsg.includes('Redirecting')}
              />
            </div>
            <div className="auth-input-group">
              <FiLock className="auth-input-icon" />
              <input
                type="password"
                name="new_password2"
                className="auth-input"
                placeholder={t('register.confirm_password', 'Confirm Password')}
                value={formData.new_password2}
                onChange={handleInputChange}
                required
                disabled={isLoading || successMsg.includes('Redirecting')}
              />
            </div>
            <button type="submit" className="auth-button mt-2" disabled={isLoading || successMsg.includes('Redirecting')}>
              {isLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : t('auth.reset_password_btn', 'Reset Password')}
            </button>
          </form>
        )}
        
        <div className="auth-footer mt-4 pt-3 border-top border-secondary border-opacity-50">
          <Link to="/login">{t('nav.login', 'Back to Login')}</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
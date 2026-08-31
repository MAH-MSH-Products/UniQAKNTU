// src/pages/VerifyEmail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiMail, FiKey } from 'react-icons/fi';
import api from '../services/api';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const initialEmail = location.state?.email || '';
  const autoSendOtp = location.state?.autoSendOtp || false;

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Automatically request OTP only if coming from Login with autoSendOtp flag
  useEffect(() => {
    if (initialEmail && autoSendOtp) {
      handleResendInit(initialEmail);
    }
  }, []);

  const handleResendInit = async (targetEmail) => {
    setIsResending(true);
    try {
      await api.post('/auth/send-otp/', { email: targetEmail, otp_type: 'verify_email' });
      setSuccessMsg(t('auth.otp_resent', 'A new verification code has been sent to your email.'));
    } catch (err) {
      console.error('Auto resend error:', err);
      // It's okay if this fails silently on init, but we can show an error
      setError(err.response?.data?.detail || err.response?.data?.message || t('common.error', 'Failed to resend code.'));
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    if (otp.length !== 6) {
      setError(t('auth.invalid_otp_length', 'OTP must be exactly 6 digits.'));
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/auth/verify-email/', { email, otp });
      setSuccessMsg(t('auth.email_verified_success', 'Email verified successfully! Redirecting to login...'));
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || t('common.error', 'Verification failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError(t('auth.email_required_resend', 'Please enter your email to resend the code.'));
      return;
    }
    
    setError('');
    setSuccessMsg('');
    setIsResending(true);
    
    try {
      await api.post('/auth/send-otp/', { email, otp_type: 'verify_email' });
      setSuccessMsg(t('auth.otp_resent', 'A new verification code has been sent to your email.'));
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || t('common.error', 'Failed to resend code.'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-avatar">
          <FiMail />
        </div>
        
        <h2 className="auth-title mb-2 fs-3">{t('auth.verify_email', 'Verify Email')}</h2>
        
        {/* Removed text-white-50 causing visibility issues */}
        <p className="text-center mb-4 text-muted small">
          {t('auth.verify_email_desc', 'Please enter the 6-digit code sent to your email address.')}
        </p>
        
        {error && <div className="auth-error" role="alert">{error}</div>}
        {successMsg && <div className="alert alert-success py-2 text-center small border-0" style={{ background: 'rgba(25, 135, 84, 0.8)', color: 'white' }}>{successMsg}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <FiMail className="auth-input-icon" />
            <input
              type="email"
              className="auth-input"
              placeholder={t('register.email', 'Email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || successMsg.includes('Redirecting')}
            />
          </div>

          <div className="auth-input-group">
            <FiKey className="auth-input-icon" />
            <input
              type="text"
              className="auth-input"
              placeholder={t('auth.otp_placeholder', '6-Digit Code')}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength="6"
              disabled={isLoading || successMsg.includes('Redirecting')}
            />
          </div>
          
          <button
            type="submit"
            className="auth-button mt-2"
            disabled={isLoading || !email || !otp || successMsg.includes('Redirecting')}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {t('common.loading', 'Loading...')}
              </>
            ) : (
              t('auth.verify_button', 'Verify Account')
            )}
          </button>
        </form>

        <div className="text-center mt-4 mb-2">
          {/* Changed color from text-white-50 to text-muted to support dark/light modes */}
          <button 
            type="button" 
            className="btn btn-link text-muted p-0 text-decoration-none small fw-bold"
            onClick={handleResend}
            disabled={isResending || isLoading || successMsg.includes('Redirecting')}
          >
            {isResending ? (
               <><span className="spinner-border spinner-border-sm me-1"></span> Sending...</>
            ) : (
              t('auth.resend_code', "Didn't receive the code? Resend")
            )}
          </button>
        </div>
        
        <div className="auth-footer mt-2 pt-3 border-top border-secondary border-opacity-50">
          <Link to="/login" className="text-primary fw-bold">{t('common.back', 'Back')}</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiSave, FiShield, FiDollarSign } from 'react-icons/fi';
import api from '../services/api';

const Profile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'security', or 'wallet'
  const [loading, setLoading] = useState(true);
  const [tokenHistory, setTokenHistory] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);

  // Profile State
  const [profileData, setProfileData] = useState({
    username: '',
    first_name: '',
    last_name: ''
  });
  const [profileStatus, setProfileStatus] = useState({ type: '', message: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password State
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password2: ''
  });
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  // Email Change State
  const [emailData, setEmailData] = useState({
    current_password: '',
    new_email: '',
    otp: ''
  });
  const [emailStep, setEmailStep] = useState(1); // 1: Request, 2: Verify
  const [emailStatus, setEmailStatus] = useState({ type: '', message: '' });
  const [savingEmail, setSavingEmail] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'wallet') {
      fetchTokenHistory();
    }
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/me/');
      setProfileData({
        username: response.data.username || '',
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || ''
      });
      setCurrentEmail(response.data.email || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileStatus({ type: 'danger', message: t('common.error', 'Failed to load profile data.') });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileStatus({ type: '', message: '' });
    try {
      await api.patch('/auth/me/', profileData);
      setProfileStatus({ type: 'success', message: t('profile.update_success', 'Profile updated successfully!') });
    } catch (error) {
      setProfileStatus({ 
        type: 'danger', 
        message: error.response?.data?.detail || error.response?.data?.username?.[0] || t('profile.update_failed', 'Failed to update profile.') 
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.new_password2) {
      setPasswordStatus({ type: 'danger', message: t('profile.passwords_mismatch', 'New passwords do not match.') });
      return;
    }
    
    setSavingPassword(true);
    setPasswordStatus({ type: '', message: '' });
    
    try {
      await api.post('/auth/change-password/', passwordData);
      setPasswordStatus({ type: 'success', message: t('profile.update_success', 'Password changed successfully!') });
      setPasswordData({ current_password: '', new_password: '', new_password2: '' });
    } catch (error) {
      setPasswordStatus({ 
        type: 'danger', 
        message: error.response?.data?.detail || error.response?.data?.new_password?.[0] || t('profile.update_failed', 'Failed to change password.') 
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleEmailRequestSubmit = async (e) => {
    e.preventDefault();
    setSavingEmail(true);
    setEmailStatus({ type: '', message: '' });
    
    try {
      await api.post('/auth/change-email/request/', {
        current_password: emailData.current_password,
        new_email: emailData.new_email
      });
      setEmailStatus({ type: 'success', message: t('auth.otp_sent_reset', 'OTP sent to your new email.') });
      setEmailStep(2);
    } catch (error) {
      setEmailStatus({ 
        type: 'danger', 
        message: error.response?.data?.detail || error.response?.data?.new_email?.[0] || t('profile.update_failed', 'Failed to request email change.') 
      });
    } finally {
      setSavingEmail(false);
    }
  };

  const handleEmailVerifySubmit = async (e) => {
    e.preventDefault();
    setSavingEmail(true);
    setEmailStatus({ type: '', message: '' });
    
    try {
      await api.post('/auth/change-email/verify/', { otp: emailData.otp });
      setEmailStatus({ type: 'success', message: t('profile.update_success', 'Email address updated successfully!') });
      setCurrentEmail(emailData.new_email);
      setEmailStep(1);
      setEmailData({ current_password: '', new_email: '', otp: '' });
    } catch (error) {
      setEmailStatus({ 
        type: 'danger', 
        message: error.response?.data?.detail || t('common.error', 'Invalid or expired OTP.') 
      });
    } finally {
      setSavingEmail(false);
    }
  };

  const fetchTokenHistory = async () => {
    setLoadingTokens(true);
    try {
      const response = await api.get('/users/me/token-history/');
      setTokenHistory(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching token history:', error);
    } finally {
      setLoadingTokens(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2">{t('common.loading', 'Loading...')}</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="d-flex align-items-center mb-4 gap-2">
            <FiUser size={28} className="text-primary" />
            <h2 className="mb-0 text-primary">{t('profile.title', 'My Profile')}</h2>
          </div>

          {/* Coursera-Style Tab Navigation */}
          <div className="coursera-tabs mb-4">
            <button
              className={activeTab === 'profile' ? 'coursera-tab-active' : 'coursera-tab'}
              onClick={() => setActiveTab('profile')}
            >
              {t('profile.public_profile', 'Public Profile')}
            </button>
            <button
              className={activeTab === 'wallet' ? 'coursera-tab-active' : 'coursera-tab'}
              onClick={() => setActiveTab('wallet')}
            >
              {t('profile.wallet', 'Wallet & Rewards')}
            </button>
            <button
              className={activeTab === 'security' ? 'coursera-tab-active' : 'coursera-tab'}
              onClick={() => setActiveTab('security')}
            >
              {t('profile.account_security', 'Account Security')}
            </button>
          </div>

          {activeTab === 'profile' && (
            <div className="academic-card border-0 shadow-sm">
              <div className="card-body">
                {profileStatus.message && (
                  <div className={`alert alert-${profileStatus.type} py-2`}>
                    {profileStatus.message}
                  </div>
                )}
                
                <form onSubmit={handleProfileSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold">{t('login.username', 'Username')}</label>
                    <div className="input-group">
                      <span className="input-group-text"><FiUser /></span>
                      <input
                        type="text"
                        name="username"
                        className="form-control"
                        value={profileData.username}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                    <small className="text-muted">{t('profile.username_help', 'Must be unique. Allowed characters: letters, digits and @/./+/-/_')}</small>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">{t('profile.first_name', 'First Name')}</label>
                      <input
                        type="text"
                        name="first_name"
                        className="form-control"
                        value={profileData.first_name}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div className="col-md-6 mb-4">
                      <label className="form-label fw-bold">{t('profile.last_name', 'Last Name')}</label>
                      <input
                        type="text"
                        name="last_name"
                        className="form-control"
                        value={profileData.last_name}
                        onChange={handleProfileChange}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 d-flex justify-content-center align-items-center gap-2"
                    disabled={savingProfile}
                  >
                    {savingProfile ? <span className="spinner-border spinner-border-sm"></span> : <FiSave />}
                    {t('common.save', 'Save Changes')}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'wallet' && (
            <div className="academic-card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                    <FiDollarSign /> {t('profile.token_balance', 'Token Balance')}
                  </h5>
                  <span className="badge bg-warning text-dark px-3 py-2" style={{ fontSize: '18px' }}>
                    🪙 {user?.tokens || 0}
                  </span>
                </div>

                <h6 className="fw-bold mb-3">{t('profile.transaction_history', 'Transaction History')}</h6>

                {loadingTokens ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                  </div>
                ) : tokenHistory.length === 0 ? (
                  <div className="alert alert-info">
                    {t('profile.no_transactions', 'No token transactions yet.')}
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>{t('profile.date', 'Date')}</th>
                          <th>{t('profile.reason', 'Reason')}</th>
                          <th className="text-end">{t('profile.amount', 'Amount')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tokenHistory.map((transaction, index) => (
                          <tr key={transaction.id || index}>
                            <td>
                              <small>{new Date(transaction.created_at || transaction.date).toLocaleDateString()}</small>
                            </td>
                            <td>{transaction.reason || transaction.description}</td>
                            <td className="text-end">
                              <span className={`badge ${transaction.amount > 0 ? 'bg-success' : 'bg-danger'}`}>
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount} 🪙
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="d-flex flex-column gap-4">
              
              {/* Change Password Section */}
              <div className="academic-card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
                  <h5 className="fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                    <FiLock /> {t('profile.change_password', 'Change Password')}
                  </h5>
                </div>
                <div className="card-body pt-3">
                  {passwordStatus.message && (
                    <div className={`alert alert-${passwordStatus.type} py-2`}>
                      {passwordStatus.message}
                    </div>
                  )}
                  <form onSubmit={handlePasswordSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-bold">{t('profile.current_password', 'Current Password')}</label>
                      <input
                        type="password"
                        name="current_password"
                        className="form-control"
                        value={passwordData.current_password}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold">{t('profile.new_password', 'New Password')}</label>
                      <input
                        type="password"
                        name="new_password"
                        className="form-control"
                        value={passwordData.new_password}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-bold">{t('profile.confirm_new_password', 'Confirm New Password')}</label>
                      <input
                        type="password"
                        name="new_password2"
                        className="form-control"
                        value={passwordData.new_password2}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-outline-primary w-100"
                      disabled={savingPassword}
                    >
                      {savingPassword ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                      {t('profile.update_password_btn', 'Update Password')}
                    </button>
                  </form>
                </div>
              </div>

              {/* Change Email Section */}
              <div className="academic-card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom-0 pt-3 pb-0">
                  <h5 className="fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                    <FiShield /> {t('profile.change_email', 'Change Email Address')}
                  </h5>
                </div>
                <div className="card-body pt-3">
                  <p className="small text-muted mb-4">
                    {t('profile.current_email', 'Current Email:')} <strong>{currentEmail}</strong>
                  </p>
                  
                  {emailStatus.message && (
                    <div className={`alert alert-${emailStatus.type} py-2`}>
                      {emailStatus.message}
                    </div>
                  )}

                  {emailStep === 1 && (
                    <form onSubmit={handleEmailRequestSubmit}>
                      <div className="mb-3">
                        <label className="form-label fw-bold">{t('profile.current_password', 'Current Password')}</label>
                        <input
                          type="password"
                          name="current_password"
                          className="form-control"
                          value={emailData.current_password}
                          onChange={handleEmailChange}
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="form-label fw-bold">{t('profile.new_email', 'New Email Address')}</label>
                        <input
                          type="email"
                          name="new_email"
                          className="form-control"
                          value={emailData.new_email}
                          onChange={handleEmailChange}
                          required
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="btn btn-outline-primary w-100"
                        disabled={savingEmail}
                      >
                        {savingEmail ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                        {t('profile.request_email_change', 'Request Email Change')}
                      </button>
                    </form>
                  )}

                  {emailStep === 2 && (
                    <form onSubmit={handleEmailVerifySubmit}>
                      <div className="alert alert-warning py-2 small mb-3">
                        {t('profile.enter_otp_sent_to', 'Enter the 6-digit code sent to')} <strong>{emailData.new_email}</strong>
                      </div>
                      <div className="mb-4">
                        <label className="form-label fw-bold">{t('profile.otp_code', 'OTP Code')}</label>
                        <input
                          type="text"
                          name="otp"
                          className="form-control text-center letter-spacing-2"
                          maxLength="6"
                          value={emailData.otp}
                          onChange={handleEmailChange}
                          required
                        />
                      </div>
                      <div className="d-flex gap-2">
                        <button 
                          type="button" 
                          className="btn btn-secondary w-50"
                          onClick={() => setEmailStep(1)}
                          disabled={savingEmail}
                        >
                          {t('common.cancel', 'Cancel')}
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn-success w-50"
                          disabled={savingEmail || emailData.otp.length !== 6}
                        >
                          {savingEmail ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                          {t('profile.verify_and_change', 'Verify & Change')}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
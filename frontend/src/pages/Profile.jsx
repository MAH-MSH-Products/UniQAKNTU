import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiSave } from 'react-icons/fi';
import api from '../services/api';

const Profile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // دریافت اطلاعات کاربر فعلی از بک‌اند
      const response = await api.get('/users/me/');
      setFormData({
        username: response.data.username || '',
        email: response.data.email || '',
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setStatus({ type: 'danger', message: t('common.error', 'Failed to load profile data.') });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      // ارسال اطلاعات ویرایش شده به بک‌اند
      await api.patch('/users/me/', formData);
      setStatus({ type: 'success', message: t('profile.update_success', 'Profile updated successfully!') });
    } catch (error) {
      console.error('Error updating profile:', error);
      setStatus({ 
        type: 'danger', 
        message: error.response?.data?.message || t('profile.update_failed', 'Failed to update profile.') 
      });
    } finally {
      setSaving(false);
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
          <div className="academic-card">
            <div className="card-header bg-white border-bottom-0 pb-0">
              <h4 className="fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                <FiUser /> {t('profile.title', 'My Profile')}
              </h4>
              <p className="text-muted small mt-1">
                {t('profile.subtitle', 'Manage your account settings and personal information.')}
              </p>
            </div>
            
            <div className="card-body">
              {status.message && (
                <div className={`alert alert-${status.type} py-2`}>
                  {status.message}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">{t('profile.first_name', 'First Name')}</label>
                    <input
                      type="text"
                      name="first_name"
                      className="form-control"
                      value={formData.first_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">{t('profile.last_name', 'Last Name')}</label>
                    <input
                      type="text"
                      name="last_name"
                      className="form-control"
                      value={formData.last_name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">{t('login.username', 'Username')}</label>
                  <div className="input-group">
                    <span className="input-group-text"><FiUser /></span>
                    <input
                      type="text"
                      name="username"
                      className="form-control"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold">{t('register.email', 'Email')}</label>
                  <div className="input-group">
                    <span className="input-group-text"><FiMail /></span>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 d-flex justify-content-center align-items-center gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <FiSave />
                  )}
                  {t('common.save', 'Save Changes')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
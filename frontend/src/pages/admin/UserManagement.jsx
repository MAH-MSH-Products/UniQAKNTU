import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api, { extractResults } from '../../services/api';
import { useTranslation } from 'react-i18next';

/**
 * UserManagement Component - Admin User Management Dashboard
 * 
 * Displays all users with their current roles.
 * Only accessible to users with ADMIN role.
 * Provides ability to promote/demote users between roles.
 */

const UserManagement = () => {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  
  // State for users list
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (searchTerm) params.search = searchTerm;
      
      const response = await api.get('/users/', { params });
      setUsers(extractResults(response));
      setError(null);
    } catch (err) {
      setError(t('user_management.failed_load_users'));
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load users on mount and when filters change
  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
  }, [roleFilter]);

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/users/${userId}/role/`, { role: newRole });
      
      // Refresh the list after role change
      fetchUsers();
    } catch (err) {
      console.error('Failed to update role:', err);
      alert(t('user_management.role_update_failed'));
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-danger';
      case 'MODERATOR':
        return 'bg-primary';
      case 'STUDENT':
      default:
        return 'bg-secondary';
    }
  };

  // Check if user has admin permissions
  if (!isAdmin) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          {t('user_management.access_denied')}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">{t('user_management.dashboard_title')}</h2>
      
      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder={t('user_management.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchUsers()}
          />
        </div>
        <div className="col-md-4">
          <select
            className="form-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">{t('user_management.all_roles')}</option>
            <option value="STUDENT">{t('user_management.role_student')}</option>
            <option value="MODERATOR">{t('user_management.role_moderator')}</option>
            <option value="ADMIN">{t('user_management.role_admin')}</option>
          </select>
        </div>
        <div className="col-md-2">
          <button 
            className="btn btn-primary w-100"
            onClick={fetchUsers}
          >
            {t('common.search')}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="d-flex justify-content-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">{t('common.loading')}</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="alert alert-danger">{error}</div>
      )}

      {/* Users Table */}
      {!loading && !error && (
        <div className="table-responsive">
          <table className="table table-hover table-bordered">
            <thead className="table-light">
              <tr>
                <th>{t('user_management.username')}</th>
                <th>{t('user_management.email')}</th>
                <th>{t('user_management.full_name')}</th>
                <th>{t('user_management.current_role')}</th>
                <th>{t('user_management.date_joined')}</th>
                <th>{t('user_management.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">
                    {t('user_management.no_users_found')}
                  </td>
                </tr>
              ) : (
                users.map((userData) => (
                  <tr key={userData.id}>
                    <td>{userData.username}</td>
                    <td>{userData.email}</td>
                    <td>{`${userData.first_name || ''} ${userData.last_name || ''}`.trim() || '-'}</td>
                    <td>
                      <span className={`badge ${getRoleBadgeColor(userData.role)}`}>
                        {t(`user_management.role_${userData.role.toLowerCase()}`)}
                      </span>
                    </td>
                    <td>{new Date(userData.date_joined).toLocaleDateString('fa-IR')}</td>
                    <td>
                      {/* Role Change Dropdown */}
                      {userData.role !== 'ADMIN' && (
                        <select
                          className="form-select form-select-sm"
                          value={userData.role}
                          onChange={(e) => handleRoleChange(userData.id, e.target.value)}
                          disabled={userData.role === 'ADMIN'}
                        >
                          <option value="STUDENT">{t('user_management.role_student')}</option>
                          <option value="MODERATOR">{t('user_management.role_moderator')}</option>
                          {isAdmin && (
                            <option value="ADMIN">{t('user_management.role_admin')}</option>
                          )}
                        </select>
                      )}
                      {userData.role === 'ADMIN' && (
                        <span className="text-muted small">{t('user_management.cannot_change_admin')}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;

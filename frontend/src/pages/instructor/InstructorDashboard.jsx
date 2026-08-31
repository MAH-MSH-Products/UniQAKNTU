import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMessageSquare, FiThumbsUp, FiCheckCircle } from 'react-icons/fi';
import api from '../../services/api';

const InstructorDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/users/me/stats/');
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching instructor stats:', err);
        setError(t('common.error', 'Failed to load dashboard statistics.'));
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [t]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('common.loading', 'Loading...')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div className="container-fluid py-4">
      <h2 className="page-heading mb-4">{t('pages.instructor_dashboard', 'Instructor Dashboard')}</h2>
      
      <div className="row g-4">
        {/* Total Answers Card */}
        <div className="col-md-4">
          <div className="academic-card h-100 d-flex align-items-center">
            <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
              <FiMessageSquare size={32} className="text-primary" />
            </div>
            <div>
              <h6 className="text-muted mb-1">{t('instructor.total_answers', 'Total Answers')}</h6>
              <h3 className="mb-0 fw-bold">{stats?.total_answers || 0}</h3>
            </div>
          </div>
        </div>

        {/* Total Upvotes Card */}
        <div className="col-md-4">
          <div className="academic-card h-100 d-flex align-items-center">
            <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
              <FiThumbsUp size={32} className="text-success" />
            </div>
            <div>
              <h6 className="text-muted mb-1">{t('instructor.total_upvotes', 'Total Upvotes')}</h6>
              <h3 className="mb-0 fw-bold">{stats?.total_upvotes || 0}</h3>
            </div>
          </div>
        </div>

        {/* Accepted Answers Card */}
        <div className="col-md-4">
          <div className="academic-card h-100 d-flex align-items-center">
            <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
              <FiCheckCircle size={32} className="text-info" />
            </div>
            <div>
              <h6 className="text-muted mb-1">{t('instructor.total_accepted', 'Accepted Answers')}</h6>
              <h3 className="mb-0 fw-bold">{stats?.total_accepted_answers || 0}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
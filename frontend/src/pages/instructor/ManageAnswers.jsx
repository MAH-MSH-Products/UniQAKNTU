import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api, { extractResults } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiEye, FiTrash2 } from 'react-icons/fi';

const ManageAnswers = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyAnswers = async () => {
    setLoading(true);
    try {
      // Fetch answers belonging to the current user
      const response = await api.get(`/answers/?author=${user.id}`);
      setAnswers(extractResults(response));
    } catch (error) {
      console.error('Error fetching answers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchMyAnswers();
    }
  }, [user]);

  const handleDelete = async (id) => {
    if (window.confirm(t('answers.confirm_delete', 'Are you sure you want to delete this answer?'))) {
      try {
        await api.delete(`/answers/${id}/`);
        setAnswers(prev => prev.filter(ans => ans.id !== id));
      } catch (error) {
        console.error('Failed to delete answer:', error);
        alert(t('answers.delete_failed', 'Failed to delete the answer.'));
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'APPROVED') return 'bg-success';
    if (status === 'PENDING') return 'bg-warning text-dark';
    if (status === 'REJECTED') return 'bg-danger';
    return 'bg-secondary';
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="page-heading mb-4">{t('pages.manage_answers', 'Manage Answers')}</h2>
      
      <div className="card shadow-sm border-0">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('common.loading', 'Loading...')}</span>
              </div>
            </div>
          ) : answers.length === 0 ? (
            <div className="alert alert-info border-0 text-center">
              {t('common.no_data', 'No answers found.')}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>{t('admin.th_id', 'ID')}</th>
                    <th>{t('answer_detail.question', 'Question ID')}</th>
                    <th>{t('admin.th_status', 'Status')}</th>
                    <th>{t('admin.th_created', 'Created At')}</th>
                    <th>{t('admin.th_action', 'Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {answers.map(answer => (
                    <tr key={answer.id}>
                      <td>#{answer.id}</td>
                      <td>
                        <Link to={`/questions/${answer.question}`} className="text-decoration-none text-primary fw-bold">
                          #{answer.question}
                        </Link>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(answer.status)}`}>
                          {answer.status}
                        </span>
                        {answer.is_accepted && (
                          <span className="badge bg-info ms-2">{t('answers.accepted', 'Accepted')}</span>
                        )}
                      </td>
                      <td>{answer.created_at_jalali ? answer.created_at_jalali.split('T')[0] : ''}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Link to={`/answers/${answer.id}`} className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1">
                            <FiEye /> {t('admin.btn_view', 'View')}
                          </Link>
                          <button 
                            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                            onClick={() => handleDelete(answer.id)}
                          >
                            <FiTrash2 /> {t('common.delete', 'Delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageAnswers;
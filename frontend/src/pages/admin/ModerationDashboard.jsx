import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api, { extractResults } from '../../services/api';
import { useTranslation } from 'react-i18next';

/**
 * ModerationDashboard Component - Content Moderation Queue
 * 
 * Displays pending questions, pending answers, and suggested edits for moderation.
 * Only accessible to users with MODERATOR or ADMIN roles.
 * Provides tabs to switch between different content types.
 * Includes approve/reject actions for each item.
 */

const ModerationDashboard = () => {
  const { t } = useTranslation();
  const { user, canModerate } = useAuth();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('questions');
  
  // State for data
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [pendingAnswers, setPendingAnswers] = useState([]);
  const [suggestedEdits, setSuggestedEdits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch pending questions
  const fetchPendingQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/questions/', { params: { status: 'PENDING' } });
      setPendingQuestions(extractResults(response));
      setError(null);
    } catch (err) {
      setError(t('moderation.failed_load_questions'));
      console.error('Failed to load pending questions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending answers
  const fetchPendingAnswers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/answers/', { params: { status: 'PENDING' } });
      setPendingAnswers(extractResults(response));
      setError(null);
    } catch (err) {
      setError(t('moderation.failed_load_answers'));
      console.error('Failed to load pending answers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch suggested edits
  const fetchSuggestedEdits = async () => {
    try {
      setLoading(true);
      const response = await api.get('/suggested-edits/');
      setSuggestedEdits(extractResults(response));
      setError(null);
    } catch (err) {
      setError(t('moderation.failed_load_edits'));
      console.error('Failed to load suggested edits:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (!canModerate) return;
    
    switch (activeTab) {
      case 'questions':
        fetchPendingQuestions();
        break;
      case 'answers':
        fetchPendingAnswers();
        break;
      case 'edits':
        fetchSuggestedEdits();
        break;
      default:
        break;
    }
  }, [activeTab]);

  // Handle approve action
  const handleApprove = async (type, id) => {
    try {
      let endpoint;
      switch (type) {
        case 'question':
          endpoint = `/questions/${id}/approve/`;
          break;
        case 'answer':
          endpoint = `/answers/${id}/approve/`;
          break;
        case 'edit':
          endpoint = `/suggested-edits/${id}/approve/`;
          break;
        default:
          return;
      }
      
      await api.post(endpoint);
      
      // Refresh the list after approval
      switch (type) {
        case 'question':
          fetchPendingQuestions();
          break;
        case 'answer':
          fetchPendingAnswers();
          break;
        case 'edit':
          fetchSuggestedEdits();
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Failed to approve:', err);
      alert(t('moderation.approve_failed'));
    }
  };

  // Handle reject action
  const handleReject = async (type, id) => {
    try {
      let endpoint;
      switch (type) {
        case 'question':
          endpoint = `/questions/${id}/reject/`;
          break;
        case 'answer':
          endpoint = `/answers/${id}/reject/`;
          break;
        case 'edit':
          endpoint = `/suggested-edits/${id}/reject/`;
          break;
        default:
          return;
      }
      
      await api.post(endpoint);
      
      // Refresh the list after rejection
      switch (type) {
        case 'question':
          fetchPendingQuestions();
          break;
        case 'answer':
          fetchPendingAnswers();
          break;
        case 'edit':
          fetchSuggestedEdits();
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Failed to reject:', err);
      alert(t('moderation.reject_failed'));
    }
  };

  // Render question item
  const renderQuestionItem = (question) => (
    <div key={question.id} className="card mb-3">
      <div className="card-body">
        <h5 className="card-title">{question.title}</h5>
        <p className="card-text text-muted">
          {question.body?.substring(0, 200)}...
        </p>
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">
            {t('moderation.author')}: {question.author?.username} | 
            {t('moderation.date')}: {question.created_at_jalali}
          </small>
          <div>
            <button 
              className="btn btn-success btn-sm me-2"
              onClick={() => handleApprove('question', question.id)}
            >
              {t('moderation.approve')}
            </button>
            <button 
              className="btn btn-danger btn-sm"
              onClick={() => handleReject('question', question.id)}
            >
              {t('moderation.reject')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render answer item
  const renderAnswerItem = (answer) => (
    <div key={answer.id} className="card mb-3">
      <div className="card-body">
        <p className="card-text text-muted">
          {answer.body?.substring(0, 200)}...
        </p>
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">
            {t('moderation.author')}: {answer.author?.username} | 
            {t('moderation.date')}: {answer.created_at_jalali}
          </small>
          <div>
            <button 
              className="btn btn-success btn-sm me-2"
              onClick={() => handleApprove('answer', answer.id)}
            >
              {t('moderation.approve')}
            </button>
            <button 
              className="btn btn-danger btn-sm"
              onClick={() => handleReject('answer', answer.id)}
            >
              {t('moderation.reject')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render suggested edit item
  const renderEditItem = (edit) => (
    <div key={edit.id} className="card mb-3">
      <div className="card-body">
        <h6 className="card-subtitle mb-2 text-muted">
          {edit.content_type === 'question' ? t('moderation.question_edit') : t('moderation.answer_edit')}
        </h6>
        <p className="card-text">
          <strong>{t('moderation.proposed_text')}:</strong>
          <br />
          {edit.proposed_text?.substring(0, 200)}...
        </p>
        <div className="d-flex justify-content-between align-items-center">
          <small className="text-muted">
            {t('moderation.suggested_by')}: {edit.suggested_by?.username} | 
            {t('moderation.date')}: {edit.created_at_jalali}
          </small>
          <div>
            <button 
              className="btn btn-success btn-sm me-2"
              onClick={() => handleApprove('edit', edit.id)}
            >
              {t('moderation.approve')}
            </button>
            <button 
              className="btn btn-danger btn-sm"
              onClick={() => handleReject('edit', edit.id)}
            >
              {t('moderation.reject')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Check if user has moderation permissions
  if (!canModerate) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">
          {t('moderation.access_denied')}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">{t('moderation.dashboard_title')}</h2>
      
      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            {t('moderation.pending_questions')}
            {pendingQuestions.length > 0 && (
              <span className="badge bg-primary ms-2">{pendingQuestions.length}</span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'answers' ? 'active' : ''}`}
            onClick={() => setActiveTab('answers')}
          >
            {t('moderation.pending_answers')}
            {pendingAnswers.length > 0 && (
              <span className="badge bg-primary ms-2">{pendingAnswers.length}</span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'edits' ? 'active' : ''}`}
            onClick={() => setActiveTab('edits')}
          >
            {t('moderation.suggested_edits')}
            {suggestedEdits.length > 0 && (
              <span className="badge bg-primary ms-2">{suggestedEdits.length}</span>
            )}
          </button>
        </li>
      </ul>

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

      {/* Content Area */}
      {!loading && !error && (
        <div>
          {activeTab === 'questions' && (
            <div>
              {pendingQuestions.length === 0 ? (
                <div className="alert alert-info">{t('moderation.no_pending_questions')}</div>
              ) : (
                pendingQuestions.map(renderQuestionItem)
              )}
            </div>
          )}
          
          {activeTab === 'answers' && (
            <div>
              {pendingAnswers.length === 0 ? (
                <div className="alert alert-info">{t('moderation.no_pending_answers')}</div>
              ) : (
                pendingAnswers.map(renderAnswerItem)
              )}
            </div>
          )}
          
          {activeTab === 'edits' && (
            <div>
              {suggestedEdits.length === 0 ? (
                <div className="alert alert-info">{t('moderation.no_suggested_edits')}</div>
              ) : (
                suggestedEdits.map(renderEditItem)
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModerationDashboard;

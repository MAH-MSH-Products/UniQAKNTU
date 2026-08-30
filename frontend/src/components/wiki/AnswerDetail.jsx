import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAnswerById } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FiArrowLeft } from 'react-icons/fi';
import { processMarkdown, typesetMathJax, getAuthorDisplayName } from '../../services/utils';

const AnswerDetail = () => {
  const { answerId } = useParams();
  const { t } = useTranslation();
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAnswer = async () => {
      try {
        setLoading(true);
        const response = await getAnswerById(answerId);
        setAnswer(response.data);
      } catch (err) {
        console.error('Failed to fetch answer:', err);
        setError(err.message || t('answer_detail.error_loading', 'Failed to load answer'));
      } finally {
        setLoading(false);
      }
    };
    
    if (answerId) {
      fetchAnswer();
    }
  }, [answerId, t]);

  useEffect(() => {
    if (answer && answer.body) {
      setTimeout(() => { typesetMathJax(); }, 100);
    }
  }, [answer]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">{t('common.loading', 'Loading...')}</span>
        </div>
        <p className="mt-2">{t('common.loading', 'Loading...')}</p>
      </div>
    );
  }

  if (error || !answer) {
    return (
      <div className="alert alert-danger">
        <h4>{t('answer_detail.error_loading', 'Error Loading Answer')}</h4>
        <p>{error || t('answer_detail.not_found', 'Answer not found.')}</p>
        <Link to="/" className="btn btn-primary mt-2">{t('common.back', 'Back')}</Link>
      </div>
    );
  }

  const displayAuthorName = getAuthorDisplayName(answer.author, answer.author_name, user);

  const getStatusBadge = () => {
    if (answer.status === 'APPROVED') {
      return <span className="badge bg-success">{t('common.approved', 'Approved')}</span>;
    } else if (answer.status === 'PENDING') {
      return <span className="badge bg-warning">{t('common.pending', 'Pending Review')}</span>;
    } else if (answer.status === 'REJECTED') {
      return <span className="badge bg-danger">{t('common.rejected', 'Rejected')}</span>;
    }
    return null;
  };

  return (
    <div className="answer-detail container py-4">
      <div className="mb-4">
        <button onClick={() => window.history.back()} className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2">
          <FiArrowLeft /> {t('common.back', 'Back')}
        </button>
      </div>
      
      <div className="answer-card card shadow-sm">
        <div className="card-header bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0 text-primary">{t('answer_detail.title', 'Answer Details')}</h4>
              <small className="text-muted">ID: #{answer.id}</small>
            </div>
            <div>
              {getStatusBadge()}
            </div>
          </div>
        </div>
        
        <div className="card-body">
          <div className="d-flex justify-content-between mb-3 border-bottom pb-3">
            <div>
              <strong>{t('answer_detail.author', 'Author:')}</strong> {displayAuthorName}
              {answer.author?.role && (
                <span className="badge bg-secondary ms-2">{answer.author.role}</span>
              )}
            </div>
            
            {answer.question && (
              <div>
                <strong>{t('answer_detail.question', 'Question:')}</strong>
                <Link to={`/questions/${answer.question}`} className="ms-2 btn btn-sm btn-primary">
                  {t('answer_detail.view_question', 'View Question')}
                </Link>
              </div>
            )}
          </div>

          <div 
            className="answer-content my-4 p-4 bg-light rounded"
            dangerouslySetInnerHTML={{ __html: processMarkdown(answer.body || answer.text || '') }}
            style={{ lineHeight: '1.7', fontSize: '16px' }}
          />

          {answer.user_vote !== undefined && (
            <div className="mb-3">
              <strong>{t('answer_detail.your_vote', 'Your Vote:')}</strong>{' '}
              <span className={answer.user_vote === 1 ? 'text-success' : answer.user_vote === -1 ? 'text-danger' : 'text-muted'}>
                {answer.user_vote === 1 ? t('answer_detail.upvoted', 'Upvoted') : answer.user_vote === -1 ? t('answer_detail.downvoted', 'Downvoted') : t('answer_detail.no_vote', 'No vote')}
              </span>
            </div>
          )}

          {answer.created_at_jalali && (
            <div className="text-muted small">
              <p className="mb-1">
                <i className="bi bi-clock me-1"></i>
                <strong>{t('answer_detail.created', 'Created:')}</strong> {answer.created_at_jalali}
              </p>
            </div>
          )}

          {answer.image && (
            <div className="mt-4 border-top pt-3">
              <h6 className="text-muted mb-3">{t('answer_detail.attachments', 'Attachments:')}</h6>
              <img 
                src={answer.image} 
                alt="Answer attachment" 
                className="img-fluid rounded border shadow-sm"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
              />
            </div>
          )}

          {answer.pdf_file && (
            <div className="mt-3">
              <a 
                href={answer.pdf_file} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-2"
              >
                <i className="bi bi-file-earmark-pdf-fill"></i>
                {t('answer_detail.view_pdf', 'View/Download PDF')}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnswerDetail;